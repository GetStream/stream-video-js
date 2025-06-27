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
import com.streamvideo.reactnative.audio.utils.LazyMutable
import android.util.Log
import androidx.annotation.DoNotInline
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.ReactApplicationContext
import com.streamvideo.reactnative.audio.utils.AudioManagerUtil
import com.streamvideo.reactnative.callmanager.AppRTCBluetoothManager

interface OnAudioDeviceChangedListener {
    fun onAudioDevicesChanged(): Unit
}


internal class AudioDeviceManager(
    private val mReactContext: ReactApplicationContext,
    private val mOnAudioDeviceChangedListener: OnAudioDeviceChangedListener
) : AutoCloseable, AudioDeviceCallback() {

    private var mCurrentDeviceEndpoints: MutableList<AudioDeviceEndpoint> by LazyMutable {
        val initialAudioDevices = getAvailableAudioDevices(mAudioManager)
        val initialEndpoints =
            AudioDeviceEndpointUtils.getEndpointsFromAudioDeviceInfo(initialAudioDevices)

        for (device in initialEndpoints) {
            if (device.isBluetoothType()) {
                mBluetoothEndpoints[device.name] = device
            } else {
                mNonBluetoothEndpoints[device.type] = device
            }
        }

        (mBluetoothEndpoints.values + mNonBluetoothEndpoints.values).toMutableList()
    }

    // earpiece, speaker, unknown, wired_headset
    private val mNonBluetoothEndpoints: HashMap<@EndpointType Int, AudioDeviceEndpoint> = HashMap()
    // all bt endpoints
    private val mBluetoothEndpoints: HashMap<String, AudioDeviceEndpoint> = HashMap()

    private val mAudioManager = mReactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    fun setSpeakerphoneOn(enable: Boolean, appRTCBluetoothManager: AppRTCBluetoothManager) {
        if (enable) {
            switchDeviceEndpointType(AudioDeviceEndpoint.TYPE_SPEAKER, appRTCBluetoothManager)
        } else {
            mAudioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            if (Build.VERSION.SDK_INT >= 31) {
                AudioManager31PlusImpl.setSpeakerphoneOn(false, mAudioManager, mCurrentDeviceEndpoints)
            } else {
                AudioManager23PlusImpl.setSpeakerphoneOn(false, mAudioManager)
            }
        }
    }

    fun switchDeviceEndpointType(@EndpointType deviceType: Int, appRTCBluetoothManager: AppRTCBluetoothManager) {
        mAudioManager.mode = AudioManager.MODE_IN_COMMUNICATION
        when (deviceType) {
            AudioDeviceEndpoint.TYPE_BLUETOOTH -> {
                appRTCBluetoothManager.startScoAudio()
                if (Build.VERSION.SDK_INT < 31) {
                    AudioManager23PlusImpl.setSpeakerphoneOn(false, mAudioManager)
                }
            }
            AudioDeviceEndpoint.TYPE_WIRED_HEADSET, AudioDeviceEndpoint.TYPE_EARPIECE -> {
                // NOTE: If wired headset is present, earpiece is always omitted even if chosen
                appRTCBluetoothManager.stopScoAudio()
                if (Build.VERSION.SDK_INT >= 31) {
                    mCurrentDeviceEndpoints.firstOrNull {
                        it.isWiredHeadsetType() || it.isEarpieceType()
                    }?.let {
                        mAudioManager.setCommunicationDevice(it.deviceInfo)
                    }
                } else {
                    AudioManager23PlusImpl.setSpeakerphoneOn(false, mAudioManager)
                }
            }
            AudioDeviceEndpoint.TYPE_SPEAKER -> {
                appRTCBluetoothManager.stopScoAudio()
                if (Build.VERSION.SDK_INT >= 31) {
                    AudioManager31PlusImpl.setSpeakerphoneOn(true, mAudioManager, mCurrentDeviceEndpoints)
                } else {
                    AudioManager23PlusImpl.setSpeakerphoneOn(true, mAudioManager)
                }
            }
            AudioDeviceEndpoint.TYPE_UNKNOWN -> {
                Log.e(TAG, "switchDeviceEndpointType(): unknown device type requested")
            }

        }
    }

    fun switchDeviceFromDeviceName(deviceName: String, appRTCBluetoothManager: AppRTCBluetoothManager): @EndpointType Int {
        if (mBluetoothEndpoints.containsKey(deviceName)) {
            switchDeviceEndpointType(AudioDeviceEndpoint.TYPE_BLUETOOTH, appRTCBluetoothManager)
            return AudioDeviceEndpoint.TYPE_BLUETOOTH
        } else {
            val endpointType = AudioDeviceEndpointUtils.endpointStringToType(deviceName)
            switchDeviceEndpointType(endpointType, appRTCBluetoothManager)
            return endpointType
        }
    }

    fun onCallManagerStop() {
        if (Build.VERSION.SDK_INT >= 31) {
            mAudioManager.clearCommunicationDevice()
        } else {
            AudioManager23PlusImpl.setSpeakerphoneOn(false, mAudioManager)
        }
    }

    fun hasWiredHeadset(): Boolean {
        return mNonBluetoothEndpoints.containsKey(AudioDeviceEndpoint.TYPE_WIRED_HEADSET)
    }

    override fun close() {
        mAudioManager.unregisterAudioDeviceCallback(this)
    }

    @RequiresApi(31)
    private object AudioManager31PlusImpl {
        @JvmStatic
        @DoNotInline
        fun setSpeakerphoneOn(enable: Boolean, audioManager: AudioManager, availableDevices: List<AudioDeviceEndpoint>){
            if (AudioManagerUtil.isSpeakerphoneOn(audioManager) != enable) {
                if (enable) {
                    availableDevices.firstOrNull {
                        it.isSpeakerType()
                    }?.let {
                        audioManager.setCommunicationDevice(it.deviceInfo)
                    }
                } else {
                    audioManager.clearCommunicationDevice()
                }
            }
        }
    }

    @Suppress("DEPRECATION")
    private object AudioManager23PlusImpl {
        @JvmStatic
        @DoNotInline
        fun setSpeakerphoneOn(enable: Boolean, audioManager: AudioManager) {
            audioManager.isSpeakerphoneOn = enable
        }
    }

    override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>?) {
        if (addedDevices != null) {
            endpointsAddedUpdate(AudioDeviceEndpointUtils.getEndpointsFromAudioDeviceInfo(addedDevices.toList()))
        }
    }

    override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) {
        if (removedDevices != null) {
            endpointsRemovedUpdate(AudioDeviceEndpointUtils.getEndpointsFromAudioDeviceInfo(removedDevices.toList()))
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
        } else {
            Log.d(TAG, "endpointsAddedUpdate: no new added endpoints, not updating React Native!")
        }
    }

    private fun endpointsRemovedUpdate(removedCallEndpoints: List<AudioDeviceEndpoint>) {
        // STOP tracking an endpoint
        var removedDevicesCount = 0
        for (maybeRemovedDevice in removedCallEndpoints) {
            removedDevicesCount += maybeRemoveCallEndpoint(maybeRemovedDevice)
        }
        if (removedDevicesCount > 0) {
            mCurrentDeviceEndpoints =
                (mBluetoothEndpoints.values + mNonBluetoothEndpoints.values).toMutableList()
            updateEvent()
        } else {
            Log.d(TAG, "endpointsRemovedUpdate: no removed endpoints, not updating React Native!")
        }
    }

    fun getCurrentDeviceEndpoints(): List<AudioDeviceEndpoint> {
        return mCurrentDeviceEndpoints.sorted()
    }

    private fun updateEvent() {
        mOnAudioDeviceChangedListener.onAudioDevicesChanged()
    }

    private fun maybeAddCallEndpoint(endpoint: AudioDeviceEndpoint): Int {
        if (endpoint.isBluetoothType()) {
            if (!mBluetoothEndpoints.containsKey(endpoint.name)) {
                mBluetoothEndpoints[endpoint.name] = endpoint
                mCurrentDeviceEndpoints.add(endpoint)
                return 1
            }
        } else {
            if (!mNonBluetoothEndpoints.containsKey(endpoint.type)) {
                mNonBluetoothEndpoints[endpoint.type] = endpoint
                mCurrentDeviceEndpoints.add(endpoint)
                return 1
            }
        }
        return 0
    }

    private fun maybeRemoveCallEndpoint(endpoint: AudioDeviceEndpoint): Int {
        // TODO:: determine if it is necessary to cleanup listeners here
        if (endpoint.isBluetoothType()) {
            if (mBluetoothEndpoints.containsKey(endpoint.name)) {
                mBluetoothEndpoints.remove(endpoint.name)
                return 1
            }
        } else {
            if (mNonBluetoothEndpoints.containsKey(endpoint.type)) {
                mNonBluetoothEndpoints.remove(endpoint.type)
                return 1
            }
        }
        return 0
    }

    companion object {
        private val TAG: String = AudioDeviceManager::class.java.simpleName.toString()
    }
}
