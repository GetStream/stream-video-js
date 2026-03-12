package io.getstream.rn.callingx.repo

import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.telecom.DisconnectCause
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.telecom.CallAttributesCompat
import androidx.core.telecom.CallControlResult
import androidx.core.telecom.CallControlScope
import androidx.core.telecom.CallsManager
import io.getstream.rn.callingx.debugLog
import io.getstream.rn.callingx.model.Call
import io.getstream.rn.callingx.model.CallAction
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.consumeAsFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.withLock
import java.util.concurrent.ConcurrentHashMap

/**
 * Per-call flags tracking whether an action was initiated by the app (self) or by the system.
 */
private data class CallActionFlags(
    var isSelfAnswered: Boolean = false,
    var isSelfDisconnected: Boolean = false,
)

/**
 * The central repository that keeps track of calls and allows to register new ones.
 *
 * This class contains the main logic to integrate with Telecom SDK.
 * Multiple calls can be registered simultaneously — each gets its own [CallControlScope].
 *
 * @see registerCall
 */
@RequiresApi(Build.VERSION_CODES.O)
class TelecomCallRepository(context: Context) : CallRepository(context) {

    companion object {
        private const val TAG = "[Callingx] TelecomCallRepository"
    }

    private var observeCallsJob: Job? = null

    private val callsManager: CallsManager

    /** Per-call action-source flags, keyed by callId. */
    private val actionFlags = ConcurrentHashMap<String, CallActionFlags>()

    init {
        val capabilities =
                CallsManager.CAPABILITY_SUPPORTS_CALL_STREAMING or
                        CallsManager.CAPABILITY_SUPPORTS_VIDEO_CALLING
        callsManager =
                CallsManager(context.applicationContext).apply {
                    registerAppWithTelecom(capabilities)
                }
        debugLog(TAG, "[repository] init: CallsManager created and registered")
    }

    override fun getTag(): String = TAG

    override fun setListener(listener: Listener?) {
        this._listener = listener

        observeCallsJob?.cancel()
        observeCallsJob = observeCalls()
    }

    override fun release() {
        // Disconnect all active calls
        val currentCalls = _calls.value
        for ((callId, call) in currentCalls) {
            call.processAction(CallAction.Disconnect(DisconnectCause(DisconnectCause.LOCAL)))
        }
        _calls.value = emptyMap()
        actionFlags.clear()

        observeCallsJob?.cancel()
        observeCallsJob = null
        _listener = null

        scope.cancel()
    }

    /**
     * Register a new call with the provided attributes. Use the [calls] StateFlow to receive
     * status updates and process call related actions.
     */
    override suspend fun registerCall(
            callId: String,
            displayName: String,
            address: Uri,
            isIncoming: Boolean,
            isVideo: Boolean,
            displayOptions: Bundle?,
    ) {
        // Hold the mutex only for the dedup check — release before entering the long-lived call scope
        val attributes: CallAttributesCompat
        val actionSource: Channel<CallAction>
        val flags: CallActionFlags

        registrationMutex.withLock {
            debugLog(
                    TAG,
                    "[repository] registerCall: Starting registration - CallId: $callId, Name: $displayName, Address: $address, Incoming: $isIncoming"
            )

            // Check if this specific call is already registered
            if (_calls.value.containsKey(callId)) {
                Log.w(
                        TAG,
                        "[repository] registerCall: Call $callId already registered, ignoring duplicate"
                )
                return
            }

            debugLog(
                    TAG,
                    "[repository] registerCall: Call $callId not found in map, proceeding with registration"
            )

            attributes = createCallAttributes(displayName, address, isIncoming, isVideo)
            actionSource = Channel<CallAction>()
            flags = CallActionFlags()
            actionFlags[callId] = flags
        }

        // Register the call and handle actions in the scope (mutex released)
        try {
            callsManager.addCall(
                    attributes,
                    onIsCallAnswered(callId, flags),
                    onIsCallDisconnected(callId, flags),
                    onIsCallActive(callId),
                    onIsCallInactive(callId)
            ) {
                debugLog(
                        TAG,
                        "[repository] registerCall: Inside call scope for $callId, setting up call handlers"
                )

                // Consume the actions to interact with the call inside the scope
                launch { processCallActions(callId, flags, actionSource.consumeAsFlow()) }

                // Update the state to registered
                debugLog(
                        TAG,
                        "[repository] registerCall: Creating Registered call state with ID: $callId"
                )
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
                debugLog(TAG, "[repository] registerCall: Call $callId added to map")

                launch {
                    currentCallEndpoint.collect {
                        updateCallById(callId) { copy(currentCallEndpoint = it) }
                    }
                }
                launch {
                    availableEndpoints.collect {
                        updateCallById(callId) { copy(availableCallEndpoints = it) }
                    }
                }
                launch {
                    isMuted.collect {
                        updateCallById(callId) { copy(isMuted = it) }
                    }
                }
            }
            debugLog(
                    TAG,
                    "[repository] registerCall: Call $callId scope ended normally"
            )
        } catch (e: Exception) {
            Log.e(TAG, "[repository] registerCall: Error registering call $callId", e)
            throw e
        } finally {
            debugLog(TAG, "[repository] registerCall: Cleaning up call $callId")
            removeCall(callId)
            actionFlags.remove(callId)
        }
    }

