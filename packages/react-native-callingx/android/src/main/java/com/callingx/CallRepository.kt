/*
 * Copyright 2023 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.callingx

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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.consumeAsFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.scan
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import com.callingx.model.Call
import com.callingx.model.CallAction

/**
 * The central repository that keeps track of the current call and allows to register new calls.
 *
 * This class contains the main logic to integrate with Telecom SDK.
 *
 * @see registerCall
 */
@RequiresApi(Build.VERSION_CODES.O)
class CallRepository(context: Context) {

    interface Listener {
        fun onCallStateChanged(call: Call)
        fun onIsCallAnswered(callId: String)
        fun onIsCallDisconnected(cause: DisconnectCause)
        fun onIsCallInactive(callId: String)
        fun onIsCallActive(callId: String)
        fun onCallRegistered(callId: String)
        fun onMuteCallChanged(callId: String, isMuted: Boolean)
        fun onCallEndpointChanged(callId: String, endpoint: String)
    }

    companion object {
        private const val TAG = "[Callingx] CallRepository"
    }

    private var listener: Listener? = null
    private var observeCallStateJob: Job? = null

    private val callsManager: CallsManager
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    // Keeps track of the current TelecomCall state
    private val _currentCall: MutableStateFlow<Call> = MutableStateFlow(Call.None)
    val currentCall = _currentCall.asStateFlow()

    init {
        val capabilities =
                CallsManager.CAPABILITY_SUPPORTS_CALL_STREAMING and
                        CallsManager.CAPABILITY_SUPPORTS_VIDEO_CALLING
        callsManager =
                CallsManager(context.applicationContext).apply {
                    registerAppWithTelecom(capabilities)
                }
        Log.d(TAG, "[repository] init: CallsManager created and registered")
    }

    fun setListener(listener: Listener) {
        this.listener = listener

        observeCallStateJob?.cancel()
        observeCallStateJob = observeCallState()
    }

    fun release() {
        val currentCall = currentCall.value
        if (currentCall is Call.Registered) {
            currentCall.processAction(
                    CallAction.Disconnect(DisconnectCause(DisconnectCause.LOCAL))
            )
        }
        _currentCall.value = Call.None

        observeCallStateJob?.cancel()
        observeCallStateJob = null
        listener = null

        scope.cancel()
    }

    /**
     * Register a new call with the provided attributes. Use the [currentCall] StateFlow to receive
     * status updates and process call related actions.
     */
    suspend fun registerCall(
            callId: String,
            displayName: String,
            address: Uri,
            isIncoming: Boolean,
            isVideo: Boolean,
            displayOptions: Bundle?,
    ) {
        Log.d(
                TAG,
                "[repository] registerCall: Starting registration - Name: $displayName, Address: $address, Incoming: $isIncoming"
        )

        // For simplicity we don't support multiple calls
        check(_currentCall.value !is Call.Registered) {
            "There cannot be more than one call at the same time."
        }
        Log.d(
                TAG,
                "[repository] registerCall: No existing call found, proceeding with registration"
        )

        // Create the call attributes
        val attributes = createCallAttributes(displayName, address, isIncoming, isVideo)
        // Creates a channel to send actions to the call scope.
        val actionSource = Channel<CallAction>()

        // Register the call and handle actions in the scope
        try {
            callsManager.addCall(
                    attributes,
                    onIsCallAnswered, // Watch needs to know if it can answer the call
                    onIsCallDisconnected,
                    onIsCallActive,
                    onIsCallInactive
            ) {
                Log.d(TAG, "[repository] registerCall: Inside call scope, setting up call handlers")

                // Consume the actions to interact with the call inside the scope
                launch { processCallActions(actionSource.consumeAsFlow()) }

                // Update the state to registered with default values while waiting for Telecom
                // updates
                Log.d(
                        TAG,
                        "[repository] registerCall: Creating Registered call state with ID: $callId"
                )
                _currentCall.value =
                        Call.Registered(
                                id = callId,
                                isActive = false, // can we just register the call as active?
                                isOnHold = false,
                                callAttributes = attributes,
                                displayOptions = displayOptions,
                                isMuted = false,
                                errorCode = null,
                                currentCallEndpoint = null,
                                availableCallEndpoints = emptyList(),
                                actionSource = actionSource,
                        )
                Log.d(TAG, "[repository] registerCall: Call state updated to Registered")

                launch {
                    currentCallEndpoint.collect {
                        updateCurrentCall { copy(currentCallEndpoint = it) }
                    }
                }
                launch {
                    availableEndpoints.collect {
                        updateCurrentCall { copy(availableCallEndpoints = it) }
                    }
                }
                launch { isMuted.collect { updateCurrentCall { copy(isMuted = it) } } }
            }
            Log.d(TAG, "[repository] registerCall: Call successfully registered with Telecom SDK")
        } catch (e: Exception) {
            Log.e(TAG, "[repository] registerCall: Error registering call", e)
            throw e
        } finally {
            Log.d(TAG, "[repository] registerCall: Call scope ended, setting state to None")
            _currentCall.value = Call.None
        }
    }

