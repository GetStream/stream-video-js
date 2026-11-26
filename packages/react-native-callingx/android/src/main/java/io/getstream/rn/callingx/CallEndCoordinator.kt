package io.getstream.rn.callingx

import android.content.Context
import android.content.Intent
import android.telecom.DisconnectCause
import androidx.core.app.NotificationManagerCompat
import io.getstream.rn.callingx.model.CallAction
import io.getstream.rn.callingx.repo.CallRepository
import io.getstream.rn.callingx.repo.CallRepositoryFactory
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.channels.ClosedSendChannelException
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.takeWhile
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

/**
 * Owned by [CallingxClient] and reused by module and notification end-call requests.
 *
 * When a call is ended
 * 1. Leave the call from Telecom
 * 2. Remove incoming call notification
 */
internal class CallEndCoordinator(val context: Context) {

  private val TAG = "CallEndCoordinator"
  val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
  fun leaveFromIntent(intent: Intent) {
    if (intent.action != CallingxModuleImpl.CALL_END_ACTION) return
    val callId = intent.getStringExtra(CallingxModuleImpl.EXTRA_CALL_ID) ?: return
    leave(callId)
  }

  fun leave(callId: String, cause: DisconnectCause? = null) {
    leaveFromTelecom(callId, cause)
    removeIncomingCallNotification(callId)
    scope.launch {
      leaveWhenRegisterationInProgress(callId)
    }

  }

  /**
   * Waits for [callId] to finish Telecom registration, then sends a disconnect to that call.
   * Also supports waiting before the pending call has been inserted into the repository.
   *
   * Once a pending call is observed, its action channel identifies the registration attempt:
   * removal or replacement ends the wait without disconnecting a different attempt. Before that
   * first observation, the caller must prevent reuse of [callId] and cancel this coroutine if
   * registration fails. The repository map alone cannot identify a failed, never-inserted attempt.
   *
   * Returns true when the disconnect is delivered, not when Telecom cleanup completes. Returns
   * false if the repository is absent, the observed attempt disappears, its channel closes, or
   * [timeoutMs] expires. Timeout does not cancel registration; the caller must handle that outcome.
   * Caller cancellation propagates. Run in a client-owned scope rather than a service-owned scope.
   */
  suspend fun leaveWhenRegisterationInProgress(
    callId: String,
    cause: DisconnectCause? = null,
    timeoutMs: Long = 10_000L,
    repository: CallRepository? = CallRepositoryFactory.getExisting(),
  ): Boolean {
    if (repository == null) return false
    var registration = repository.getCall(callId)

    return withTimeoutOrNull(timeoutMs) {
      val call = repository.calls
        .map { it[callId] }
        .takeWhile { currentCall ->
          if (registration == null) registration = currentCall

          // Follow one registration only. Stop if it disappears or is replaced.
          currentCall?.actionSource === registration?.actionSource
        }
        .filterNotNull()
        .firstOrNull { !it.isPending }
        ?: return@withTimeoutOrNull false

      val disconnectCause = cause ?: DisconnectCause(
        if (call.isIncoming()) DisconnectCause.REJECTED else DisconnectCause.LOCAL,
      )
      try {

        // Registration publishes isPending=false before its action collector starts. Suspending
        // send waits for that collector instead of silently dropping an early trySend.
        call.actionSource.send(CallAction.Disconnect(disconnectCause))
        debugLog(TAG, "[leaveWhenRegisterationInProgress] sent disconnect call to ${callId}")
        true
      } catch (_: ClosedSendChannelException) {
        false
      }
    } ?: false
  }

  private fun leaveFromTelecom(callId: String, cause: DisconnectCause? = null) {
    val repository = CallRepositoryFactory.getExisting() ?: return
    val call = repository.getCall(callId) ?: return
    val disconnectCause = cause?.code
      ?: if (call.isIncoming()) DisconnectCause.REJECTED else DisconnectCause.LOCAL

    repository.endCall(
      callId = callId,
      cause = disconnectCause,
    )
  }

  private fun getNotificationId(callId: String): Int {
    return callId.hashCode() and 0x7fffffff
  }

  private fun removeIncomingCallNotification(callId: String) {
    NotificationManagerCompat.from(context).cancel(getNotificationId(callId))
  }
}

