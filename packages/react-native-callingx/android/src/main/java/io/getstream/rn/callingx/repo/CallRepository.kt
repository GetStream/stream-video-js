package io.getstream.rn.callingx.repo

import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.telecom.DisconnectCause
import android.util.Log
import androidx.core.telecom.CallAttributesCompat
import io.getstream.rn.callingx.model.Call
import io.getstream.rn.callingx.model.CallAction
import io.getstream.rn.callingx.CallService
import io.getstream.rn.callingx.debugLog
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.channels.Channel

abstract class CallRepository(protected val context: Context) {

  enum class EventSource {
    APP, SYS
  }

  interface Listener {
    fun onCallStateChanged(call: Call)
    fun onIsCallAnswered(callId: String, source: EventSource)
    fun onIsCallDisconnected(callId: String?, cause: DisconnectCause, source: EventSource)
    fun onIsCallInactive(callId: String)
    fun onIsCallActive(callId: String)
    fun onCallRegistered(callId: String, incoming: Boolean)
    fun onMuteCallChanged(callId: String, isMuted: Boolean)
    fun onCallEndpointChanged(callId: String, endpoint: String)
  }

  protected val _currentCall: MutableStateFlow<Call> = MutableStateFlow(Call.None)
  val currentCall: StateFlow<Call> = _currentCall.asStateFlow()

  protected var _listener: Listener? = null
  protected val scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
  protected val registrationMutex: Mutex = Mutex()

  abstract fun setListener(listener: Listener?)
  abstract fun release()

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
    updateCurrentCall { copy(displayOptions = displayOptions) }
  }

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
   * Update the current state of our call applying the transform lambda only if the call is
   * registered. Otherwise keep the current state
   */
  protected fun updateCurrentCall(transform: Call.Registered.() -> Call) {
    val currentState = _currentCall.value
    debugLog(
      getTag(),
      "[repository] updateCurrentCall: Current call state: ${currentState::class.simpleName}"
    )

    _currentCall.update { call ->
      if (call is Call.Registered) {
        val updated = call.transform()
        debugLog(
          getTag(),
          "[repository] updateCurrentCall: Call state updated to: ${updated::class.simpleName}"
        )
        updated
      } else {
        Log.w(
          getTag(),
          "[repository] updateCurrentCall: Call is not Registered, skipping update"
        )
        call
      }
    }
  }

  protected fun createCallAttributes(
    displayName: String,
    address: Uri,
    isIncoming: Boolean,
    isVideo: Boolean
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
