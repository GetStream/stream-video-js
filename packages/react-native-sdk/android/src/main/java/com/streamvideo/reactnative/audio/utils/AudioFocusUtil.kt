package com.streamvideo.reactnative.audio.utils

import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import com.facebook.react.bridge.ReactContext
import com.oney.WebRTCModule.WebRTCModule
import org.webrtc.audio.JavaAudioDeviceModule
import org.webrtc.audio.WebRtcAudioTrackHelper

enum class CallAudioRole {
                         /* high quality audio output is prioritised */
    Listener,
    /* low latency audio output is prioritised */
    Communicator
}

class AudioFocusUtil(
    private val audioManager: AudioManager,
    private val audioFocusChangeListener: AudioManager.OnAudioFocusChangeListener,
) {

    private lateinit var request: AudioFocusRequest

    fun requestFocus(mode: CallAudioRole, reactContext: ReactContext) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val playbackAttributes = AudioAttributes.Builder()
                .setUsage(if (mode == CallAudioRole.Communicator) AudioAttributes.USAGE_VOICE_COMMUNICATION else AudioAttributes.USAGE_MEDIA)
                .setContentType(if (mode == CallAudioRole.Communicator) AudioAttributes.CONTENT_TYPE_SPEECH else AudioAttributes.CONTENT_TYPE_MUSIC)
                .build()
            val webRTCModule = reactContext.getNativeModule(WebRTCModule::class.java)!!
            val adm = webRTCModule.audioDeviceModule as JavaAudioDeviceModule
            WebRtcAudioTrackHelper.setAudioOutputAttributes(adm, playbackAttributes)
            request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                .setAudioAttributes(playbackAttributes).setAcceptsDelayedFocusGain(true)
                .setOnAudioFocusChangeListener(audioFocusChangeListener).build()
            audioManager.requestAudioFocus(request)
        } else {
            audioManager.requestAudioFocus(
                audioFocusChangeListener,
                if (mode == CallAudioRole.Communicator) AudioManager.STREAM_VOICE_CALL else AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT,
            )
        }
    }

    fun abandonFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioManager.abandonAudioFocusRequest(request)
        } else {
            audioManager.abandonAudioFocus(audioFocusChangeListener)
        }
    }
}
