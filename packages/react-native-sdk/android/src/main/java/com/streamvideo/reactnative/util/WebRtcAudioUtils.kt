/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree. An additional intellectual property rights grant can be found
 *  in the file PATENTS.  All contributing project authors may
 *  be found in the AUTHORS file in the root of the source tree.
 */
package com.streamvideo.reactnative.util

import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioDeviceInfo
import android.media.AudioFormat
import android.media.AudioManager
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.ReactContext

/** Utilities for implementations of `AudioDeviceModule`, mostly for logging.  */
object WebRtcAudioUtils {
    /** Helper method for building a string of thread information.  */
    fun threadInfo(): String {
            val current = Thread.currentThread()
            return "@[name=" + current.name + ", id=" + current.id + "]"
    }

    /** Returns true if we're running on emulator.  */
    fun runningOnEmulator(): Boolean {
        // Hardware type of qemu1 is goldfish and qemu2 is ranchu.
        return Build.HARDWARE == "goldfish" || Build.HARDWARE == "ranchu"
    }

    /** Information about the current build, taken from system properties.  */
    private fun logDeviceInfo(tag: String) {
        Log.d(
            tag,
            (("Android SDK: " + Build.VERSION.SDK_INT)
                    + (", Release: " + Build.VERSION.RELEASE)
                    + (", Brand: " + Build.BRAND)
                    + (", Device: " + Build.DEVICE)
                    + (", Id: " + Build.ID)
                    + (", Hardware: " + Build.HARDWARE)
                    + (", Manufacturer: " + Build.MANUFACTURER)
                    + (", Model: " + Build.MODEL)
                    + (", Product: " + Build.PRODUCT))
        )
    }

    /**
     * Logs information about the current audio state. The idea is to call this method when errors are
     * detected to log under what conditions the error occurred. Hopefully it will provide clues to
     * what might be the root cause.
     */
    fun logAudioState(tag: String, reactContext: ReactContext) {
        reactContext.currentActivity?.let {
            Log.d(tag, "volumeControlStream: " + streamTypeToString(it.volumeControlStream))
        }
        val audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        logDeviceInfo(tag)
        logAudioStateBasic(tag, reactContext, audioManager)
        logAudioStateVolume(tag, audioManager)
        logAudioDeviceInfo(tag, audioManager)
    }

    /** Converts AudioDeviceInfo types to local string representation.  */
    private fun deviceTypeToString(type: Int): String {
        return when (type) {
            AudioDeviceInfo.TYPE_AUX_LINE -> "TYPE_AUX_LINE"
            AudioDeviceInfo.TYPE_BLE_BROADCAST -> "TYPE_BLE_BROADCAST"
            AudioDeviceInfo.TYPE_BLE_HEADSET -> "TYPE_BLE_HEADSET"
            AudioDeviceInfo.TYPE_BLE_SPEAKER -> "TYPE_BLE_SPEAKER"
            AudioDeviceInfo.TYPE_BLUETOOTH_A2DP -> "TYPE_BLUETOOTH_A2DP"
            AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> "TYPE_BLUETOOTH_SCO"
            AudioDeviceInfo.TYPE_BUILTIN_EARPIECE -> "TYPE_BUILTIN_EARPIECE"
            AudioDeviceInfo.TYPE_BUILTIN_MIC -> "TYPE_BUILTIN_MIC"
            AudioDeviceInfo.TYPE_BUILTIN_SPEAKER -> "TYPE_BUILTIN_SPEAKER"
            AudioDeviceInfo.TYPE_BUILTIN_SPEAKER_SAFE -> "TYPE_BUILTIN_SPEAKER_SAFE"
            AudioDeviceInfo.TYPE_BUS -> "TYPE_BUS"
            AudioDeviceInfo.TYPE_DOCK -> "TYPE_DOCK"
            AudioDeviceInfo.TYPE_DOCK_ANALOG -> "TYPE_DOCK_ANALOG"
            AudioDeviceInfo.TYPE_FM -> "TYPE_FM"
            AudioDeviceInfo.TYPE_FM_TUNER -> "TYPE_FM_TUNER"
            AudioDeviceInfo.TYPE_HDMI -> "TYPE_HDMI"
            AudioDeviceInfo.TYPE_HDMI_ARC -> "TYPE_HDMI_ARC"
            AudioDeviceInfo.TYPE_HDMI_EARC -> "TYPE_HDMI_EARC"
            AudioDeviceInfo.TYPE_HEARING_AID -> "TYPE_HEARING_AID"
            AudioDeviceInfo.TYPE_IP -> "TYPE_IP"
            AudioDeviceInfo.TYPE_LINE_ANALOG -> "TYPE_LINE_ANALOG"
            AudioDeviceInfo.TYPE_LINE_DIGITAL -> "TYPE_LINE_DIGITAL"
            AudioDeviceInfo.TYPE_REMOTE_SUBMIX -> "TYPE_REMOTE_SUBMIX"
            AudioDeviceInfo.TYPE_TELEPHONY -> "TYPE_TELEPHONY"
            AudioDeviceInfo.TYPE_TV_TUNER -> "TYPE_TV_TUNER"
            AudioDeviceInfo.TYPE_UNKNOWN -> "TYPE_UNKNOWN"
            AudioDeviceInfo.TYPE_USB_ACCESSORY -> "TYPE_USB_ACCESSORY"
            AudioDeviceInfo.TYPE_USB_DEVICE -> "TYPE_USB_DEVICE"
            AudioDeviceInfo.TYPE_USB_HEADSET -> "TYPE_USB_HEADSET"
            AudioDeviceInfo.TYPE_WIRED_HEADPHONES -> "TYPE_WIRED_HEADPHONES"
            AudioDeviceInfo.TYPE_WIRED_HEADSET -> "TYPE_WIRED_HEADSET"
            else -> "TYPE_UNKNOWN($type)"
        }
    }

