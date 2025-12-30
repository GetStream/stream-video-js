package io.getstream.rn.callingx.repo

import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.core.telecom.CallAttributesCompat
import io.getstream.rn.callingx.model.Call
import io.getstream.rn.callingx.model.CallAction
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.consumeAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class LegacyCallRepository(private val context: Context) : CallRepository {

    companion object {
        private const val TAG = "[Callingx] LegacyCallRepository"
    }

    private val _currentCall: MutableStateFlow<Call> = MutableStateFlow(Call.None)
    override val currentCall = _currentCall.asStateFlow()

    private var listener: CallRepository.Listener? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private val registrationMutex = Mutex()

    override fun setListener(listener: CallRepository.Listener) {
        this.listener = listener
        // Observe call state changes
        scope.launch { currentCall.collect { listener.onCallStateChanged(it) } }
    }

    override fun release() {
        _currentCall.value = Call.None

        listener = null

        scope.cancel()
    }

    override suspend fun registerCall(
            callId: String,
            displayName: String,
            address: Uri,
            isIncoming: Boolean,
            isVideo: Boolean,
            displayOptions: Bundle?,
    ) {
        registrationMutex.withLock {
            if (currentCall.value is Call.Registered) {
                Log.w(
                        TAG,
                        "[repository] registerCall: Call already registered, ignoring new call request"
                )
                return@withLock
            }

            val attributes = createCallAttributes(displayName, address, isIncoming, isVideo)
            val actionSource = Channel<CallAction>()

            _currentCall.value =
                    Call.Registered(
                            id = callId,
                            isActive = false,
                            isOnHold = false,
                            callAttributes = attributes,
                            displayOptions = displayOptions,
                            isMuted = false,
                            errorCode = null,
                            currentCallEndpoint = null,
                            availableCallEndpoints = emptyList(),
                            actionSource = actionSource,
                    )

            listener?.onCallRegistered(callId)

            // Process actions without telecom SDK
            scope.launch {
                actionSource.consumeAsFlow().collect { action -> processActionLegacy(action) }
            }
        }
    }

    private fun processActionLegacy(action: CallAction) {
        when (action) {
            is CallAction.Answer -> {
                updateCurrentCall { copy(isActive = true, isOnHold = false) }
                // In legacy mode, all actions are initiated from the app
                (currentCall.value as? Call.Registered)?.let {
                    listener?.onIsCallAnswered(it.id, CallRepository.EventSource.APP)
                }
            }
            is CallAction.Disconnect -> {
                val call = currentCall.value as? Call.Registered
                if (call != null) {
                    _currentCall.value =
                            Call.Unregistered(call.id, call.callAttributes, action.cause)
                    // In legacy mode, all actions are initiated from the app
                    listener?.onIsCallDisconnected(
                            call.id,
                            action.cause,
                            CallRepository.EventSource.APP
                    )
                }
            }
            is CallAction.ToggleMute -> {
                updateCurrentCall { copy(isMuted = action.isMute) }
            }
            // Handle other actions...
            else -> {
                /* No-op for unsupported actions */
            }
        }
    }

    private fun updateCurrentCall(transform: Call.Registered.() -> Call) {
        val currentState = _currentCall.value
        Log.d(
                TAG,
                "[repository] updateCurrentCall: Current call state: ${currentState::class.simpleName}"
        )

        _currentCall.update { call ->
            if (call is Call.Registered) {
                val updated = call.transform()
                Log.d(
                        TAG,
                        "[repository] updateCurrentCall: Call state updated to: ${updated::class.simpleName}"
                )
                updated
            } else {
                Log.w(
                        TAG,
                        "[repository] updateCurrentCall: Call is not Registered, skipping update"
                )
                call
            }
        }
    }

    private fun createCallAttributes(
            displayName: String,
            address: Uri,
            isIncoming: Boolean,
            isVideo: Boolean
    ): CallAttributesCompat {
        Log.d(
                TAG,
                "createCallAttributes: Creating CallAttributes - Direction: ${if (isIncoming) "Incoming" else "Outgoing"}, Type: ${if (isVideo) "Video" else "Audio"}"
        )
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
}
