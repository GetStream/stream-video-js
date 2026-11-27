package io.getstream.rn.callingx

import android.content.Intent
import android.telecom.DisconnectCause
import io.getstream.rn.callingx.model.Call
import io.getstream.rn.callingx.model.CallAction
import io.getstream.rn.callingx.notifications.CallNotificationManager
import io.getstream.rn.callingx.repo.CallRepository
import io.getstream.rn.callingx.utils.AudioEndpointUtils

/**
 * Handles repository events for the client lifetime. Foreground promotion and service stopping
 * are delegated to the currently attached CallService.
 */
internal class CallRepositoryListener(
        callRepository: CallRepository,
        notificationManager: CallNotificationManager,
        registeringCallIds: MutableSet<String>,
        actionProcessingLock: Any,
        updateCallNotification: (String, Call.Registered) -> Unit,
        onCallRemoved: (String) -> Unit,
        sendBroadcastEvent: (String, Intent.() -> Unit) -> Unit,
) : CallRepository.Listener {

    companion object {
        private const val TAG = "[Callingx] CallRepositoryListener"
    }

    private val callRepository = callRepository
    private val notificationManager = notificationManager
    private val registeringCallIds = registeringCallIds
    private val actionProcessingLock = actionProcessingLock
    private val updateCallNotification = updateCallNotification
    private val onCallRemoved = onCallRemoved
    private val sendBroadcastEvent = sendBroadcastEvent

    override fun onCallStateChanged(callId: String, call: Call) {
        debugLog(
                TAG,
                "[service] onCallStateChanged[$callId]: Call state changed: ${call::class.simpleName}"
        )
        when (call) {
            is Call.Registered -> {
                debugLog(
                        TAG,
                        "[service] onCallStateChanged[$callId]: Call registered - Active: ${call.isActive}, OnHold: ${call.isOnHold}, Muted: ${call.isMuted}"
                )

                val shouldStopExecution = processPendingActions(call)
                if (shouldStopExecution) {
                    return
                }

                if (call.isIncoming()) {
                    // Play ringtone only if there is no active call
                    if (!call.isActive && !callRepository.hasActiveCall(excludeCallId = callId)) {
                        notificationManager.startRingtone()
                    } else {
                        notificationManager.stopRingtone()
                    }
                }
                updateCallNotification(callId, call)
            }
            is Call.None, is Call.Unregistered -> {
                CallRegistrationStore.removeTrackedCall(callId)
                AudioEndpointStore.clear(callId)
                onCallRemoved(callId)
            }
        }
    }

    override fun onIsCallAnswered(callId: String, source: CallRepository.EventSource) {
        sendBroadcastEvent(CallingxModuleImpl.CALL_ANSWERED_ACTION) {
            putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
            putExtra(CallingxModuleImpl.EXTRA_SOURCE, source.name.lowercase())
        }
    }

    override fun onIsCallDisconnected(
            callId: String?,
            cause: DisconnectCause,
            source: CallRepository.EventSource
    ) {
        sendBroadcastEvent(CallingxModuleImpl.CALL_END_ACTION) {
            if (callId != null) {
                putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
            }
            putExtra(CallingxModuleImpl.EXTRA_DISCONNECT_CAUSE, getDisconnectCauseString(cause))
            putExtra(CallingxModuleImpl.EXTRA_SOURCE, source.name.lowercase())
        }
    }

    override fun onIsCallInactive(callId: String) {
        sendBroadcastEvent(CallingxModuleImpl.CALL_INACTIVE_ACTION) {
            putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
        }
    }

    override fun onIsCallActive(callId: String) {
        sendBroadcastEvent(CallingxModuleImpl.CALL_ACTIVE_ACTION) {
            putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
        }
    }

    override fun onCallRegistered(callId: String, incoming: Boolean) {
        // The repository now reports this call, so hasAnyCalls() takes over the veto. This has to
        // happen here rather than when registerCall returns: that only happens once the call has
        // already been removed and Call.None has run the stop check.
        registeringCallIds.remove(callId)

        if (incoming) {
            sendBroadcastEvent(CallingxModuleImpl.CALL_REGISTERED_INCOMING_ACTION) {
                putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
            }
        } else {
            sendBroadcastEvent(CallingxModuleImpl.CALL_REGISTERED_ACTION) {
                putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
            }
        }
    }

    override fun onMuteCallChanged(callId: String, isMuted: Boolean) {
        sendBroadcastEvent(CallingxModuleImpl.CALL_MUTED_ACTION) {
            putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
            putExtra(CallingxModuleImpl.EXTRA_MUTED, isMuted)
        }
    }

    override fun onCallAudioEndpointsChanged(callId: String) {
        val call = callRepository.getCall(callId) ?: return
        val snapshotJson =
                AudioEndpointUtils.snapshotJson(
                        call.currentCallEndpoint,
                        call.availableCallEndpoints,
                )
        AudioEndpointStore.setSnapshot(callId, snapshotJson)

        sendBroadcastEvent(CallingxModuleImpl.CALL_AUDIO_ENDPOINTS_CHANGED_ACTION) {
            putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
        }
    }

    private fun processPendingActions(call: Call.Registered): Boolean {
        synchronized(actionProcessingLock) {
            val pendingActions = CallRegistrationStore.takePendingActions(call.id)

            val disconnectAction = pendingActions.find { it is CallAction.Disconnect }
            if (disconnectAction != null) {
                // if queue contains Disconnect, execute it and ignore rest of the queue
                debugLog(
                        TAG,
                        "[service] processPendingActions: Executing pending disconnect for ${call.id}"
                )
                call.processAction(disconnectAction)
                return true
            }

            // process pending actions in the order they were added
            for (action in pendingActions) {
                call.processAction(action)
                debugLog(
                        TAG,
                        "[service] processPendingActions: Executing pending action: $action for ${call.id}"
                )
            }

            return false
        }
    }
}
