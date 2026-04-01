package com.streamvideo.reactnative.screenshare

import android.annotation.SuppressLint
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioPlaybackCaptureConfiguration
import android.media.AudioRecord
import android.media.projection.MediaProjection
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import java.nio.ByteBuffer

/**
 * Captures system media audio using [AudioPlaybackCaptureConfiguration].
 *
 * Uses the given [MediaProjection] to set up an [AudioRecord] that captures
 * audio from media playback, games, and other apps (USAGE_MEDIA, USAGE_GAME,
 * USAGE_UNKNOWN) but not notifications, alarms, or system sounds.
 *
 * Audio is captured in a pull-based manner via [getScreenAudioBytes], which
 * reads exactly the requested number of bytes using [AudioRecord.READ_BLOCKING].
 * This is designed to be called from the WebRTC audio processing thread.
 *
 * Format: 48kHz, mono, PCM 16-bit (matching WebRTC's audio pipeline).
 *
 * Requires Android 10 (API 29+).
 */
@RequiresApi(Build.VERSION_CODES.Q)
class ScreenAudioCapture(private val mediaProjection: MediaProjection) {

    private var audioRecord: AudioRecord? = null
    private var screenAudioBuffer: ByteBuffer? = null

    companion object {
        private const val TAG = "ScreenAudioCapture"
        const val SAMPLE_RATE = 48000
        private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
    }

    @SuppressLint("MissingPermission")
    fun start() {
        val playbackConfig = AudioPlaybackCaptureConfiguration.Builder(mediaProjection)
            .addMatchingUsage(AudioAttributes.USAGE_MEDIA)
            .addMatchingUsage(AudioAttributes.USAGE_GAME)
            .addMatchingUsage(AudioAttributes.USAGE_UNKNOWN)
            .build()

        val audioFormat = AudioFormat.Builder()
            .setSampleRate(SAMPLE_RATE)
            .setChannelMask(CHANNEL_CONFIG)
            .setEncoding(AUDIO_FORMAT)
            .build()

        audioRecord = AudioRecord.Builder()
            .setAudioFormat(audioFormat)
            .setAudioPlaybackCaptureConfig(playbackConfig)
            .build()

        if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
            Log.e(TAG, "AudioRecord failed to initialize")
            audioRecord?.release()
            audioRecord = null
            return
        }

        audioRecord?.startRecording()
        Log.d(TAG, "Screen audio capture started")
    }

    /**
     * Pull-based read: returns a [ByteBuffer] containing exactly [bytesRequested] bytes
     * of captured screen audio.
     *
     * Called from the WebRTC audio processing thread. Uses [AudioRecord.READ_BLOCKING]
     * so it will block until the requested bytes are available.
     *
     * @return A [ByteBuffer] with screen audio data, or `null` if capture is not active.
     */
    fun getScreenAudioBytes(bytesRequested: Int): ByteBuffer? {
        val record = audioRecord ?: return null
        if (bytesRequested <= 0) return null

        val buffer = screenAudioBuffer?.takeIf { it.capacity() >= bytesRequested }
            ?: ByteBuffer.allocateDirect(bytesRequested).also { screenAudioBuffer = it }

        buffer.clear()
        buffer.limit(bytesRequested)

        val bytesRead = record.read(buffer, bytesRequested, AudioRecord.READ_BLOCKING)
        if (bytesRead > 0) {
            buffer.position(0)
            buffer.limit(bytesRead)
            return buffer
        }
        return null
    }

    fun stop() {
        try {
            audioRecord?.stop()
        } catch (e: Exception) {
            Log.w(TAG, "Error stopping AudioRecord: ${e.message}")
        }
        audioRecord?.release()
        audioRecord = null
        screenAudioBuffer = null
        Log.d(TAG, "Screen audio capture stopped")
    }
}
