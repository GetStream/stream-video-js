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
import androidx.core.telecom.CallEndpointCompat
import androidx.core.telecom.CallsManager
import io.getstream.rn.callingx.AudioEndpointStore
import io.getstream.rn.callingx.debugLog
import io.getstream.rn.callingx.model.Call
import io.getstream.rn.callingx.model.CallAction
import io.getstream.rn.callingx.utils.AudioEndpointUtils
import io.getstream.rn.callingx.utils.SettingsStore
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.consumeAsFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withTimeoutOrNull
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean

/**
 * State owned by one `registerCall` invocation, including whether an action was initiated by the
 * app (self) or by the system. It is compared by identity, so cleanup of an ended registration
 * never touches a newer registration that reuses the same callId.
 */
private class CallActionFlags(val actionSource: Channel<CallAction>) {
    val isSelfAnswered = AtomicBoolean(false)
    val isSelfDisconnected = AtomicBoolean(false)

    /** Parent of the session collectors, cancelled on disconnect so core-telecom's addCall can return. */
    @Volatile
    var sessionJob: Job? = null
}

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

        /** Max time to wait for the pre-call endpoints to populate before registering the call. */
        private const val PRE_CALL_ENDPOINTS_TIMEOUT_MS = 1500L
    }

    @Volatile
    private var isReleased: Boolean = false

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
        if (isReleased) {
            debugLog(TAG, "[repository] release: Already released, ignoring")
            return
        }
        isReleased = true

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
        if (isReleased) {
            Log.w(
                    TAG,
                    "[repository] registerCall: Repository already released, ignoring registration for $callId"
            )
            return
        }

        // Resolve the preferred starting endpoint from the sticky default preference (if any).
        // We must keep the pre-call endpoints flow subscribed until the in-call session has
        // registered its endpoints, otherwise the resolved endpoint's (session-scoped) identifier
        // is dropped by CallEndpointUuidTracker and no longer matches inside the call scope.
        var preCallEndpointsJob: Job? = null
        val preferredStartingEndpoint = resolvePreferredStartingEndpoint { job ->
            preCallEndpointsJob = job
        }

        // Hold the mutex only for the dedup check — release before entering the long-lived call scope
        val attributes: CallAttributesCompat
        val actionSource: Channel<CallAction>
        val flags: CallActionFlags

        registrationMutex.withLock {
            debugLog(
                    TAG,
                    "[repository] registerCall: Starting registration - CallId: $callId, Name: $displayName, Address: $address, Incoming: $isIncoming"
            )

            // Check if this specific call is already registered or registration is in progress
            // release() may have run while the pre-call endpoints were resolving above, so the
            // check is repeated under the lock
            if (isReleased || _calls.value.containsKey(callId)) {
                Log.w(
                        TAG,
                        "[repository] registerCall: Repository released or call $callId already registered, ignoring"
                )
                preCallEndpointsJob?.cancel()
                return
            }

            debugLog(
                    TAG,
                    "[repository] registerCall: Call $callId not found in map, proceeding with registration"
            )

            attributes = createCallAttributes(
                    displayName,
                    address,
                    isIncoming,
                    isVideo,
                    preferredStartingEndpoint,
            )
            actionSource = Channel<CallAction>(Channel.UNLIMITED)
            flags = CallActionFlags(actionSource)
            actionFlags[callId] = flags

            // Add call to the map early so that duplicate registrations are rejected
            // and listeners are notified immediately. Actions are buffered until the Telecom
            // session starts collecting; CallService only sends actions to a call once
            // isPending is false, queueing earlier ones in CallRegistrationStore.
            val registeredCall = Call.Registered(
                    id = callId,
                    isPending = true,
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
            debugLog(TAG, "[repository] registerCall: Call $callId added to map in pending state")
        }

        // Register the call with Telecom and handle actions in the scope (mutex released)
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

                // Call is now registered in Telecom — mark as no longer pending
                updateCallById(callId) { copy(isPending = false) }

                flags.sessionJob = launch {
                    // Consume the actions to interact with the call inside the scope
                    launch { processCallActions(callId, flags, actionSource.consumeAsFlow()) }

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
                    // Once this in-call session has registered its endpoints, the preferred endpoint's
                    // identifier has been reused by it, so the pre-call subscription can be released.
                    launch {
                        availableEndpoints.first { it.isNotEmpty() }
                        preCallEndpointsJob?.cancel()
                    }
                    launch {
                        isMuted.collect {
                            updateCallById(callId) { copy(isMuted = it) }
                        }
                    }
                }
            }
            debugLog(
                    TAG,
                    "[repository] registerCall: Call $callId scope ended normally"
            )
        } catch (e: CancellationException) {
            debugLog(
                    TAG,
                    "[repository] registerCall: Registration canceled for $callId during teardown"
            )
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "[repository] registerCall: Error registering call $callId", e)
            throw e
        } finally {
            // Call lifecycle cleanup: this runs once addCall has returned, which happens when the
            // session collectors were cancelled in onIsCallDisconnected (normal end) or when
            // registration failed. It removes the call from the map and clears per-call state.
            // All of this is scoped to this registration, so it cannot affect a newer call with the same id.
            debugLog(TAG, "[repository] registerCall: Cleaning up call $callId")
            preCallEndpointsJob?.cancel()
            removeRegistration(callId, flags)
            actionFlags.remove(callId, flags)
            flags.sessionJob?.cancel()
        }
    }

    /** Removes [callId] from the map only while the entry still belongs to this registration. */
    private fun removeRegistration(callId: String, flags: CallActionFlags) {
        _calls.update { calls ->
            if (calls[callId]?.actionSource === flags.actionSource) calls - callId else calls
        }
    }

    /**
     * Resolves the preferred starting audio endpoint from the sticky default preference, mirroring
     * the AndroidX-recommended pattern: read [CallsManager.getAvailableStartingCallEndpoints], pick
     * the endpoint matching the preference by type, and pass it as
     * [CallAttributesCompat.preferredStartingCallEndpoint].
     *
     * The pre-call endpoints flow is kept subscribed (its [Job] handed back via [onJobStarted]) so
     * that the endpoint's session-scoped identifier remains valid into the in-call session; the
     * caller cancels it once the in-call session has registered its own endpoints.
     *
     * Returns null (and does not keep a subscription) when there is no preference, no matching
     * endpoint, or a wired/bluetooth device is present (which must not be overridden).
     */
    private suspend fun resolvePreferredStartingEndpoint(
            onJobStarted: (Job) -> Unit,
    ): CallEndpointCompat? {
        // In-memory pref is set by JS setup; fall back to the persisted value for the native
        // cold-start push path where the call is registered before JS setup runs.
        val pref =
                AudioEndpointStore.getDefaultEndpointPref()
                        ?: SettingsStore.getDefaultDeviceEndpointType(context)
                        ?: return null
        val prefType = when (pref) {
            AudioEndpointUtils.TYPE_EARPIECE -> CallEndpointCompat.TYPE_EARPIECE
            AudioEndpointUtils.TYPE_SPEAKER -> CallEndpointCompat.TYPE_SPEAKER
            else -> return null
        }

        val latestPreCallEndpoints = MutableStateFlow<List<CallEndpointCompat>>(emptyList())
        // Collected on Main: the underlying audio-device/bluetooth listeners expect a Looper.
        val job = scope.launch(Dispatchers.Main) {
            callsManager.getAvailableStartingCallEndpoints().collect {
                latestPreCallEndpoints.value = it
            }
        }

        val endpoints =
                withTimeoutOrNull(PRE_CALL_ENDPOINTS_TIMEOUT_MS) {
                    latestPreCallEndpoints.first { it.isNotEmpty() }
                } ?: emptyList()

        // Never override a physically-connected wired/bluetooth device.
        val hasWiredOrBt = endpoints.any { AudioEndpointUtils.isWiredOrBluetooth(it.type) }
        val preferred =
                if (hasWiredOrBt) null else endpoints.firstOrNull { it.type == prefType }

        if (preferred == null) {
            job.cancel()
            return null
        }
        debugLog(TAG, "[repository] resolvePreferredStartingEndpoint: preferring '$pref'")
        onJobStarted(job)
        return preferred
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
        // Track previous state per call for diffing (only non-pending calls)
        var previousCalls: Map<String, Call.Registered> = emptyMap()

        return calls
                .onEach { allCalls ->
                    // Filter out pending calls — they are not yet registered in Telecom
                    val currentCalls = allCalls.filter { (_, call) -> !call.isPending }

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
                            if (previous.currentCallEndpoint != call.currentCallEndpoint ||
                                    previous.availableCallEndpoints != call.availableCallEndpoints) {
                                _listener?.onCallAudioEndpointsChanged(callId)
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

    /**
     * Collect the action source to handle client actions inside the call scope. The channel is
     * unbounded, so an action sent while a previous one is still suspended (for example
     * `Disconnect` during `answer`) is processed next instead of being dropped. Actions other
     * than `Disconnect` are ignored once this registration no longer owns the call.
     */
    private suspend fun CallControlScope.processCallActions(
            callId: String,
            flags: CallActionFlags,
            actionSource: Flow<CallAction>
    ) {
        actionSource.collect { action ->
            if (action !is CallAction.Disconnect && _calls.value[callId]?.actionSource !== flags.actionSource) {
                debugLog(
                        TAG,
                        "[repository] processCallActions[$callId]: Ignoring ${action::class.simpleName}, call is no longer registered"
                )
                return@collect
            }
            debugLog(TAG, "[repository] processCallActions[$callId]: action: ${action::class.simpleName}")
            when (action) {
                is CallAction.Answer -> {
                    doAnswer(callId, flags)
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
        flags.isSelfDisconnected.set(true)
        debugLog(TAG, "[repository] doDisconnect[$callId]: Disconnecting call with cause: ${action.cause}")
        disconnect(action.cause)
        debugLog(TAG, "[repository] doDisconnect[$callId]: Disconnect called, triggering onIsCallDisconnected")
        onIsCallDisconnected(callId, flags)(action.cause)
    }

    private suspend fun CallControlScope.doAnswer(callId: String, flags: CallActionFlags) {
        flags.isSelfAnswered.set(true)
        val callType =
                _calls.value[callId]?.callAttributes?.callType
                        ?: CallAttributesCompat.CALL_TYPE_VIDEO_CALL

        when (val result = answer(callType)) {
            is CallControlResult.Success -> {
                onIsCallAnswered(callId, flags)(callType)
            }
            is CallControlResult.Error -> {
                Log.e(
                        TAG,
                        "[repository] doAnswer[$callId]: Answer failed with error code: ${result.errorCode}"
                )
                flags.isSelfAnswered.set(false)
                // Telecom still holds the call after a failed answer, so disconnect it or it blocks
                // every later incoming call (MAX_RINGING_CALLS); LOCAL because
                // CallControl.disconnect only accepts LOCAL/REMOTE/MISSED/REJECTED.
                doDisconnect(callId, flags, CallAction.Disconnect(DisconnectCause(DisconnectCause.LOCAL)))
            }
        }
    }

    private fun onIsCallAnswered(callId: String, flags: CallActionFlags): suspend (type: Int) -> Unit = {
        debugLog(
                TAG,
                "[repository] onIsCallAnswered[$callId]: Call answered, type: $it, isSelfAnswered: ${flags.isSelfAnswered.get()}"
        )
        updateCallById(callId) { copy(isActive = true, isOnHold = false) }

        val source = if (flags.isSelfAnswered.get()) EventSource.APP else EventSource.SYS
        if (_calls.value.containsKey(callId)) {
            _listener?.onIsCallAnswered(callId, source)
        }
        flags.isSelfAnswered.set(false)
        debugLog(TAG, "[repository] onIsCallAnswered[$callId]: Call state updated to active")
    }

    private fun onIsCallDisconnected(callId: String, flags: CallActionFlags): suspend (cause: DisconnectCause) -> Unit = { cause ->
        debugLog(
                TAG,
                "[repository] onIsCallDisconnected[$callId]: Call disconnected, cause: ${cause.reason}, description: ${cause.description}"
        )
        val source = if (flags.isSelfDisconnected.get()) EventSource.APP else EventSource.SYS

        removeRegistration(callId, flags)
        _listener?.onIsCallDisconnected(callId, cause, source)
        flags.isSelfDisconnected.set(false)
        // End the session collectors so core-telecom's coroutineScope in addCall can complete;
        // runs for both app-initiated (doDisconnect) and Telecom-initiated disconnects.
        flags.sessionJob?.cancel()
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