    fun audioSourceToString(source: Int): String {
        return when (source) {
            MediaRecorder.AudioSource.DEFAULT -> "DEFAULT"
            MediaRecorder.AudioSource.MIC -> "MIC"
            MediaRecorder.AudioSource.VOICE_UPLINK -> "VOICE_UPLINK"
            MediaRecorder.AudioSource.VOICE_DOWNLINK -> "VOICE_DOWNLINK"
            MediaRecorder.AudioSource.VOICE_CALL -> "VOICE_CALL"
            MediaRecorder.AudioSource.CAMCORDER -> "CAMCORDER"
            MediaRecorder.AudioSource.VOICE_RECOGNITION -> "VOICE_RECOGNITION"
            MediaRecorder.AudioSource.VOICE_COMMUNICATION -> "VOICE_COMMUNICATION"
            MediaRecorder.AudioSource.UNPROCESSED -> "UNPROCESSED"
            MediaRecorder.AudioSource.VOICE_PERFORMANCE -> "VOICE_PERFORMANCE"
            else -> "INVALID"
        }
    }

    fun channelMaskToString(mask: Int): String {
        // For input or AudioRecord, the mask should be AudioFormat#CHANNEL_IN_MONO or
        // AudioFormat#CHANNEL_IN_STEREO. AudioFormat#CHANNEL_IN_MONO is guaranteed to work on all
        // devices.
        return when (mask) {
            AudioFormat.CHANNEL_IN_STEREO -> "IN_STEREO"
            AudioFormat.CHANNEL_IN_MONO -> "IN_MONO"
            else -> "INVALID"
        }
    }

    fun audioEncodingToString(enc: Int): String {
        return when (enc) {
            AudioFormat.ENCODING_INVALID -> "INVALID"
            AudioFormat.ENCODING_PCM_16BIT -> "PCM_16BIT"
            AudioFormat.ENCODING_PCM_8BIT -> "PCM_8BIT"
            AudioFormat.ENCODING_PCM_FLOAT -> "PCM_FLOAT"
            AudioFormat.ENCODING_AC3 -> "AC3"
            AudioFormat.ENCODING_E_AC3 -> "AC3"
            AudioFormat.ENCODING_DTS -> "DTS"
            AudioFormat.ENCODING_DTS_HD -> "DTS_HD"
            AudioFormat.ENCODING_MP3 -> "MP3"
            else -> "Invalid encoding: $enc"
        }
    }

