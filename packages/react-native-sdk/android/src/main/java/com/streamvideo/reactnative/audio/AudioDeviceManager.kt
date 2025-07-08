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

import android.content.Context
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import com.streamvideo.reactnative.model.AudioDeviceEndpoint
import com.streamvideo.reactnative.model.AudioDeviceEndpoint.Companion.EndpointType
import com.streamvideo.reactnative.audio.utils.AudioManagerUtil.Companion.getAvailableAudioDevices
import com.streamvideo.reactnative.audio.utils.AudioDeviceEndpointUtils
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.streamvideo.reactnative.audio.utils.AudioManagerUtil
import com.streamvideo.reactnative.callmanager.AppRTCBluetoothManager
import com.streamvideo.reactnative.callmanager.InCallManagerModule
import com.streamvideo.reactnative.callmanager.InCallManagerModule.Companion.runInAudioThread

interface OnAudioDeviceChangedListener {
    fun onAudioDevicesChanged()
}

data class EndpointMaps(
    // earpiece, speaker, unknown, wired_headset
    val bluetoothEndpoints: HashMap<String, AudioDeviceEndpoint>,
    // all bt endpoints
    val nonBluetoothEndpoints:  HashMap<@EndpointType Int, AudioDeviceEndpoint>
)

internal class AudioDeviceManager(
    private val mReactContext: ReactApplicationContext,
    private val mOnAudioDeviceChangedListener: OnAudioDeviceChangedListener
) : AutoCloseable, AudioDeviceCallback() {

    private val mEndpointMaps by lazy {
        val initialAudioDevices = getAvailableAudioDevices(mAudioManager)
        val initialEndpoints =
            AudioDeviceEndpointUtils.getEndpointsFromAudioDeviceInfo(initialAudioDevices)
        val bluetoothEndpoints = HashMap<String, AudioDeviceEndpoint>()
        val nonBluetoothEndpoints =  HashMap<@EndpointType Int, AudioDeviceEndpoint>()
        for (device in initialEndpoints) {
            if (device.isBluetoothType()) {
                bluetoothEndpoints[device.name] = device
            } else {
                nonBluetoothEndpoints[device.type] = device
            }
        }
        EndpointMaps(bluetoothEndpoints, nonBluetoothEndpoints)
    }

    private val mAudioManager = mReactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    init {
        // Note that we will immediately receive a call to onDevicesAdded with the list of
        // devices which are currently connected.
        mAudioManager.registerAudioDeviceCallback(this, null)
    }

    fun getEndpointFromType(@EndpointType endpointType: Int): AudioDeviceEndpoint? {
        return when (endpointType) {
            AudioDeviceEndpoint.TYPE_BLUETOOTH -> mEndpointMaps.bluetoothEndpoints.values.firstOrNull()
            else -> mEndpointMaps.nonBluetoothEndpoints[endpointType]
        }
    }

    fun getEndpointFromName(name: String): AudioDeviceEndpoint? {
        val endpointType = AudioDeviceEndpointUtils.endpointStringToType(name)
        val endpoint = when (endpointType) {
            AudioDeviceEndpoint.TYPE_SPEAKER, AudioDeviceEndpoint.TYPE_EARPIECE, AudioDeviceEndpoint.TYPE_WIRED_HEADSET-> mEndpointMaps.nonBluetoothEndpoints[endpointType]
            else -> mEndpointMaps.bluetoothEndpoints[name]
        }
        return endpoint
    }

    fun setSpeakerphoneOn(enable: Boolean, appRTCBluetoothManager: AppRTCBluetoothManager) {
        if (enable) {
            switchDeviceEndpointType(AudioDeviceEndpoint.TYPE_SPEAKER, appRTCBluetoothManager)
        } else {
//            mAudioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            if (Build.VERSION.SDK_INT >= 31) {
                AudioManagerUtil.AudioManager31PlusImpl.setSpeakerphoneOn(false, mAudioManager, mEndpointMaps.nonBluetoothEndpoints[AudioDeviceEndpoint.TYPE_SPEAKER])
            } else {
                AudioManagerUtil.AudioManager23PlusImpl.setSpeakerphoneOn(false, mAudioManager)
            }
        }
    }

    fun switchDeviceEndpointType(@EndpointType deviceType: Int, appRTCBluetoothManager: AppRTCBluetoothManager): AudioDeviceEndpoint? {
        return AudioManagerUtil.switchDeviceEndpointType(deviceType, mEndpointMaps, mAudioManager, appRTCBluetoothManager)
    }

    fun switchDeviceFromDeviceName(deviceName: String, appRTCBluetoothManager: AppRTCBluetoothManager): AudioDeviceEndpoint? {
        Log.d(TAG, "switchDeviceFromDeviceName: deviceName = $deviceName")
        Log.d(TAG, "switchDeviceFromDeviceName: mEndpointMaps.bluetoothEndpoints = ${mEndpointMaps.bluetoothEndpoints}")
        val btDevice = mEndpointMaps.bluetoothEndpoints[deviceName]
        if (btDevice != null) {
            if (Build.VERSION.SDK_INT >= 31) {
//                mAudioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                mAudioManager.setCommunicationDevice(btDevice.deviceInfo)
                appRTCBluetoothManager.updateDevice()
                return btDevice
            } else {
                return switchDeviceEndpointType(AudioDeviceEndpoint.TYPE_BLUETOOTH, appRTCBluetoothManager)
            }
        } else {
            val endpointType = AudioDeviceEndpointUtils.endpointStringToType(deviceName)
            return switchDeviceEndpointType(endpointType, appRTCBluetoothManager)
        }
    }

    fun start() {
        mAudioManager.registerAudioDeviceCallback(this, null)
    }

    fun stop() {
        mAudioManager.unregisterAudioDeviceCallback(this)
        if (Build.VERSION.SDK_INT >= 31) {
            mAudioManager.clearCommunicationDevice()
        } else {
            AudioManagerUtil.AudioManager23PlusImpl.setSpeakerphoneOn(false, mAudioManager)
        }
    }

    fun hasWiredHeadset(): Boolean {
        return mEndpointMaps.nonBluetoothEndpoints.containsKey(AudioDeviceEndpoint.TYPE_WIRED_HEADSET)
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
            updateEvent()
        }
    }

    private fun endpointsRemovedUpdate(removedCallEndpoints: List<AudioDeviceEndpoint>) {
        // STOP tracking an endpoint
        var removedDevicesCount = 0
        for (maybeRemovedDevice in removedCallEndpoints) {
            removedDevicesCount += maybeRemoveCallEndpoint(maybeRemovedDevice)
        }
        if (removedDevicesCount > 0) {
            updateEvent()
        }
    }

    fun getCurrentDeviceEndpoints(appRTCBluetoothManager: AppRTCBluetoothManager): List<AudioDeviceEndpoint> {
        if (Build.VERSION.SDK_INT >= 31) {
            return (mEndpointMaps.bluetoothEndpoints.values + mEndpointMaps.nonBluetoothEndpoints.values).sorted()
        } else {
            val btEndpoint = mEndpointMaps.bluetoothEndpoints[appRTCBluetoothManager.getDeviceName()]
            if (btEndpoint != null) {
                val list = mutableListOf(btEndpoint)
                list.addAll(mEndpointMaps.nonBluetoothEndpoints.values)
                return list.sorted()
            } else {
                return mEndpointMaps.nonBluetoothEndpoints.values.sorted()
            }

        }
    }

    private fun updateEvent() {
        mOnAudioDeviceChangedListener.onAudioDevicesChanged()
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
                Log.d(TAG, "maybeRemoveCallEndpoint: non-bluetooth endpoint removed: " + endpoint.name)
                return 1
            }
        }
        return 0
    }

    fun muteAudioOutput() {
        mAudioManager.adjustStreamVolume(
            AudioManager.STREAM_VOICE_CALL,
            AudioManager.ADJUST_MUTE,
            AudioManager.FLAG_REMOVE_SOUND_AND_VIBRATE // Optional: prevents sound/vibration on mute
        );
    }

    fun unmuteAudioOutput() {
        mAudioManager.adjustStreamVolume(
            AudioManager.STREAM_VOICE_CALL,
            AudioManager.ADJUST_UNMUTE,
            AudioManager.FLAG_SHOW_UI
        );
    }

    companion object {
        private val TAG: String = InCallManagerModule.TAG + ":" + AudioDeviceManager::class.java.simpleName.toString()
    }
}
