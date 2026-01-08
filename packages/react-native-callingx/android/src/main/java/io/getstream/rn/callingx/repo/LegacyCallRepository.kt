package io.getstream.rn.callingx.repo

import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.core.telecom.CallAttributesCompat
import io.getstream.rn.callingx.model.Call
import io.getstream.rn.callingx.model.CallAction
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

    override fun getTag(): String = TAG

    override fun setListener(listener: Listener?) {
        this._listener = listener
        // Observe call state changes
        scope.launch { currentCall.collect { _listener?.onCallStateChanged(it) } }
    }

    override fun release() {
        _currentCall.value = Call.None

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

            _listener?.onCallRegistered(callId)

            // Process actions without telecom SDK
            scope.launch {
                actionSource.consumeAsFlow().collect { action -> processActionLegacy(action) }
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

    private fun processActionLegacy(action: CallAction) {
        when (action) {
            is CallAction.Answer -> {
                updateCurrentCall { copy(isActive = true, isOnHold = false) }
                // In legacy mode, all actions are initiated from the app
                (currentCall.value as? Call.Registered)?.let {
                    _listener?.onIsCallAnswered(it.id, EventSource.APP)
                }
            }
            is CallAction.Disconnect -> {
                val call = currentCall.value as? Call.Registered
                if (call != null) {
                    _currentCall.value =
                            Call.Unregistered(call.id, call.callAttributes, action.cause)
                    // In legacy mode, all actions are initiated from the app
                    _listener?.onIsCallDisconnected(
                            call.id,
                            action.cause,
                            EventSource.APP
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

}