    /** Reports basic audio statistics.  */
    private fun logAudioStateBasic(tag: String, context: Context, audioManager: AudioManager) {
        Log.d(
            tag,
            ("Audio State: "
                    + ("audio mode: " + modeToString(audioManager.mode))
                    + (", has mic: " + hasMicrophone(context))
                    + (", mic muted: " + audioManager.isMicrophoneMute)
                    + (", music active: " + audioManager.isMusicActive)
                    + (", speakerphone: " + audioManager.isSpeakerphoneOn)
                    + (", BT SCO: " + audioManager.isBluetoothScoOn))
        )
    }

    /** Adds volume information for all possible stream types.  */
    private fun  logAudioStateVolume(tag: String, audioManager: AudioManager) {
        val streams = intArrayOf(
            AudioManager.STREAM_VOICE_CALL,
            AudioManager.STREAM_MUSIC,
            AudioManager.STREAM_RING,
            AudioManager.STREAM_ALARM,
            AudioManager.STREAM_NOTIFICATION,
            AudioManager.STREAM_SYSTEM
        )
        Log.d(tag, "Audio State: ")
        // Some devices may not have volume controls and might use a fixed volume.
        val fixedVolume = audioManager.isVolumeFixed
        Log.d(tag, "  fixed volume=$fixedVolume")
        if (!fixedVolume) {
            for (stream in streams) {
                val info = StringBuilder()
                info.append("  " + streamTypeToString(stream) + ": ")
                info.append("volume=").append(audioManager.getStreamVolume(stream))
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    info.append(", min=").append(audioManager.getStreamMinVolume(stream))
                }
                info.append(", max=").append(audioManager.getStreamMaxVolume(stream))
                info.append(", muted=").append(audioManager.isStreamMute(stream))
                Log.d(tag, info.toString())
            }
        }
    }

    private fun logAudioDeviceInfo(tag: String, audioManager: AudioManager) {
        val inputDevices = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS)
        val outputDevices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
        val devices = inputDevices + outputDevices
        if (devices.isEmpty()) {
            return
        }
        Log.d(tag, "Audio Devices: ")
        for (device in devices) {
            val info = StringBuilder()
            info.append("  ").append(deviceTypeToString(device.type))
            info.append(if (device.isSource) "(in): " else "(out): ")
            // An empty array indicates that the device supports arbitrary channel counts.
            if (device.channelCounts.size > 0) {
                info.append("channels=").append(device.channelCounts.contentToString())
                info.append(", ")
            }
            if (device.encodings.size > 0) {
                // Examples: ENCODING_PCM_16BIT = 2, ENCODING_PCM_FLOAT = 4.
                info.append("encodings=").append(device.encodings.contentToString())
                info.append(", ")
            }
            if (device.sampleRates.size > 0) {
                info.append("sample rates=").append(device.sampleRates.contentToString())
                info.append(", ")
            }
            info.append("id=").append(device.id)
            Log.d(tag, info.toString())
        }
    }

    /** Converts media.AudioManager modes into local string representation.  */
    fun modeToString(mode: Int): String {
        return when (mode) {
            AudioManager.MODE_IN_CALL -> "MODE_IN_CALL"
            AudioManager.MODE_IN_COMMUNICATION -> "MODE_IN_COMMUNICATION"
            AudioManager.MODE_NORMAL -> "MODE_NORMAL"
            AudioManager.MODE_RINGTONE -> "MODE_RINGTONE"
            else -> "MODE_INVALID"
        }
    }

    private fun streamTypeToString(stream: Int): String {
        return when (stream) {
            AudioManager.STREAM_VOICE_CALL -> "STREAM_VOICE_CALL"
            AudioManager.STREAM_MUSIC -> "STREAM_MUSIC"
            AudioManager.STREAM_RING -> "STREAM_RING"
            AudioManager.STREAM_ALARM -> "STREAM_ALARM"
            AudioManager.STREAM_NOTIFICATION -> "STREAM_NOTIFICATION"
            AudioManager.STREAM_SYSTEM -> "STREAM_SYSTEM"
            else -> "STREAM_INVALID"
        }
    }

    /** Returns true if the device can record audio via a microphone.  */
    private fun hasMicrophone(context: Context): Boolean {
        return context.packageManager.hasSystemFeature(PackageManager.FEATURE_MICROPHONE)
    }

}
