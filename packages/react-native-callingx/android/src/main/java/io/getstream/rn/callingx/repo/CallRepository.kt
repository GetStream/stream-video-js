package io.getstream.rn.callingx.repo

import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.telecom.DisconnectCause
import android.util.Log
import androidx.core.telecom.CallAttributesCompat
import androidx.core.telecom.CallEndpointCompat
import io.getstream.rn.callingx.model.Call
import io.getstream.rn.callingx.model.CallAction
import io.getstream.rn.callingx.CallRegistrationStore
import io.getstream.rn.callingx.CallService
import io.getstream.rn.callingx.debugLog
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.withTimeoutOrNull

abstract class CallRepository(protected val context: Context) {

  enum class EventSource {
    APP, SYS
  }

  /**
   * Receives call changes. Every method does nothing by default, so each listener only overrides
   * what it handles. See [setEventsListener] and [attachPresenter] for the two listeners.
   */
  interface Listener {
    fun onCallStateChanged(callId: String, call: Call) {}
    fun onIsCallAnswered(callId: String, source: EventSource) {}
    fun onIsCallDisconnected(callId: String?, cause: DisconnectCause, source: EventSource) {}
    fun onIsCallInactive(callId: String) {}
    fun onIsCallActive(callId: String) {}
    fun onCallRegistered(callId: String, incoming: Boolean) {}
    fun onMuteCallChanged(callId: String, isMuted: Boolean) {}

    /** Fired when registering a call started with [startCall] fails. */
    fun onCallRegistrationFailed(callId: String) {}

    /**
     * Fired when the current endpoint or the set of available endpoints changes.
     */
    fun onCallAudioEndpointsChanged(callId: String) {}
  }

  protected val _calls: MutableStateFlow<Map<String, Call.Registered>> = MutableStateFlow(emptyMap())
  val calls: StateFlow<Map<String, Call.Registered>> = _calls.asStateFlow()

  /**
   * Shows the calls: their notification, the ringtone and the foreground service. This is
   * [CallService] while one is running, and nothing otherwise. Calls keep going without it.
   */
  @Volatile private var presenter: Listener? = null

  /** Reports call changes to JavaScript and cleans up per-call state. Always attached. */
  @Volatile private var eventsListener: Listener? = null

  /**
   * Runs every call, including the coroutine that holds each call in Telecom. It belongs to the
   * repository, not to [CallService], so the service can stop without ending a call.
   */
  protected val scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
  protected val registrationMutex: Mutex = Mutex()

  /**
   * Guards handing an action to a call against the call finishing its registration at the same
   * moment: an action must either reach the call or be queued for it, never neither.
   */
  private val actionProcessingLock = Any()

  abstract fun release()

  /** Sets the listener that reports call changes to JavaScript. Set once, when the repository is created. */
  fun setEventsListener(listener: Listener) {
    eventsListener = listener
  }

  /**
   * Makes [listener] the one that shows the calls, and tells it about the calls that already
   * exist, so a newly started [CallService] can show them.
   */
  fun attachPresenter(listener: Listener) {
    presenter = listener
    _calls.value
      .filterValues { !it.isPending }
      .forEach { (callId, call) -> listener.onCallStateChanged(callId, call) }
  }

  /** Stops [listener] from showing the calls. Does nothing if another presenter took over. */
  fun detachPresenter(listener: Listener) {
    if (presenter === listener) {
      presenter = null
    }
  }

  /**
   * Calls [block] on the presenter first, then on the events listener. The presenter goes first so
   * that, while a [CallService] exists, it handles a call's pending actions before showing it,
   * exactly as before (see [processPendingActions]).
   */
  protected fun notifyListeners(block: Listener.() -> Unit) {
    presenter?.block()
    eventsListener?.block()
  }

  protected fun clearListeners() {
    presenter = null
    eventsListener = null
  }