    private fun observeCallState(): Job {
        return currentCall
                .scan(Pair<Call?, Call>(null, currentCall.value)) { (_, prev), next ->
                    Pair(prev, next)
                }
                .onEach { (previous, current) ->
                    when {
                        previous is Call.None && current is Call.Registered -> {
                            listener?.onCallRegistered(current.id)
                        }
                        previous is Call.Registered && current is Call.Registered -> {
                            if (previous.isMuted != current.isMuted) {
                                Log.d(TAG, "[repository] observeCallState: Mute changed: ${current.isMuted}")
                                listener?.onMuteCallChanged(current.id, current.isMuted)
                            }
                            if (previous.currentCallEndpoint != current.currentCallEndpoint) {
                                current.currentCallEndpoint?.let {
                                    listener?.onCallEndpointChanged(current.id, it.name.toString())
                                }
                            }
                        }
                    }
                    listener?.onCallStateChanged(current)
                }
                .launchIn(scope)
    }

    /** Collect the action source to handle client actions inside the call scope */
    private suspend fun CallControlScope.processCallActions(actionSource: Flow<CallAction>) {
        actionSource.collect { action ->
            Log.d(TAG, "[repository] processCallActions: action: ${action::class.simpleName}")
            when (action) {
                is CallAction.Answer -> {
                    doAnswer(action.isAudioCall)
                }
                is CallAction.Disconnect -> {
                    doDisconnect(action)
                }
                is CallAction.SwitchAudioEndpoint -> {
                    doSwitchEndpoint(action)
                }
                is CallAction.TransferCall -> {
                    Log.d(
                            TAG,
                            "[repository] processCallActions: Transfer to endpoint: ${action.endpointId}"
                    )
                    val call = _currentCall.value as? Call.Registered
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
                                "[repository] processCallActions: Endpoint not found for transfer, ignoring"
                        )
                    }
                }
                CallAction.Hold -> {
                    when (val result = setInactive()) {
                        is CallControlResult.Success -> {
                            onIsCallInactive()
                        }
                        is CallControlResult.Error -> {
                            Log.e(
                                    TAG,
                                    "[repository] processCallActions: Hold action failed with error code: ${result.errorCode}"
                            )
                            updateCurrentCall { copy(errorCode = result.errorCode) }
                        }
                    }
                }
                CallAction.Activate -> {
                    when (val result = setActive()) {
                        is CallControlResult.Success -> {
                            onIsCallActive()
                        }
                        is CallControlResult.Error -> {
                            Log.e(
                                    TAG,
                                    "[repository] processCallActions: Activate action failed with error code: ${result.errorCode}"
                            )
                            updateCurrentCall { copy(errorCode = result.errorCode) }
                        }
                    }
                }
                is CallAction.ToggleMute -> {
                    // We cannot programmatically mute the telecom stack. Instead we just update
                    // the state of the call and this will start/stop audio capturing.
                    Log.d(TAG, "[repository] processCallActions: Toggling mute: ${action.isMute}")
                    updateCurrentCall {
                        val newMutedState = action.isMute
                        copy(isMuted = newMutedState)
                    }
                }
            }
        }
        Log.d(TAG, "[repository] processCallActions: Action collection ended")
    }

    /**
     * Update the current state of our call applying the transform lambda only if the call is
     * registered. Otherwise keep the current state
     */
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

    private suspend fun CallControlScope.doSwitchEndpoint(
            action: CallAction.SwitchAudioEndpoint
    ) {
        Log.d(TAG, "[repository] doSwitchEndpoint: Switching to endpoint: ${action.endpointId}")
        // TODO once availableCallEndpoints is a state flow we can just get the value
        val endpoints = (_currentCall.value as Call.Registered).availableCallEndpoints

        // Switch to the given endpoint or fallback to the best possible one.
        val newEndpoint = endpoints.firstOrNull { it.identifier == action.endpointId }

        if (newEndpoint != null) {
            Log.d(
                    TAG,
                    "[repository] doSwitchEndpoint: Found endpoint: ${newEndpoint.name}, requesting change"
            )
            requestEndpointChange(newEndpoint).also {
                Log.d(TAG, "[repository] doSwitchEndpoint: Endpoint change result: $it")
            }
        } else {
            Log.w(TAG, "[repository] doSwitchEndpoint: Endpoint not found in available endpoints")
        }
    }

    private suspend fun CallControlScope.doDisconnect(action: CallAction.Disconnect) {
        Log.d(TAG, "[repository] doDisconnect: Disconnecting call with cause: ${action.cause}")
        disconnect(action.cause)
        Log.d(TAG, "[repository] doDisconnect: Disconnect called, triggering onIsCallDisconnected")
        onIsCallDisconnected(action.cause)
    }

    private suspend fun CallControlScope.doAnswer(isAudioCall: Boolean) {
        val callType =
                if (isAudioCall) CallAttributesCompat.CALL_TYPE_AUDIO_CALL
                else CallAttributesCompat.CALL_TYPE_VIDEO_CALL

        when (val result = answer(callType)) {
            is CallControlResult.Success -> {
                onIsCallAnswered(callType)
            }
            is CallControlResult.Error -> {
                Log.e(
                        TAG,
                        "[repository] doAnswer: Answer failed with error code: ${result.errorCode}"
                )
                updateCurrentCall {
                    Call.Unregistered(
                            id = id,
                            callAttributes = callAttributes,
                            disconnectCause = DisconnectCause(DisconnectCause.BUSY),
                    )
                }
            }
        }
    }

    /**
     * Can the call be successfully answered?? TIP: We would check the connection/call state to see
     * if we can answer a call Example you may need to wait for another call to hold.
     */
    val onIsCallAnswered: suspend (type: Int) -> Unit = {
        Log.d(TAG, "[repository] onIsCallAnswered: Call answered, type: $it")
        updateCurrentCall { copy(isActive = true, isOnHold = false) }

        val call = _currentCall.value
        if (call is Call.Registered) {
            listener?.onIsCallAnswered(call.id)
        }
        Log.d(TAG, "[repository] onIsCallAnswered: Call state updated to active")
    }

    /** Can the call perform a disconnect */
    val onIsCallDisconnected: suspend (cause: DisconnectCause) -> Unit = {
        Log.d(
                TAG,
                "[repository] onIsCallDisconnected: Call disconnected, cause: ${it.reason}, description: ${it.description}"
        )
        updateCurrentCall { Call.Unregistered(id, callAttributes, it) }

        listener?.onIsCallDisconnected(it)
        Log.d(TAG, "[repository] onIsCallDisconnected: Call state updated to Unregistered")
    }

    /**
     * Check is see if we can make the call active. Other calls and state might stop us from
     * activating the call
     */
    val onIsCallActive: suspend () -> Unit = {
        Log.d(TAG, "[repository] onIsCallActive: Call became active")
        updateCurrentCall {
            copy(
                    errorCode = null,
                    isActive = true,
                    isOnHold = false,
            )
        }

        val call = _currentCall.value
        if (call is Call.Registered) {
            listener?.onIsCallActive(call.id)
        }
        Log.d(TAG, "[repository] onIsCallActive: Call state updated")
    }

    /** Check to see if we can make the call inactivate */
    val onIsCallInactive: suspend () -> Unit = {
        Log.d(TAG, "[repository] onIsCallInactive: Call became inactive (on hold)")
        updateCurrentCall { copy(errorCode = null, isOnHold = true) }

        val call = _currentCall.value
        if (call is Call.Registered) {
            listener?.onIsCallInactive(call.id)
        }
        Log.d(TAG, "[repository] onIsCallInactive: Call state updated to on hold")
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
