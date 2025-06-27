/*
 * Copyright 2023 The Android Open Source Project
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
import android.util.Log
import com.streamvideo.reactnative.model.AudioDeviceEndpoint
import com.streamvideo.reactnative.model.AudioDeviceEndpoint.Companion.EndpointType

internal class AudioDeviceEndpointUtils {

    companion object {
        const val BLUETOOTH_DEVICE_DEFAULT_NAME = "Bluetooth Device"
        const val EARPIECE = "EARPIECE"
        const val SPEAKER = "SPEAKER"
        const val WIRED_HEADSET = "WIRED_HEADSET"
        const val UNKNOWN = "UNKNOWN"

        private val TAG: String = AudioDeviceEndpointUtils::class.java.simpleName.toString()

        /** Gets the endpoints from AudioDeviceInfos.
         * IMPORTANT: eliminates Earpiece if Headset is found
         * */
        fun getEndpointsFromAudioDeviceInfo(
            adiArr: List<AudioDeviceInfo>?,
        ): List<AudioDeviceEndpoint> {
            if (adiArr == null) {
                return listOf()
            }
            val endpoints: MutableList<AudioDeviceEndpoint> = mutableListOf()
            var foundWiredHeadset = false
            val omittedDevices = StringBuilder("omitting devices =[")
            adiArr.toList().forEach { audioDeviceInfo ->
                val endpoint = getEndpointFromAudioDeviceInfo(audioDeviceInfo)
                if (endpoint.type != AudioDeviceEndpoint.TYPE_UNKNOWN) {
                    if (endpoint.type == AudioDeviceEndpoint.TYPE_WIRED_HEADSET) {
                        foundWiredHeadset = true
                    }
                    endpoints.add(endpoint)
                } else {
                    omittedDevices.append(
                        "(type=[${audioDeviceInfo.type}]," +
                            " name=[${audioDeviceInfo.productName}]),"
                    )
                }
            }
            omittedDevices.append("]")
            Log.i(TAG, omittedDevices.toString())
            if (foundWiredHeadset) {
                endpoints.removeIf { it.type == AudioDeviceEndpoint.TYPE_EARPIECE }
            }
            // Sort by endpoint type.  The first element has the highest priority!
            endpoints.sort()
            return endpoints
        }


        private fun getEndpointFromAudioDeviceInfo(
            adi: AudioDeviceInfo,
        ): AudioDeviceEndpoint {
            val endpointDeviceName = remapAudioDeviceNameToEndpointDeviceName(adi)
            val endpointType = remapAudioDeviceTypeToCallEndpointType(adi.type)
            val newEndpoint =
                AudioDeviceEndpoint(
                    endpointDeviceName,
                    endpointType,
                    adi,
                )
            return newEndpoint
        }

        internal fun remapAudioDeviceNameToEndpointDeviceName(
            audioDeviceInfo: AudioDeviceInfo,
        ): String {
            return when (audioDeviceInfo.type) {
                AudioDeviceInfo.TYPE_BUILTIN_EARPIECE ->
                    EARPIECE
                AudioDeviceInfo.TYPE_BUILTIN_SPEAKER ->
                    SPEAKER
                AudioDeviceInfo.TYPE_WIRED_HEADSET,
                AudioDeviceInfo.TYPE_WIRED_HEADPHONES,
                AudioDeviceInfo.TYPE_USB_DEVICE,
                AudioDeviceInfo.TYPE_USB_ACCESSORY,
                AudioDeviceInfo.TYPE_USB_HEADSET ->
                    WIRED_HEADSET
                else -> audioDeviceInfo.productName.toString()
            }
        }

        internal fun remapAudioDeviceTypeToCallEndpointType(
            audioDeviceInfoType: Int
        ): (@EndpointType Int) {
            return when (audioDeviceInfoType) {
                AudioDeviceInfo.TYPE_BUILTIN_EARPIECE -> AudioDeviceEndpoint.TYPE_EARPIECE
                AudioDeviceInfo.TYPE_BUILTIN_SPEAKER -> AudioDeviceEndpoint.TYPE_SPEAKER
                // Wired Headset Devices
                AudioDeviceInfo.TYPE_WIRED_HEADSET,
                AudioDeviceInfo.TYPE_WIRED_HEADPHONES,
                AudioDeviceInfo.TYPE_USB_DEVICE,
                AudioDeviceInfo.TYPE_USB_ACCESSORY,
                AudioDeviceInfo.TYPE_USB_HEADSET -> AudioDeviceEndpoint.TYPE_WIRED_HEADSET
                // Bluetooth Devices
                AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
                AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,
                AudioDeviceInfo.TYPE_HEARING_AID,
                AudioDeviceInfo.TYPE_BLE_HEADSET,
                AudioDeviceInfo.TYPE_BLE_SPEAKER,
                AudioDeviceInfo.TYPE_BLE_BROADCAST -> AudioDeviceEndpoint.TYPE_BLUETOOTH
                // Everything else is defaulted to TYPE_UNKNOWN
                else -> AudioDeviceEndpoint.TYPE_UNKNOWN
            }
        }

        fun getSpeakerEndpoint(endpoints: List<AudioDeviceEndpoint>): AudioDeviceEndpoint? {
            for (e in endpoints) {
                if (e.type == AudioDeviceEndpoint.TYPE_SPEAKER) {
                    return e
                }
            }
            return null
        }

        fun isBluetoothAvailable(endpoints: List<AudioDeviceEndpoint>): Boolean {
            for (e in endpoints) {
                if (e.type == AudioDeviceEndpoint.TYPE_BLUETOOTH) {
                    return true
                }
            }
            return false
        }

        fun isEarpieceEndpoint(endpoint: AudioDeviceEndpoint?): Boolean {
            if (endpoint == null) {
                return false
            }
            return endpoint.type == AudioDeviceEndpoint.TYPE_EARPIECE
        }

        fun isSpeakerEndpoint(endpoint: AudioDeviceEndpoint?): Boolean {
            if (endpoint == null) {
                return false
            }
            return endpoint.type == AudioDeviceEndpoint.TYPE_SPEAKER
        }

        fun isWiredHeadsetOrBtEndpoint(endpoint: AudioDeviceEndpoint?): Boolean {
            if (endpoint == null) {
                return false
            }
            return endpoint.type == AudioDeviceEndpoint.TYPE_BLUETOOTH ||
                endpoint.type == AudioDeviceEndpoint.TYPE_WIRED_HEADSET
        }

        private fun isBluetoothType(type: Int): Boolean {
            return type == AudioDeviceEndpoint.TYPE_BLUETOOTH
        }

        fun endpointTypeToString(@EndpointType endpointType: Int): String {
            return when (endpointType) {
                AudioDeviceEndpoint.TYPE_EARPIECE -> EARPIECE
                AudioDeviceEndpoint.TYPE_BLUETOOTH -> BLUETOOTH_DEVICE_DEFAULT_NAME
                AudioDeviceEndpoint.TYPE_WIRED_HEADSET -> WIRED_HEADSET
                AudioDeviceEndpoint.TYPE_SPEAKER -> SPEAKER
                AudioDeviceEndpoint.TYPE_UNKNOWN -> UNKNOWN
                else -> "UNKNOWN ($endpointType)"
            }
        }

        fun endpointStringToType(endpointName: String): Int {
            return when (endpointName) {
                EARPIECE -> AudioDeviceEndpoint.TYPE_EARPIECE
                BLUETOOTH_DEVICE_DEFAULT_NAME -> AudioDeviceEndpoint.TYPE_BLUETOOTH
                "BLUETOOTH" -> AudioDeviceEndpoint.TYPE_BLUETOOTH
                WIRED_HEADSET -> AudioDeviceEndpoint.TYPE_WIRED_HEADSET
                SPEAKER -> AudioDeviceEndpoint.TYPE_SPEAKER
                else -> AudioDeviceEndpoint.TYPE_UNKNOWN
            }
        }
    }
}