  /**
   * Registers the call in the repository's own scope and returns its job, which completes when
   * the call ends. A failure is reported through [Listener.onCallRegistrationFailed].
   */
  fun startCall(callInfo: CallService.CallInfo, isIncoming: Boolean): Job =
    scope.launch {
      try {
        registerCall(
          callInfo.callId,
          callInfo.name,
          callInfo.uri,
          isIncoming,
          callInfo.isVideo,
          callInfo.displayOptions,
        )
      } catch (e: CancellationException) {
        // Only when the repository itself is released. The call never made it in, so drop its
        // tracked id: a stale one wrongly marks the user as busy for later pushes.
        CallRegistrationStore.removeTrackedCall(callInfo.callId)
        throw e
      } catch (e: Exception) {
        Log.e(getTag(), "[repository] startCall: Registration failed for ${callInfo.callId}: ${e.message}")
        notifyListeners { onCallRegistrationFailed(callInfo.callId) }
      }
    }

  /**
   * Sends [action] to the call. While the call is still being registered, the action is queued in
   * [CallRegistrationStore] and handled by [processPendingActions] once the call is registered.
   */
  fun processAction(callId: String, action: CallAction) {
    debugLog(getTag(), "[repository] processAction[$callId]: ${action::class.simpleName}")
    synchronized(actionProcessingLock) {
      val call = getCall(callId)
      if (call != null && !call.isPending) {
        call.processAction(action)
      } else {
        debugLog(getTag(), "[repository] processAction[$callId]: Not registered yet, queueing the action")
        CallRegistrationStore.addPendingAction(callId, action)
      }
    }
  }

  /**
   * Hands a registered call the actions queued for it while it was registering.
   *
   * @return true when one of them was a hang-up. The call is then ending, and the others were
   *   dropped.
   */
  fun processPendingActions(call: Call.Registered): Boolean {
    synchronized(actionProcessingLock) {
      val pendingActions = CallRegistrationStore.takePendingActions(call.id)

      val disconnectAction = pendingActions.find { it is CallAction.Disconnect }
      if (disconnectAction != null) {
        debugLog(getTag(), "[repository] processPendingActions: Executing pending disconnect for ${call.id}")
        call.processAction(disconnectAction)
        return true
      }

      for (action in pendingActions) {
        call.processAction(action)
        debugLog(getTag(), "[repository] processPendingActions: Executing pending action: $action for ${call.id}")
      }
      return false
    }
  }

  /**
   * Hangs up an incoming call the user declined, straight in Telecom, without waiting for
   * JavaScript or for [CallService].
   *
   * Does nothing when the call was answered in the meantime (JavaScript handles that case), or
   * when it has already ended: queueing a hang-up for a call that will never register would hang up
   * a later call that reuses its id.
   */
  fun declineIncomingCall(callId: String) {
    val call = getCall(callId)
    if (call == null && !CallRegistrationStore.isCallTracked(callId)) {
      debugLog(getTag(), "[repository] declineIncomingCall[$callId]: Call already ended, nothing to do")
      return
    }
    if (call != null && (!call.isIncoming() || call.isActive)) {
      debugLog(getTag(), "[repository] declineIncomingCall[$callId]: Call was answered, not declining")
      return
    }
    processAction(callId, CallAction.Disconnect(DisconnectCause(DisconnectCause.REJECTED)))
  }

  /**
   * Hangs up every call and waits until each one has ended, or until [timeoutMs] has passed.
   */
  suspend fun hangUpAllCalls(timeoutMs: Long) {
    val callIds = _calls.value.keys.toSet()
    if (callIds.isEmpty()) return

    debugLog(getTag(), "[repository] hangUpAllCalls: Hanging up $callIds")
    for ((callId, call) in _calls.value) {
      // Straight to the call, even while it is still registering: its actions are buffered and
      // handled once it is registered.
      if (!call.processAction(CallAction.Disconnect(DisconnectCause(DisconnectCause.LOCAL)))) {
        Log.w(getTag(), "[repository] hangUpAllCalls: Could not send the hang-up to $callId")
      }
    }

    val allEnded = withTimeoutOrNull(timeoutMs) {
      calls.first { current -> callIds.none { it in current } }
    }
    if (allEnded == null) {
      Log.w(
        getTag(),
        "[repository] hangUpAllCalls: Calls still not ended after ${timeoutMs}ms: ${callIds.filter { it in _calls.value }}",
      )
    }
  }

