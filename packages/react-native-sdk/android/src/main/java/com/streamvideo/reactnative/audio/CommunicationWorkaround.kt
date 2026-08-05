/*
 * Copyright 2024-2025 LiveKit, Inc.
 * Copyright 2026 Stream.io Inc.
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
 *
 * Modified from LiveKit's CommunicationWorkaround: audio-thread executor, ungated, watchdog fallback, full-buffer loop.
 * See {@link https://github.com/livekit/client-sdk-android}
 */

package com.streamvideo.reactnative.audio

import android.annotation.SuppressLint
import android.content.Context
import android.content.Context.AUDIO_SERVICE
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.util.Log
import java.nio.ByteBuffer
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Keeps [AudioManager.MODE_IN_COMMUNICATION] for the whole call.
 *
 * On Android 11+ (API 30, R) the OS resets the audio mode away from
 * `MODE_IN_COMMUNICATION` ~6s after `setMode` if the call has neither active
 * voice-communication playback nor active voice-communication recording. This
 * happens for us when the mic is muted/absent and no remote audio is playing
 * (join-muted-alone, both sides muted, pre-audio), dropping routing to the
 * default media path and disabling AEC. See
 * https://issuetracker.google.com/issues/209493718
 *
 * The workaround plays a silent, looping voice-communication [AudioTrack] so the
 * OS always sees active playback for our call.
 */
interface CommunicationWorkaround {
    fun start()
    fun stop()
    fun dispose()

    /** Short human-readable state, surfaced in the audio-state debug log. */
    fun stateDescription(): String
}

/** No-op used when the workaround is not needed (SDK < R). */
object NoopCommunicationWorkaround : CommunicationWorkaround {
    override fun start() {}
    override fun stop() {}
    override fun dispose() {}
    override fun stateDescription(): String = "disabled (sdk<30)"
}

/**
 * @suppress
 */
