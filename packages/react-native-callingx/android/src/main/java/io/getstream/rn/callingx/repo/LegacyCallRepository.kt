package io.getstream.rn.callingx.repo

import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.telecom.DisconnectCause
import android.util.Log
import io.getstream.rn.callingx.model.Call
import io.getstream.rn.callingx.model.CallAction
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.consumeAsFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.withLock

class LegacyCallRepository(context: Context) : CallRepository(context) {

    companion object {
        private const val TAG = "[Callingx] LegacyCallRepository"
    }

    private var observeCallsJob: Job? = null

    override fun getTag(): String = TAG

    override fun setListener(listener: Listener?) {
        this._listener = listener
        observeCallsJob?.cancel()
        observeCallsJob = scope.launch {
            var previousCalls: Map<String, Call.Registered> = emptyMap()
            try {
                calls.collect { currentCalls ->
                    // Notify about changes per call
                    for ((callId, call) in currentCalls) {
                        _listener?.onCallStateChanged(callId, call)
                    }
                    for ((callId, _) in previousCalls) {
                        if (!currentCalls.containsKey(callId)) {
                            _listener?.onCallStateChanged(callId, Call.None)
                        }
                    }
                    previousCalls = currentCalls
                }
            } catch (e: Exception) {
                Log.e(TAG, "[repository] setListener: Error collecting call state", e)
            }
        }
    }

    override fun release() {
        _calls.value = emptyMap()

        observeCallsJob?.cancel()
        observeCallsJob = null
        _listener = null

        scope.cancel()
    }

    override suspend fun registerCall(
            callId: String,
            displayName: String,
            address: Uri,
            isIncoming: Boolean,
            isVideo: Boolean,
            displayOptions: Bundle?,
    ) = registrationMutex.withLock {
        // Check if this specific call is already registered
        if (_calls.value.containsKey(callId)) {
            Log.w(
                    TAG,
                    "[repository] registerCall: Call $callId already registered, ignoring duplicate"
            )
            return@withLock
        }

        val attributes = createCallAttributes(displayName, address, isIncoming, isVideo)
        val actionSource = Channel<CallAction>()

        val registeredCall = Call.Registered(
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

        addCall(callId, registeredCall)
        _listener?.onCallRegistered(callId, isIncoming)

        // Process actions without telecom SDK
        scope.launch {
            try {
                actionSource.consumeAsFlow().collect { action -> processActionLegacy(callId, action) }
            } catch (e: Exception) {
                Log.e(TAG, "[repository] registerCall: Error consuming actions for $callId", e)
            }
        }
    }

    override fun updateCall(
        callId: String,
        displayName: String,
        address: Uri,
        isVideo: Boolean,
        displayOptions: Bundle?,
    ) {
        super.updateCall(callId, displayName, address, isVideo, displayOptions)
    }

    private fun processActionLegacy(callId: String, action: CallAction) {
        when (action) {
            is CallAction.Answer -> {
                updateCallById(callId) { copy(isActive = true, isOnHold = false) }
                val call = _calls.value[callId]
                if (call != null) {
                    _listener?.onIsCallAnswered(callId, EventSource.APP)
                }
            }
            is CallAction.Disconnect -> {
                val call = _calls.value[callId]
                if (call != null) {
                    removeCall(callId)
                    _listener?.onIsCallDisconnected(
                            callId,
                            action.cause,
                            EventSource.APP
                    )
                }
            }
            is CallAction.ToggleMute -> {
                updateCallById(callId) { copy(isMuted = action.isMute) }
            }
            // Handle other actions...
            else -> {
                /* No-op for unsupported actions */
            }
        }
    }

}
