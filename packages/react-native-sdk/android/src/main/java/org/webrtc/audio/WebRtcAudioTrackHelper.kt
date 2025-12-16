package org.webrtc.audio

import android.media.AudioAttributes

object WebRtcAudioTrackHelper {
    fun setAudioOutputAttributes(
        adm: JavaAudioDeviceModule,
        audioAttributes: AudioAttributes,
    ) {
        adm.audioOutput.audioAttributes = audioAttributes
    }
}