internal class SilentAudioTrackCommunicationWorkaround(
    private val context: Context
) : CommunicationWorkaround {

    private var audioTrack: AudioTrack? = null

    private val isAudioTrackStarted = AtomicBoolean(false)

    /**
     * Fallback used only when the silent track cannot be built/started: a
     * read-then-repair watchdog that re-asserts `MODE_IN_COMMUNICATION` when the
     * OS has reset it. Repairs (not prevents) within one interval; read-only in
     * steady state, so no HAL churn and no mode-owner theft.
     */
    private var watchdog: ScheduledExecutorService? = null

    @Volatile
    private var running = false

    override fun start() {
        running = true
        playAudioTrackIfNeeded()
    }

    override fun stop() {
        running = false
        pauseAudioTrackIfNeeded()
        stopModeWatchdog()
    }

    override fun dispose() {
        stop()
        audioTrack?.let { track ->
            synchronized(track) {
                track.release()
            }
        }
        audioTrack = null
    }

    override fun stateDescription(): String {
        val playing = isAudioTrackStarted.get()
        val built = audioTrack != null
        val fallback = watchdog != null
        return "enabled, built=$built, playing=$playing, fallbackWatchdog=$fallback"
    }

    private fun String?.toIntOrDefault(default: Int): Int {
        return try {
            this?.toInt() ?: default
        } catch (e: NumberFormatException) {
            default
        }
    }

    @SuppressLint("Range")
    private fun buildAudioTrack(): AudioTrack? {
        try {
            // Get preferred audio output settings
            val audioManager = context.getSystemService(AUDIO_SERVICE) as AudioManager
            val sampleRate = audioManager.getProperty(AudioManager.PROPERTY_OUTPUT_SAMPLE_RATE)
                .toIntOrDefault(SAMPLE_RATE)
                .let { if (it > 0) it else SAMPLE_RATE }
            val framesPerBuffer =
                audioManager.getProperty(AudioManager.PROPERTY_OUTPUT_FRAMES_PER_BUFFER)
                    .toIntOrDefault(AUDIO_FRAME_PER_BUFFER)
                    .let { if (it > 0) it else AUDIO_FRAME_PER_BUFFER }

            // ByteBuffers are zeroed by default on Android
            val audioSample = ByteBuffer.allocateDirect(getBytesPerSample(AUDIO_FORMAT) * framesPerBuffer)

            val track = AudioTrack.Builder()
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AUDIO_FORMAT)
                        .setSampleRate(sampleRate)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build(),
                )
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build(),
                )
                .setBufferSizeInBytes(audioSample.capacity())
                .setTransferMode(AudioTrack.MODE_STATIC)
                .setSessionId(AudioManager.AUDIO_SESSION_ID_GENERATE)
                .build()

            val written = track.write(audioSample, audioSample.remaining(), AudioTrack.WRITE_BLOCKING)
            val looped = track.setLoopPoints(0, framesPerBuffer - 1, -1)
            if (track.state != AudioTrack.STATE_INITIALIZED ||
                written < 0 ||
                looped != AudioTrack.SUCCESS
            ) {
                Log.w(
                    TAG,
                    "Silent track init incomplete (state=${track.state}, written=$written, loop=$looped); releasing.",
                )
                track.release()
                return null
            }
            return track
        } catch (e: Exception) {
            Log.w(TAG, "Failed to build audio track for communication workaround.", e)
            return null
        }
    }

    private fun playAudioTrackIfNeeded() {
        val swapped = isAudioTrackStarted.compareAndSet(false, true)
        if (!swapped) {
            // Already playing, nothing to do
            return
        }

        val audioTrack = audioTrack ?: buildAudioTrack().also { audioTrack = it }
        if (audioTrack == null) {
            // Could not build the silent track; keep the mode alive via the watchdog.
            startModeWatchdog()
            return
        }
        synchronized(audioTrack) {
            if (audioTrack.state == AudioTrack.STATE_INITIALIZED) {
                audioTrack.play()
            } else {
                Log.i(TAG, "Track not initialized; releasing and falling back to mode watchdog.")
                audioTrack.release()
                this.audioTrack = null
                startModeWatchdog()
            }
        }
    }

    private fun pauseAudioTrackIfNeeded() {
        val swapped = isAudioTrackStarted.compareAndSet(true, false)
        if (!swapped) {
            // Already stopped, nothing to do
            return
        }

        audioTrack?.let { track ->
            synchronized(track) {
                if (track.state == AudioTrack.STATE_INITIALIZED) {
                    track.pause()
                } else {
                    Log.d(TAG, "Attempted to stop communication workaround but track was not initialized.")
                }
            }
        }
    }

    private fun startModeWatchdog() {
        if (watchdog != null) return
        watchdog = Executors.newSingleThreadScheduledExecutor().also { executor ->
            executor.scheduleWithFixedDelay(
                {
                    // Serialize the mode read/write with all other routing on the audio thread.
                    AudioDeviceManager.runInAudioThread {
                        // Bail if we've been stopped/disposed since this tick was queued
                        if (!running) return@runInAudioThread
                        val audioManager = context.getSystemService(AUDIO_SERVICE) as AudioManager
                        if (audioManager.mode != AudioManager.MODE_IN_COMMUNICATION) {
                            Log.d(TAG, "Mode watchdog: re-asserting MODE_IN_COMMUNICATION.")
                            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                        }
                    }
                },
                WATCHDOG_INTERVAL_MS,
                WATCHDOG_INTERVAL_MS,
                TimeUnit.MILLISECONDS,
            )
        }
    }

    private fun stopModeWatchdog() {
        watchdog?.shutdownNow()
        watchdog = null
    }

    // Reference from Android code, AudioFormat.getBytesPerSample. BitPerSample / 8
    // Default audio data format is PCM 16 bits per sample.
    // Guaranteed to be supported by all devices
    private fun getBytesPerSample(audioFormat: Int): Int {
        return when (audioFormat) {
            AudioFormat.ENCODING_PCM_8BIT -> 1
            AudioFormat.ENCODING_PCM_16BIT, AudioFormat.ENCODING_IEC61937, AudioFormat.ENCODING_DEFAULT -> 2
            AudioFormat.ENCODING_PCM_FLOAT -> 4
            AudioFormat.ENCODING_INVALID -> throw IllegalArgumentException("Bad audio format $audioFormat")
            else -> throw IllegalArgumentException("Bad audio format $audioFormat")
        }
    }

    companion object {
        private const val TAG = "CommunicationWorkaround"
        private const val SAMPLE_RATE = 16000
        private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
        private const val AUDIO_FRAME_PER_BUFFER = SAMPLE_RATE / 100 // 10 ms

        // Fallback poll interval. Not tied to AOSP's 6s grace period: the interval sets
        // only the worst-case wrong-routing window (<= interval); the actual setMode/HAL
        // transition rate stays ~1 per 6-7s (governed by the OS re-arm), so a shorter
        // interval is strictly better for latency at only cheap-read cost.
        private const val WATCHDOG_INTERVAL_MS = 2000L
    }
}
