/*
 * Copyright 2024 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.streamvideo.reactnative.audio

import android.app.Activity
import android.content.Context
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.streamvideo.reactnative.audio.utils.AudioDeviceEndpointUtils
import com.streamvideo.reactnative.audio.utils.AudioFocusUtil
import com.streamvideo.reactnative.audio.utils.AudioManagerUtil
import com.streamvideo.reactnative.audio.utils.AudioManagerUtil.Companion.getAvailableAudioDevices
import com.streamvideo.reactnative.audio.utils.AudioSetupStoreUtil
import com.streamvideo.reactnative.audio.utils.CallAudioRole
import com.streamvideo.reactnative.callmanager.StreamInCallManagerModule
import com.streamvideo.reactnative.model.AudioDeviceEndpoint
import com.streamvideo.reactnative.model.AudioDeviceEndpoint.Companion.EndpointType
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

data class EndpointMaps(
    // earpiece, speaker, unknown, wired_headset
    val bluetoothEndpoints: HashMap<String, AudioDeviceEndpoint>,
    // all bt endpoints
    val nonBluetoothEndpoints: HashMap<@EndpointType Int, AudioDeviceEndpoint>
)

class AudioDeviceManager(
    private val mReactContext: ReactApplicationContext
) : AutoCloseable, AudioDeviceCallback(), AudioManager.OnAudioFocusChangeListener {

    private val mEndpointMaps by lazy {
        val initialAudioDevices = getAvailableAudioDevices(mAudioManager)
        val initialEndpoints =
            AudioDeviceEndpointUtils.getEndpointsFromAudioDeviceInfo(initialAudioDevices)
        val bluetoothEndpoints = HashMap<String, AudioDeviceEndpoint>()
        val nonBluetoothEndpoints = HashMap<@EndpointType Int, AudioDeviceEndpoint>()
        for (device in initialEndpoints) {
            if (device.isBluetoothType()) {
                bluetoothEndpoints[device.name] = device
            } else {
                nonBluetoothEndpoints[device.type] = device
            }
        }
        EndpointMaps(bluetoothEndpoints, nonBluetoothEndpoints)
    }

    private var _cachedAvailableEndpointNamesSet = setOf<String>()
    private var cachedAvailableEndpointNamesSet: Set<String>
        get() = _cachedAvailableEndpointNamesSet
        set(value) {
            _cachedAvailableEndpointNamesSet = value
            // send an event to the frontend everytime the list of available endpoints changes
            sendAudioStatusEvent();
        }

    /** Returns the currently selected audio device. */
    private var _selectedAudioDeviceEndpoint: AudioDeviceEndpoint? = null
    private var selectedAudioDeviceEndpoint: AudioDeviceEndpoint?
        get() = _selectedAudioDeviceEndpoint
        set(value) {
            _selectedAudioDeviceEndpoint = value
            // send an event to the frontend everytime this endpoint changes
            sendAudioStatusEvent()
        }

    // Default audio device; speaker phone for video calls or earpiece for audio only phone calls
    @EndpointType
    var defaultAudioDevice = AudioDeviceEndpoint.TYPE_SPEAKER

    /** Contains the user-selected audio device which overrides the predefined selection scheme */
    @EndpointType
    private var userSelectedAudioDevice: Int? = null

    private val mAudioManager =
        mReactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    /**
     * Indicator that we have lost audio focus.
     */
    private var audioFocusLost = false

    private var audioFocusUtil = AudioFocusUtil(mAudioManager, this)
    private var audioSetupStoreUtil = AudioSetupStoreUtil(mReactContext, mAudioManager, this)

    var callAudioRole: CallAudioRole = CallAudioRole.Communicator

    val bluetoothManager = BluetoothManager(mReactContext, this)

    init {
        // Note that we will immediately receive a call to onDevicesAdded with the list of
        // devices which are currently connected.
        mAudioManager.registerAudioDeviceCallback(this, null)
    }

    fun start(activity: Activity) {
        runInAudioThread {
            userSelectedAudioDevice = null
            selectedAudioDeviceEndpoint = null
            audioSetupStoreUtil.storeOriginalAudioSetup()
            if (callAudioRole == CallAudioRole.Communicator) {
                // Audio routing is manually controlled by the SDK in communication media mode
                // and local microphone can be published
                mAudioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                activity.volumeControlStream = AudioManager.STREAM_VOICE_CALL
                bluetoothManager.start()
                mAudioManager.registerAudioDeviceCallback(this, null)
                updateAudioDeviceState()
            } else {
                // Audio routing is handled automatically by the system in normal media mode
                // and bluetooth microphones may not work on some devices.
                mAudioManager.mode = AudioManager.MODE_NORMAL
                activity.volumeControlStream = AudioManager.USE_DEFAULT_STREAM_TYPE
            }

            audioSetupStoreUtil.storeOriginalAudioSetup()
            audioFocusUtil.requestFocus(callAudioRole, mReactContext)
        }
    }

    fun stop() {
        runInAudioThread {
            if (callAudioRole == CallAudioRole.Communicator) {
                if (Build.VERSION.SDK_INT >= 31) {
                    mAudioManager.clearCommunicationDevice()
                } else {
                    mAudioManager.setSpeakerphoneOn(false)
                }
                bluetoothManager.stop()
            }
            audioSetupStoreUtil.restoreOriginalAudioSetup()
            audioFocusUtil.abandonFocus()
        }
    }

    fun setMicrophoneMute(enable: Boolean) {
        if (enable != mAudioManager.isMicrophoneMute) {
            mAudioManager.isMicrophoneMute = enable
        }
    }

    private fun getEndpointFromName(name: String): AudioDeviceEndpoint? {
        val endpointType = AudioDeviceEndpointUtils.endpointStringToType(name)
        val endpoint = when (endpointType) {
            AudioDeviceEndpoint.TYPE_SPEAKER, AudioDeviceEndpoint.TYPE_EARPIECE, AudioDeviceEndpoint.TYPE_WIRED_HEADSET -> mEndpointMaps.nonBluetoothEndpoints[endpointType]
            else -> mEndpointMaps.bluetoothEndpoints[name]
        }
        return endpoint
    }

    fun setSpeakerphoneOn(enable: Boolean) {
        if (enable) {
            switchDeviceEndpointType(AudioDeviceEndpoint.TYPE_SPEAKER)
        } else {
            if (Build.VERSION.SDK_INT >= 31) {
                mAudioManager.clearCommunicationDevice()
                // sets the first device that is not speaker
                getCurrentDeviceEndpoints().firstOrNull {
                    !it.isSpeakerType()
                }?.also {
                    switchDeviceEndpointType(it.type)
                }
            } else {
                mAudioManager.setSpeakerphoneOn(false)
            }
        }
    }

    private fun switchDeviceEndpointType(@EndpointType deviceType: Int) {
        val newDevice = AudioManagerUtil.switchDeviceEndpointType(
            deviceType,
            mEndpointMaps,
            mAudioManager,
            bluetoothManager
        )
        this.selectedAudioDeviceEndpoint = newDevice
    }

    fun switchDeviceFromDeviceName(
        deviceName: String
    ) {
        Log.d(TAG, "switchDeviceFromDeviceName: deviceName = $deviceName")
        Log.d(
            TAG,
            "switchDeviceFromDeviceName: mEndpointMaps.bluetoothEndpoints = ${mEndpointMaps.bluetoothEndpoints}"
        )
        runInAudioThread {
            val btDevice = mEndpointMaps.bluetoothEndpoints[deviceName]
            if (btDevice != null) {
                if (Build.VERSION.SDK_INT >= 31) {
                    mAudioManager.setCommunicationDevice(btDevice.deviceInfo)
                    bluetoothManager.updateDevice()
                    this.selectedAudioDeviceEndpoint = btDevice
                } else {
                    switchDeviceEndpointType(
                        AudioDeviceEndpoint.TYPE_BLUETOOTH
                    )
                }
            } else {
                val endpointType = AudioDeviceEndpointUtils.endpointStringToType(deviceName)
                switchDeviceEndpointType(
                    endpointType
                )
            }
        }
    }

    override fun close() {
        mAudioManager.unregisterAudioDeviceCallback(this)
    }

    override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>?) {
        if (addedDevices != null) {
            runInAudioThread {
                endpointsAddedUpdate(
                    AudioDeviceEndpointUtils.getEndpointsFromAudioDeviceInfo(
                        addedDevices.toList()
                    )
                )
            }
        }
    }

    override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) {
        if (removedDevices != null) {
            runInAudioThread {
                endpointsRemovedUpdate(
                    AudioDeviceEndpointUtils.getEndpointsFromAudioDeviceInfo(
                        removedDevices.toList()
                    )
                )
            }
        }
    }

    private fun endpointsAddedUpdate(addedCallEndpoints: List<AudioDeviceEndpoint>) {
        // START tracking an endpoint
        var addedDevicesCount = 0
        for (maybeNewEndpoint in addedCallEndpoints) {
            addedDevicesCount += maybeAddCallEndpoint(maybeNewEndpoint)
        }
        if (addedDevicesCount > 0) {
            updateAudioDeviceState()
        }
    }

    private fun endpointsRemovedUpdate(removedCallEndpoints: List<AudioDeviceEndpoint>) {
        // STOP tracking an endpoint
        var removedDevicesCount = 0
        for (maybeRemovedDevice in removedCallEndpoints) {
            removedDevicesCount += maybeRemoveCallEndpoint(maybeRemovedDevice)
        }
        if (removedDevicesCount > 0) {
            updateAudioDeviceState()
        }
    }

    private fun getCurrentDeviceEndpoints(): List<AudioDeviceEndpoint> {
        if (Build.VERSION.SDK_INT >= 31) {
            return (mEndpointMaps.bluetoothEndpoints.values + mEndpointMaps.nonBluetoothEndpoints.values).sorted()
        } else {
            val btEndpoint = mEndpointMaps.bluetoothEndpoints[bluetoothManager.getDeviceName()]
            if (btEndpoint != null) {
                val list = mutableListOf(btEndpoint)
                list.addAll(mEndpointMaps.nonBluetoothEndpoints.values)
                return list.sorted()
            } else {
                return mEndpointMaps.nonBluetoothEndpoints.values.sorted()
            }

        }
    }

    private fun maybeAddCallEndpoint(endpoint: AudioDeviceEndpoint): Int {
        if (endpoint.isBluetoothType()) {
            if (!mEndpointMaps.bluetoothEndpoints.containsKey(endpoint.name)) {
                mEndpointMaps.bluetoothEndpoints[endpoint.name] = endpoint
                Log.d(TAG, "maybeAddCallEndpoint: bluetooth endpoint added: " + endpoint.name)
                return 1
            }
        } else {
            if (!mEndpointMaps.nonBluetoothEndpoints.containsKey(endpoint.type)) {
                mEndpointMaps.nonBluetoothEndpoints[endpoint.type] = endpoint
                Log.d(TAG, "maybeAddCallEndpoint: non-bluetooth endpoint added: " + endpoint.name)
                return 1
            }
        }
        return 0
    }

    private fun maybeRemoveCallEndpoint(endpoint: AudioDeviceEndpoint): Int {
        // TODO:: determine if it is necessary to cleanup listeners here
        if (endpoint.isBluetoothType()) {
            if (mEndpointMaps.bluetoothEndpoints.containsKey(endpoint.name)) {
                mEndpointMaps.bluetoothEndpoints.remove(endpoint.name)
                Log.d(TAG, "maybeRemoveCallEndpoint: bluetooth endpoint removed: " + endpoint.name)
                return 1
            }
        } else {
            if (mEndpointMaps.nonBluetoothEndpoints.containsKey(endpoint.type)) {
                mEndpointMaps.nonBluetoothEndpoints.remove(endpoint.type)
                Log.d(
                    TAG,
                    "maybeRemoveCallEndpoint: non-bluetooth endpoint removed: " + endpoint.name
                )
                return 1
            }
        }
        return 0
    }

    fun muteAudioOutput() {
        mAudioManager.adjustStreamVolume(
            if (callAudioRole === CallAudioRole.Communicator) AudioManager.STREAM_VOICE_CALL else AudioManager.STREAM_MUSIC,
            AudioManager.ADJUST_MUTE,
            AudioManager.FLAG_REMOVE_SOUND_AND_VIBRATE // Optional: prevents sound/vibration on mute
        )
    }

    fun unmuteAudioOutput() {
        mAudioManager.adjustStreamVolume(
            if (callAudioRole === CallAudioRole.Communicator) AudioManager.STREAM_VOICE_CALL else AudioManager.STREAM_MUSIC,
            AudioManager.ADJUST_UNMUTE,
            AudioManager.FLAG_SHOW_UI
        )
    }

    /**
     * Updates the list of available audio devices and selects a new audio device based on priority.
     *
     * This function performs the following actions:
     * 1. Retrieves the current list of available audio device endpoints.
     * 2. Compares the current list with the cached list to detect changes.
     * 3. Updates the Bluetooth device state if necessary (especially for older Android platforms).
     * 4. Determines the new audio device based on the following priority:
     *    - Wired Headset (WH)
     *    - Bluetooth (BT)
     *    - Default audio device (speaker or earpiece)
     * 5. If a user has manually selected an audio device, that selection takes precedence.
     * 6. Handles Bluetooth SCO (Synchronous Connection-Oriented) connection:
     *    - If the new device is Bluetooth and a headset is available, it attempts to start SCO audio.
     *    - If SCO connection fails, it reverts the Bluetooth selection and chooses an alternative device.
     *    - If a previous selection was Bluetooth and the new selection is not, it stops SCO audio.
     * 7. Switches to the new audio device endpoint.
     * 8. If the selected device or the list of available devices has changed, it sends an audio status event.
     *
     * The entire operation is performed on a dedicated audio thread to avoid blocking the main thread.
     */
    fun updateAudioDeviceState() {
        runInAudioThread {
            val audioDevices = getCurrentDeviceEndpoints()
            val audioDeviceNamesSet = audioDevices.map { it.name }.toSet()
            val devicesChanged = if (cachedAvailableEndpointNamesSet.size != audioDevices.size) {
                true
            } else {
                cachedAvailableEndpointNamesSet != audioDeviceNamesSet
            }
            cachedAvailableEndpointNamesSet = audioDeviceNamesSet
            Log.d(
                TAG,
                ("updateAudioDeviceState() Device status: available=$audioDevices, selected=$selectedAudioDeviceEndpoint, user selected=" + endpointTypeDebug(
                    userSelectedAudioDevice
                ))
            )

            // Double-check if any Bluetooth headset is connected once again (useful for older android platforms)
            // TODO: we can possibly remove this, to be tested on older platforms
            if (bluetoothManager.bluetoothState == BluetoothManager.State.HEADSET_AVAILABLE || bluetoothManager.bluetoothState == BluetoothManager.State.HEADSET_UNAVAILABLE) {
                bluetoothManager.updateDevice()
            }
            /** sets newAudioDevice initially to this order: WH -> BT -> default(speaker or earpiece) */
            var newAudioDevice = defaultAudioDevice
            audioDevices.firstOrNull {
                it.isWiredHeadsetType() || it.isBluetoothType()
            }?.also {
                newAudioDevice = it.type
            }
            var deviceSwitched = false
            val userSelectedAudioDevice = this.userSelectedAudioDevice
            if (userSelectedAudioDevice !== null && userSelectedAudioDevice != AudioDeviceEndpoint.TYPE_UNKNOWN) {
                newAudioDevice = userSelectedAudioDevice
            }
            Log.d(
                TAG, ("Decided newAudioDevice: ${endpointTypeDebug(newAudioDevice)}")
            )
            /** To be called when BT SCO connection fails
             * Will do the following:
             * 1 - revert user selection if needed
             * 2 - sets newAudioDevice to something other than BT
             * 3 - change the bt manager to device state from sco connection state
             * */
            fun revertBTSelection() {
                val selectedAudioDeviceEndpoint = this.selectedAudioDeviceEndpoint
                // BT connection, so revert user selection if needed
                if (userSelectedAudioDevice == AudioDeviceEndpoint.TYPE_BLUETOOTH) {
                    this.userSelectedAudioDevice = null
                }
                // prev selection was not BT, but new was BT
                // new can now be WiredHeadset or default if there was no selection before
                if (selectedAudioDeviceEndpoint != null && selectedAudioDeviceEndpoint.type != AudioDeviceEndpoint.TYPE_UNKNOWN && selectedAudioDeviceEndpoint.type != AudioDeviceEndpoint.TYPE_BLUETOOTH) {
                    newAudioDevice = selectedAudioDeviceEndpoint.type
                } else {
                    newAudioDevice = defaultAudioDevice
                    audioDevices.firstOrNull {
                        it.isWiredHeadsetType()
                    }?.also {
                        newAudioDevice = it.type
                    }
                }
                // change the bt manager to device state from sco connection state
                bluetoothManager.updateDevice()
                Log.d(
                    TAG, ("revertBTSelection newAudioDevice: ${endpointTypeDebug(newAudioDevice)}")
                )
            }

            var selectedAudioDeviceEndpoint = this.selectedAudioDeviceEndpoint
            if (selectedAudioDeviceEndpoint == null || newAudioDevice != selectedAudioDeviceEndpoint.type) {
                // --- stop bluetooth if prev selection was bluetooth
                if (selectedAudioDeviceEndpoint?.type == AudioDeviceEndpoint.TYPE_BLUETOOTH && (bluetoothManager.bluetoothState == BluetoothManager.State.SCO_CONNECTED || bluetoothManager.bluetoothState == BluetoothManager.State.SCO_CONNECTING)) {
                    bluetoothManager.stopScoAudio()
                    bluetoothManager.updateDevice()
                }

                // --- start bluetooth if new is BT and we have a headset
                if (newAudioDevice == AudioDeviceEndpoint.TYPE_BLUETOOTH && bluetoothManager.bluetoothState == BluetoothManager.State.HEADSET_AVAILABLE) {
                    // Attempt to start Bluetooth SCO audio (takes a few second to start on older platforms).
                    if (!bluetoothManager.startScoAudio()) {
                        revertBTSelection()
                    }

                    // already selected BT device
                    if (bluetoothManager.bluetoothState == BluetoothManager.State.SCO_CONNECTED) {
                        selectedAudioDeviceEndpoint =
                            getEndpointFromName(bluetoothManager.getDeviceName()!!)
                        this.selectedAudioDeviceEndpoint = selectedAudioDeviceEndpoint
                        deviceSwitched = true
                    } else if (
                    // still connecting (happens on older Android platforms)
                        bluetoothManager.bluetoothState == BluetoothManager.State.SCO_CONNECTING) {
                        // on older Android platforms
                        // it will call this update function again, once connected or disconnected
                        // so we can skip executing further
                        return@runInAudioThread
                    }
                }

                /** This check is meant for older Android platforms
                 * it would have called this device update function again on timer execution
                 * after two cases
                 * 1 - SCO_CONNECTED or
                 * 2 - SCO_DISCONNECTING
                 * Here we see if it was disconnected then we revert to non-bluetooth selection
                 * */
                if (newAudioDevice == AudioDeviceEndpoint.TYPE_BLUETOOTH && selectedAudioDeviceEndpoint?.type != AudioDeviceEndpoint.TYPE_BLUETOOTH && bluetoothManager.bluetoothState == BluetoothManager.State.SCO_DISCONNECTING) {
                    revertBTSelection()
                }

                if (newAudioDevice != selectedAudioDeviceEndpoint?.type) {
                    // BT sco would be already connected at this point, so no need to switch again
                    if (newAudioDevice != AudioDeviceEndpoint.TYPE_BLUETOOTH) {
                        switchDeviceEndpointType(newAudioDevice)
                    }
                    deviceSwitched = true
                }

                if (deviceSwitched || devicesChanged) {
                    Log.d(
                        TAG,
                        ("New device status: " + "available=" + audioDevices + ", " + "selected=" + this.selectedAudioDeviceEndpoint)
                    )
                }
                Log.d(
                    TAG, "--- updateAudioDeviceState done"
                )
            } else {
                Log.d(
                    TAG, "--- updateAudioDeviceState: no change"
                )
            }
        }
    }

    override fun onAudioFocusChange(focusChange: Int) {
        when (focusChange) {
            AudioManager.AUDIOFOCUS_GAIN -> {
                Log.d(TAG, "Audio focus gained")
                // Some other application potentially stole our audio focus
                // temporarily. Restore our mode.
                if (audioFocusLost) {
                    // removing the currently selected device store, as its untrue
                    selectedAudioDeviceEndpoint = null
                    // removing the currectly selected device store will make sure a device selection is made
                    updateAudioDeviceState()
                }
                audioFocusLost = false
            }

            AudioManager.AUDIOFOCUS_LOSS, AudioManager.AUDIOFOCUS_LOSS_TRANSIENT, AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                Log.d(TAG, "Audio focus lost")
                audioFocusLost = true
            }
        }
    }

    fun audioStatusMap(): WritableMap {
        val endpoint = this.selectedAudioDeviceEndpoint
        val availableEndpoints = Arguments.fromList(getCurrentDeviceEndpoints().map { it.name })

        val data = Arguments.createMap()
        data.putArray("devices", availableEndpoints)
        data.putString("currentEndpointType", endpointTypeDebug(endpoint?.type))
        data.putString("selectedDevice", endpoint?.name)
        return data
    }

    fun sendAudioStatusEvent() {
        try {
            if (mReactContext.hasActiveReactInstance()) {
                val payload = audioStatusMap()
                Log.d(TAG, "sendAudioStatusEvent: $payload")
                mReactContext.getJSModule(
                    DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
                ).emit("onAudioDeviceChanged", payload)
            } else {
                Log.e(TAG, "sendEvent(): reactContext is null or not having CatalystInstance yet.")
            }
        } catch (e: RuntimeException) {
            Log.e(
                TAG,
                "sendEvent(): java.lang.RuntimeException: Trying to invoke JS before CatalystInstance has been set!",
                e
            )
        }
    }

    companion object {
        private val TAG: String =
            StreamInCallManagerModule.TAG + ":" + AudioDeviceManager::class.java.simpleName.toString()

        /**
         * Executor service for running audio-related tasks on a dedicated single thread.
         *
         * <p>This executor ensures that all audio processing, recording, playback,
         * or other audio-related operations are executed sequentially and do not
         * interfere with the main UI thread or other background tasks. Using a
         * single-threaded executor for audio tasks helps prevent race conditions
         * and simplifies synchronization when dealing with audio resources.
         *
         * <p>Tasks submitted to this executor will be processed in the order they
         * are submitted.
         */
        private val audioThreadExecutor: ExecutorService = Executors.newSingleThreadExecutor()

        fun runInAudioThread(runnable: Runnable) {
            audioThreadExecutor.execute(runnable)
        }


        /**
         * Converts an endpoint type to a human-readable string for debugging purposes.
         *
         * @param endpointType The endpoint type to convert. Can be null.
         * @return A string representation of the endpoint type, or "NULL" if the input is null.
         */
        private fun endpointTypeDebug(@EndpointType endpointType: Int?): String {
            if (endpointType == null) {
                return "NULL"
            }
            return AudioDeviceEndpointUtils.endpointTypeToString(endpointType)
        }
    }
}