    override fun updateCall(
            callId: String,
            displayName: String,
            address: Uri,
            isVideo: Boolean,
            displayOptions: Bundle?,
    ) {
        debugLog(
                TAG,
                "[repository] updateCall: Starting update - CallId: $callId, Name: $displayName, Address: $address, IsVideo: $isVideo"
        )
        super.updateCall(callId, displayName, address, isVideo, displayOptions)
    }

    private fun observeCalls(): Job {
        // Track previous state per call for diffing
        var previousCalls: Map<String, Call.Registered> = emptyMap()

        return calls
                .onEach { currentCalls ->
                    // Detect new calls
                    for ((callId, call) in currentCalls) {
                        val previous = previousCalls[callId]
                        if (previous == null) {
                            // New call added
                            _listener?.onCallRegistered(callId, call.isIncoming())
                        } else {
                            // Existing call changed
                            if (previous.isMuted != call.isMuted) {
                                debugLog(TAG, "[repository] observeCalls: Mute changed for $callId: ${call.isMuted}")
                                _listener?.onMuteCallChanged(callId, call.isMuted)
                            }
                            if (previous.currentCallEndpoint != call.currentCallEndpoint) {
                                call.currentCallEndpoint?.let {
                                    _listener?.onCallEndpointChanged(callId, it.name.toString())
                                }
                            }
                        }
                        _listener?.onCallStateChanged(callId, call)
                    }

                    // Detect removed calls
                    for ((callId, _) in previousCalls) {
                        if (!currentCalls.containsKey(callId)) {
                            _listener?.onCallStateChanged(callId, Call.None)
                        }
                    }

                    previousCalls = currentCalls
                }
                .launchIn(scope)
    }

    /** Collect the action source to handle client actions inside the call scope */
    private suspend fun CallControlScope.processCallActions(
            callId: String,
            flags: CallActionFlags,
            actionSource: Flow<CallAction>
    ) {
        actionSource.collect { action ->
            debugLog(TAG, "[repository] processCallActions[$callId]: action: ${action::class.simpleName}")
            when (action) {
                is CallAction.Answer -> {
                    doAnswer(callId, flags, action.isAudioCall)
                }
                is CallAction.Disconnect -> {
                    doDisconnect(callId, flags, action)
                }
                is CallAction.SwitchAudioEndpoint -> {
                    doSwitchEndpoint(callId, action)
                }
                is CallAction.TransferCall -> {
                    debugLog(
                            TAG,
                            "[repository] processCallActions[$callId]: Transfer to endpoint: ${action.endpointId}"
                    )
                    val call = _calls.value[callId]
                    val endpoints =
                            call?.availableCallEndpoints?.firstOrNull {
                                it.identifier == action.endpointId
                            }
                    if (endpoints != null) {
                        requestEndpointChange(
                                endpoint = endpoints,
                        )
                    } else {
                        Log.w(
                                TAG,
                                "[repository] processCallActions[$callId]: Endpoint not found for transfer, ignoring"
                        )
                    }
                }
                CallAction.Hold -> {
                    when (val result = setInactive()) {
                        is CallControlResult.Success -> {
                            onIsCallInactive(callId)()
                        }
                        is CallControlResult.Error -> {
                            Log.e(
                                    TAG,
                                    "[repository] processCallActions[$callId]: Hold action failed with error code: ${result.errorCode}"
                            )
                            updateCallById(callId) { copy(errorCode = result.errorCode) }
                        }
                    }
                }
                CallAction.Activate -> {
                    when (val result = setActive()) {
                        is CallControlResult.Success -> {
                            onIsCallActive(callId)()
                        }
                        is CallControlResult.Error -> {
                            Log.e(
                                    TAG,
                                    "[repository] processCallActions[$callId]: Activate action failed with error code: ${result.errorCode}"
                            )
                            updateCallById(callId) { copy(errorCode = result.errorCode) }
                        }
                    }
                }
                is CallAction.ToggleMute -> {
                    debugLog(TAG, "[repository] processCallActions[$callId]: Toggling mute: ${action.isMute}")
                    updateCallById(callId) {
                        copy(isMuted = action.isMute)
                    }
                }
            }
        }
        debugLog(TAG, "[repository] processCallActions[$callId]: Action collection ended")
    }


