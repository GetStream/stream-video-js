package io.getstream.rn.callingx

import android.content.Context
import android.content.Intent
import android.telecom.DisconnectCause
import io.getstream.rn.callingx.model.Call
import io.getstream.rn.callingx.repo.CallRepository
import io.getstream.rn.callingx.utils.AudioEndpointUtils

/**
 * Reports call changes to JavaScript (as `CALL_*` broadcasts, which [CallEventBroadcastReceiver]
 * passes on) and cleans up per-call state when a call ends.
 *
 * It is attached to the repository for the whole life of the process, so this keeps working while
 * no [CallService] is running: a call can end, and JavaScript hears about it, after Android has
 * stopped the service.
 */
internal class CallEventsPublisher(
        context: Context,
        repository: CallRepository,
) : CallRepository.Listener {

    private val context: Context
    private val repository: CallRepository

    init {
        this.context = context.applicationContext
        this.repository = repository
    }

    override fun onCallStateChanged(callId: String, call: Call) {
        when (call) {
            is Call.Registered -> {
                // CallService handles the pending actions first while it exists (it is notified
                // before this listener). This covers a call that registers with no service.
                repository.processPendingActions(call)
            }
            is Call.None, is Call.Unregistered -> {
                CallRegistrationStore.removeTrackedCall(callId)
                AudioEndpointStore.clear(callId)
            }
        }
    }

    override fun onCallRegistered(callId: String, incoming: Boolean) {
        val action =
                if (incoming) CallingxModuleImpl.CALL_REGISTERED_INCOMING_ACTION
                else CallingxModuleImpl.CALL_REGISTERED_ACTION
        sendBroadcastEvent(action) { putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId) }
    }

    override fun onCallRegistrationFailed(callId: String) {
        sendBroadcastEvent(CallingxModuleImpl.CALL_REGISTRATION_FAILED_ACTION) {
            putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
        }
        // CallingxModuleImpl also drops the tracked id when it receives the broadcast above, but
        // only if a JS module instance is alive, which it need not be in a headless push flow.
        // Removing it here too is idempotent.
        CallRegistrationStore.removeTrackedCall(callId)
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

    override fun onMuteCallChanged(callId: String, isMuted: Boolean) {
        sendBroadcastEvent(CallingxModuleImpl.CALL_MUTED_ACTION) {
            putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
            putExtra(CallingxModuleImpl.EXTRA_MUTED, isMuted)
        }
    }

    override fun onCallAudioEndpointsChanged(callId: String) {
        val call = repository.getCall(callId) ?: return
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

    private fun sendBroadcastEvent(action: String, applyParams: Intent.() -> Unit = {}) {
        val intent =
                Intent(action).apply {
                    setPackage(context.packageName)
                    applyParams(this)
                }
        context.sendBroadcast(intent)
    }
}
