package io.getstream.rn.callingx

import android.content.Context
import android.content.Intent
import android.telecom.DisconnectCause
import androidx.core.app.NotificationManagerCompat
import io.getstream.rn.callingx.repo.CallRepositoryFactory

/**
 * When a call is ended
 * 1. Leave the call from Telecom
 * 2. Remove incoming call notification
 */
internal class CallEndCoordinator(context: Context) {

  private val context = context.applicationContext

  fun leaveFromIntent(intent: Intent) {
    if (intent.action != CallingxModuleImpl.CALL_END_ACTION) return
    val callId =
      intent.getStringExtra(CallingxModuleImpl.EXTRA_CALL_ID)
        ?: return

    leaveFromTelecom(callId)
    removeIncomingCallNotification(callId)
  }

  fun leave(callId: String, cause: DisconnectCause? = null) {
    leaveFromTelecom(callId, cause)
    removeIncomingCallNotification(callId)
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
    // Keep the value non-negative (defensive for Android-side expectations).
    return callId.hashCode() and 0x7fffffff
  }

  private fun removeIncomingCallNotification(callId: String) {
    NotificationManagerCompat.from(context)
      .cancel(getNotificationId(callId))
  }
}