    private suspend fun CallControlScope.doSwitchEndpoint(callId: String, action: CallAction.SwitchAudioEndpoint) {
        debugLog(TAG, "[repository] doSwitchEndpoint[$callId]: Switching to endpoint: ${action.endpointId}")
        val call = _calls.value[callId]
        if (call == null) {
            Log.w(TAG, "[repository] doSwitchEndpoint[$callId]: Call not found, ignoring")
            return
        }
        val endpoints = call.availableCallEndpoints
        val newEndpoint = endpoints.firstOrNull { it.identifier == action.endpointId }

        if (newEndpoint != null) {
            debugLog(
                    TAG,
                    "[repository] doSwitchEndpoint[$callId]: Found endpoint: ${newEndpoint.name}, requesting change"
            )
            requestEndpointChange(newEndpoint).also {
                debugLog(TAG, "[repository] doSwitchEndpoint[$callId]: Endpoint change result: $it")
            }
        } else {
            Log.w(TAG, "[repository] doSwitchEndpoint[$callId]: Endpoint not found in available endpoints")
        }
    }

    private suspend fun CallControlScope.doDisconnect(callId: String, flags: CallActionFlags, action: CallAction.Disconnect) {
        flags.isSelfDisconnected = true
        debugLog(TAG, "[repository] doDisconnect[$callId]: Disconnecting call with cause: ${action.cause}")
        disconnect(action.cause)
        debugLog(TAG, "[repository] doDisconnect[$callId]: Disconnect called, triggering onIsCallDisconnected")
        onIsCallDisconnected(callId, flags)(action.cause)
    }

    private suspend fun CallControlScope.doAnswer(callId: String, flags: CallActionFlags, isAudioCall: Boolean) {
        flags.isSelfAnswered = true
        val callType =
                if (isAudioCall) CallAttributesCompat.CALL_TYPE_AUDIO_CALL
                else CallAttributesCompat.CALL_TYPE_VIDEO_CALL

        when (val result = answer(callType)) {
            is CallControlResult.Success -> {
                onIsCallAnswered(callId, flags)(callType)
            }
            is CallControlResult.Error -> {
                Log.e(
                        TAG,
                        "[repository] doAnswer[$callId]: Answer failed with error code: ${result.errorCode}"
                )
                flags.isSelfAnswered = false
                val call = _calls.value[callId]
                if (call != null) {
                    removeCall(callId)
                    _listener?.onIsCallDisconnected(
                            callId,
                            DisconnectCause(DisconnectCause.BUSY),
                            EventSource.APP
                    )
                }
            }
        }
    }

    private fun onIsCallAnswered(callId: String, flags: CallActionFlags): suspend (type: Int) -> Unit = {
        debugLog(
                TAG,
                "[repository] onIsCallAnswered[$callId]: Call answered, type: $it, isSelfAnswered: ${flags.isSelfAnswered}"
        )
        updateCallById(callId) { copy(isActive = true, isOnHold = false) }

        val source = if (flags.isSelfAnswered) EventSource.APP else EventSource.SYS
        if (_calls.value.containsKey(callId)) {
            _listener?.onIsCallAnswered(callId, source)
        }
        flags.isSelfAnswered = false
        debugLog(TAG, "[repository] onIsCallAnswered[$callId]: Call state updated to active")
    }

    private fun onIsCallDisconnected(callId: String, flags: CallActionFlags): suspend (cause: DisconnectCause) -> Unit = { cause ->
        debugLog(
                TAG,
                "[repository] onIsCallDisconnected[$callId]: Call disconnected, cause: ${cause.reason}, description: ${cause.description}"
        )
        val source = if (flags.isSelfDisconnected) EventSource.APP else EventSource.SYS

        removeCall(callId)
        _listener?.onIsCallDisconnected(callId, cause, source)
        flags.isSelfDisconnected = false
        debugLog(TAG, "[repository] onIsCallDisconnected[$callId]: Call removed from map")
    }

    private fun onIsCallActive(callId: String): suspend () -> Unit = {
        debugLog(TAG, "[repository] onIsCallActive[$callId]: Call became active")
        updateCallById(callId) {
            copy(
                    errorCode = null,
                    isActive = true,
                    isOnHold = false,
            )
        }

        if (_calls.value.containsKey(callId)) {
            _listener?.onIsCallActive(callId)
        }
        debugLog(TAG, "[repository] onIsCallActive[$callId]: Call state updated")
    }

    private fun onIsCallInactive(callId: String): suspend () -> Unit = {
        debugLog(TAG, "[repository] onIsCallInactive[$callId]: Call became inactive (on hold)")
        updateCallById(callId) { copy(errorCode = null, isOnHold = true) }

        if (_calls.value.containsKey(callId)) {
            _listener?.onIsCallInactive(callId)
        }
        debugLog(TAG, "[repository] onIsCallInactive[$callId]: Call state updated to on hold")
    }

}
