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
import androidx.annotation.DoNotInline
import androidx.annotation.RequiresApi
import com.streamvideo.reactnative.model.AudioDeviceEndpoint


internal class AudioManagerUtil {
    companion object {
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
    }
}
