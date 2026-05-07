package com.streamvideo.reactnative.recorder

import android.util.Log
import org.webrtc.audio.JavaAudioDeviceModule
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Render-side playback sink for [TracksRecorderManager]. Registered
 * via `WebRTCModuleOptions.addPlaybackSamplesObserver` for the
 * duration of a recording. Fires on the JADM audio thread, downstream
 * of any audio processing factory — works regardless of whether a
 * custom APM, noise cancellation, or the default is configured.
 *
 * `AudioSamples` carries 16-bit signed little-endian PCM in `data`.
 * Wrapped in a fresh direct ByteBuffer so the manager can write it
 * straight into a MediaCodec input slot without a second copy.
 */
internal class RecorderPlaybackSamplesSink(
    private val handler: (
        data: ByteBuffer,
        sampleRate: Int,
        channels: Int,
        frames: Int,
    ) -> Unit,
) : JavaAudioDeviceModule.PlaybackSamplesReadyCallback {

    @Volatile
    private var _callCount: Int = 0
    val callCount: Int get() = _callCount

    override fun onWebRtcAudioTrackSamplesReady(samples: JavaAudioDeviceModule.AudioSamples) {
        _callCount++

        val data = samples.data
        val sampleRate = samples.sampleRate
        val channels = samples.channelCount
        val byteCount = data.size
        if (byteCount <= 0 || sampleRate <= 0 || channels <= 0) return

        // 16-bit PCM (`WebRtcAudioTrack.BITS_PER_SAMPLE`); `AudioSamples`
        // doesn't expose a direct frames field.
        val frames = byteCount / (channels * 2)

        val copy = ByteBuffer.allocateDirect(byteCount).order(ByteOrder.LITTLE_ENDIAN)
        copy.put(data)
        copy.position(0)
        copy.limit(byteCount)

        try {
            handler(copy, sampleRate, channels, frames)
        } catch (t: Throwable) {
            Log.e(TAG, "playback samples handler threw", t)
        }
    }

    companion object {
        private const val TAG = "TracksRecorder.PbSink"
    }
}
