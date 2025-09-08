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

package com.streamvideo.reactnative.audio.utils

import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import android.util.Log
import androidx.annotation.DoNotInline
import androidx.annotation.RequiresApi
import com.streamvideo.reactnative.audio.BluetoothManager
import com.streamvideo.reactnative.audio.EndpointMaps
import com.streamvideo.reactnative.callmanager.StreamInCallManagerModule
import com.streamvideo.reactnative.model.AudioDeviceEndpoint
import com.streamvideo.reactnative.model.AudioDeviceEndpoint.Companion.EndpointType


internal class AudioManagerUtil {
    companion object {
        private val TAG: String = StreamInCallManagerModule.TAG + ":" + AudioManagerUtil::class.java.simpleName.toString()

        fun getAvailableAudioDevices(audioManager: AudioManager): List<AudioDeviceInfo> {
            return if (Build.VERSION.SDK_INT >= 31) {
                AudioManager31PlusImpl.getDevices(audioManager)
            } else {
                AudioManager23PlusImpl.getDevices(audioManager)
            }
        }

        fun isSpeakerphoneOn(audioManager: AudioManager): Boolean {
            return if (Build.VERSION.SDK_INT >= 31) {
                AudioManager31PlusImpl.isSpeakerphoneOn(audioManager)
            } else {
                AudioManager23PlusImpl.isSpeakerphoneOn(audioManager)
            }
        }

        /**
         * Switch the device endpoint type.
         * @return true if the device endpoint type is successfully switched.
         */
        fun switchDeviceEndpointType(@EndpointType deviceType: Int,
                                     endpointMaps: EndpointMaps,
                                     audioManager: AudioManager,
                                     bluetoothManager: BluetoothManager): AudioDeviceEndpoint? {
            return if (Build.VERSION.SDK_INT >= 31) {
                AudioManager31PlusImpl.switchDeviceEndpointType(deviceType, endpointMaps, audioManager, bluetoothManager)
            } else {
                AudioManager23PlusImpl.switchDeviceEndpointType(deviceType, endpointMaps, audioManager, bluetoothManager)
            }
        }
    }

    @RequiresApi(31)
    object AudioManager31PlusImpl {
        @JvmStatic
        @DoNotInline
        fun getDevices(audioManager: AudioManager): List<AudioDeviceInfo> {
            return audioManager.availableCommunicationDevices
        }

        @JvmStatic
        @DoNotInline
        fun isSpeakerphoneOn(audioManager: AudioManager): Boolean {
            val endpoint = AudioDeviceEndpointUtils.remapAudioDeviceTypeToCallEndpointType(audioManager.communicationDevice?.type ?: AudioDeviceInfo.TYPE_UNKNOWN)
            return endpoint == AudioDeviceEndpoint.TYPE_SPEAKER
        }

        @JvmStatic
        @DoNotInline
        fun switchDeviceEndpointType(@EndpointType deviceType: Int,
                                     endpointMaps: EndpointMaps,
                                     audioManager: AudioManager,
                                     bluetoothManager: BluetoothManager): AudioDeviceEndpoint? {
            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            when (deviceType) {
                AudioDeviceEndpoint.TYPE_BLUETOOTH -> {
                    val didSwitch = bluetoothManager.startScoAudio()
                    if (didSwitch) {
                        return endpointMaps.bluetoothEndpoints[bluetoothManager.getDeviceName()]
                    }
                    return null
                }
                AudioDeviceEndpoint.TYPE_WIRED_HEADSET, AudioDeviceEndpoint.TYPE_EARPIECE -> {
                    endpointMaps.nonBluetoothEndpoints.values.firstOrNull {
                        it.type == deviceType
                    }?.let {
                        audioManager.setCommunicationDevice(it.deviceInfo)
                        bluetoothManager.updateDevice()
                        return endpointMaps.nonBluetoothEndpoints[deviceType]
                    }
                    return null
                }
                AudioDeviceEndpoint.TYPE_SPEAKER -> {
                    val speakerDevice = endpointMaps.nonBluetoothEndpoints[AudioDeviceEndpoint.TYPE_SPEAKER]
                    speakerDevice?.let {
                        audioManager.setCommunicationDevice(it.deviceInfo)
                        bluetoothManager.updateDevice()
                        return speakerDevice
                    }
                    return null
                }
                else -> {
                    Log.e(TAG, "switchDeviceEndpointType(): unknown device type requested")
                    return null
                }
            }
        }
    }

    @Suppress("DEPRECATION")
    object AudioManager23PlusImpl {
        @JvmStatic
        @DoNotInline
        fun getDevices(audioManager: AudioManager): List<AudioDeviceInfo> {
            return audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS).toList()
        }

        @JvmStatic
        @DoNotInline
        fun isSpeakerphoneOn(audioManager: AudioManager): Boolean {
            return audioManager.isSpeakerphoneOn
        }

        @JvmStatic
        @DoNotInline
        fun switchDeviceEndpointType(@EndpointType deviceType: Int,
                                     endpointMaps: EndpointMaps,
                                     audioManager: AudioManager,
                                     bluetoothManager: BluetoothManager): AudioDeviceEndpoint? {
            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            when (deviceType) {
                AudioDeviceEndpoint.TYPE_BLUETOOTH -> {
                    audioManager.setSpeakerphoneOn(false)
                    val didSwitch = bluetoothManager.startScoAudio()
                    if (didSwitch) {
                        // TODO: SCO connection may fail after timeout, how to catch that on older platforms?
                        return endpointMaps.bluetoothEndpoints[bluetoothManager.getDeviceName()]
                    }
                    return null
                }
                AudioDeviceEndpoint.TYPE_WIRED_HEADSET, AudioDeviceEndpoint.TYPE_EARPIECE -> {
                    // NOTE: If wired headset is present,
                    // earpiece is always omitted even if chosen
                    bluetoothManager.stopScoAudio()
                    audioManager.setSpeakerphoneOn(false)
                    return endpointMaps.nonBluetoothEndpoints[deviceType]
                }
                AudioDeviceEndpoint.TYPE_SPEAKER -> {
                    bluetoothManager.stopScoAudio()
                    audioManager.setSpeakerphoneOn(true)
                    return endpointMaps.nonBluetoothEndpoints[AudioDeviceEndpoint.TYPE_SPEAKER]
                }
                else -> {
                    Log.e(TAG, "switchDeviceEndpointType(): unknown device type requested")
                    return null
                }
            }
        }
    }
}
