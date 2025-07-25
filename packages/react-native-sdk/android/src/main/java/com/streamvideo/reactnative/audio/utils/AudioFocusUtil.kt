package com.streamvideo.reactnative.audio.utils

import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build

enum class StreamAudioMode {
    Listener, Communicator
}

class AudioFocusUtil(
    private val audioManager: AudioManager,
    private val audioFocusChangeListener: AudioManager.OnAudioFocusChangeListener,
) {

    private lateinit var request: AudioFocusRequest

    /*
    class MediaAudioType : AudioType(
        AudioManager.MODE_NORMAL,
        AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build(),
        AudioManager.STREAM_MUSIC
    )

    /**
     * An audio type for communications (i.e. participating a call or otherwise
     * publishing local microphone).
     *
     * Audio routing can be manually controlled.
     */
    class CommunicationAudioType : AudioType(
        AudioManager.MODE_IN_COMMUNICATION,
        AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build(),
        AudioManager.STREAM_VOICE_CALL
    )
     */

    fun requestFocus(mode: StreamAudioMode) {
        /*
                 Activity currentActivity = getCurrentActivity();
        if (currentActivity != null) {
            if (mode == DEFAULT) {
                currentActivity.setVolumeControlStream(AudioManager.USE_DEFAULT_STREAM_TYPE);
            } else {
                currentActivity.setVolumeControlStream(AudioManager.STREAM_VOICE_CALL);
            }
        }
         */
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val playbackAttributes = AudioAttributes.Builder()
                .setUsage(if (mode == StreamAudioMode.Communicator) AudioAttributes.USAGE_VOICE_COMMUNICATION else AudioAttributes.USAGE_MEDIA)
                .setContentType(if (mode == StreamAudioMode.Communicator) AudioAttributes.CONTENT_TYPE_SPEECH else AudioAttributes.CONTENT_TYPE_MUSIC)
                .build()
            request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                .setAudioAttributes(playbackAttributes).setAcceptsDelayedFocusGain(true)
                .setOnAudioFocusChangeListener(audioFocusChangeListener).build()
            audioManager.requestAudioFocus(request)
        } else {
            audioManager.requestAudioFocus(
                audioFocusChangeListener,
                if (mode == StreamAudioMode.Communicator) AudioManager.STREAM_VOICE_CALL else AudioManager.STREAM_MUSIC,
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