  abstract suspend fun registerCall(
    callId: String,
    displayName: String,
    address: Uri,
    isIncoming: Boolean,
    isVideo: Boolean,
    displayOptions: Bundle?,
  )

  open fun updateCall(
    callId: String,
    displayName: String,
    address: Uri,
    isVideo: Boolean,
    displayOptions: Bundle?,
  ) {
    updateCallById(callId) { copy(displayOptions = displayOptions) }
  }

  fun getCall(callId: String): Call.Registered? = _calls.value[callId]

  fun hasAnyCalls(): Boolean = _calls.value.isNotEmpty()

  fun hasRingingCall(excludeCallId: String? = null): Boolean =
    _calls.value.any { (id, c) -> id != excludeCallId && !c.isPending && c.isIncoming() && !c.isActive }

  fun hasActiveCall(excludeCallId: String? = null): Boolean =
    _calls.value.any { (id, c) -> id != excludeCallId && !c.isPending && c.isActive }

  //this call instance is used to display call notification before the call is registered, this is needed to invoke startForeground method on the service
  public fun getTempCall(callInfo: CallService.CallInfo, incoming: Boolean): Call.Registered {
    val attributes = createCallAttributes(
            displayName = callInfo.name,
            address = callInfo.uri,
            isIncoming = incoming,
            isVideo = callInfo.isVideo
        )

    return Call.Registered(
        id = callInfo.callId,
        isPending = true,
        isActive = false,
        isOnHold = false,
        callAttributes = attributes,
        displayOptions = callInfo.displayOptions,
        isMuted = false,
        errorCode = null,
        currentCallEndpoint = null,
        availableCallEndpoints = emptyList(),
        actionSource = Channel<CallAction>() // Temporary channel, will be replaced by actual registration
    )
  }

  /**
   * Update the state of a specific call applying the transform lambda only if the call is
   * found in the map. Otherwise keep the current state.
   */
  protected fun updateCallById(callId: String, transform: Call.Registered.() -> Call) {
    _calls.update { currentMap ->
      val call = currentMap[callId]
      if (call != null) {
        val updated = call.transform()
        debugLog(
          getTag(),
          "[repository] updateCallById: Call $callId state updated to: ${updated::class.simpleName}"
        )
        if (updated is Call.Registered) {
          currentMap + (callId to updated)
        } else {
          // Call transitioned to non-Registered state (e.g. Unregistered) — remove from map
          currentMap - callId
        }
      } else {
        Log.w(
          getTag(),
          "[repository] updateCallById: Call $callId not found in map, skipping update"
        )
        currentMap
      }
    }
  }

  protected fun addCall(callId: String, call: Call.Registered) {
    _calls.update { it + (callId to call) }
  }

  protected fun removeCall(callId: String) {
    _calls.update { it - callId }
  }

  protected fun createCallAttributes(
    displayName: String,
    address: Uri,
    isIncoming: Boolean,
    isVideo: Boolean,
    preferredStartingCallEndpoint: CallEndpointCompat? = null,
  ): CallAttributesCompat {
    return CallAttributesCompat(
      displayName = displayName,
      address = address,
      direction =
        if (isIncoming) {
          CallAttributesCompat.DIRECTION_INCOMING
        } else {
          CallAttributesCompat.DIRECTION_OUTGOING
        },
      callType =
        if (isVideo) {
          CallAttributesCompat.CALL_TYPE_VIDEO_CALL
        } else {
          CallAttributesCompat.CALL_TYPE_AUDIO_CALL
        },
      callCapabilities =
        CallAttributesCompat.SUPPORTS_SET_INACTIVE or
          CallAttributesCompat.SUPPORTS_STREAM or
          CallAttributesCompat.SUPPORTS_TRANSFER,
      preferredStartingCallEndpoint = preferredStartingCallEndpoint,
    )
  }

  protected abstract fun getTag(): String
}

object CallRepositoryFactory {

  fun create(context: Context): CallRepository {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      TelecomCallRepository(context) // Your current CallRepository renamed
    } else {
      LegacyCallRepository(context) // Fallback implementation
    }
  }
}
