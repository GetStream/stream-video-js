package com.streamvideo.reactnative.audio

import android.annotation.SuppressLint
import android.content.Context
import android.content.Context.AUDIO_SERVICE
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import com.streamvideo.reactnative.callmanager.StreamInCallManagerModule
import java.nio.ByteBuffer
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

/**
 * Holds the audio system in [AudioManager.MODE_IN_COMMUNICATION] for the duration
 * of a communicator-role call.
 *
 * Why this is needed: from Android 11 (API 30) the platform demotes the
 * audio mode back to `MODE_NORMAL` about six seconds after `setMode()` unless the
 * call is actively playing or recording on the voice-communication path.
 * During a call whose microphone is muted and that has no inbound audio yet,
 * neither condition is met, so routing silently falls back to the media path and
 * hardware echo cancellation is switched off.
 * Details: https://issuetracker.google.com/issues/209493718
 *
 * We satisfy the "actively playing" condition by continuously looping an inaudible
 * audo track on the voice-communication stream, which keeps the platform counting us
 * as an active player and therefore keeps the mode in place.
 */
interface CommunicationModeKeepAlive {
    /** Begin holding the communication mode. Idempotent. */
    fun start()

    /** Stop holding the communication mode. Idempotent; the instance can be started again. */
    fun stop()

    /** Permanently release all resources. The instance must not be used afterwards. */
    fun release()

    /** Short human-readable state, surfaced in the audio-state debug log. */
    fun describeState(): String
}

/** No-op variant used on platforms where the mode reset does not occur (Android API < 30). */
object NoCommunicationModeKeepAlive : CommunicationModeKeepAlive {
    override fun start() {}
    override fun stop() {}
    override fun release() {}
    override fun describeState(): String = "disabled (android platform API < 30)"
}

/**
 * Default implementation backed by a silent, looping voice-communication
 * [AudioTrack]. If the silent player cannot be created on a given device, it
 * degrades to a lightweight poller that re-applies the mode whenever the platform
 * has reset it.
 *
 * All lifecycle transitions and every access to [track] are serialized on [gate],
 * so a play/pause can never overlap a release. The poller only ever touches the
 * audio mode (never the track), so it runs lock-free.
 *
 * @suppress
 */
@RequiresApi(Build.VERSION_CODES.R)
internal class SilentPlaybackKeepAlive(
    private val context: Context,
) : CommunicationModeKeepAlive {

    private val gate = Any()

    private var track: AudioTrack? = null

    /** Whether we currently intend the silent player to be running. */
    private var engaged = false

    /** Read by the poller (off-gate) to drop ticks that were queued before we stopped. */
    @Volatile
    private var live = false

    private var modePoller: ScheduledExecutorService? = null

    override fun start(): Unit = synchronized(gate) {
        live = true
        if (engaged) return
        engaged = true

        val player = track ?: createSilentTrack()?.also { track = it }
        if (player == null) {
            // Silent player unavailable on this device — fall back to reactive repair.
            startModePoller()
            return
        }
        if (player.state == AudioTrack.STATE_INITIALIZED) {
            player.play()
        } else {
            player.release()
            track = null
            startModePoller()
        }
    }

    override fun stop() = synchronized(gate) {
        live = false
        if (engaged) {
            engaged = false
            track?.takeIf { it.state == AudioTrack.STATE_INITIALIZED }?.pause()
        }
        stopModePoller()
    }

    override fun release() = synchronized(gate) {
        live = false
        engaged = false
        stopModePoller()
        track?.let {
            if (it.state == AudioTrack.STATE_INITIALIZED) it.pause()
            it.release()
        }
        track = null
    }

    override fun describeState(): String = synchronized(gate) {
        "enabled, built=${track != null}, playing=$engaged, modePoller=${modePoller != null}"
    }

    @SuppressLint("Range")
    private fun createSilentTrack(): AudioTrack? {
        return try {
            val audioManager = context.getSystemService(AUDIO_SERVICE) as AudioManager
            val sampleRate = positiveOrDefault(
                audioManager.getProperty(AudioManager.PROPERTY_OUTPUT_SAMPLE_RATE)?.toIntOrNull(),
                DEFAULT_SAMPLE_RATE,
            )
            // One buffer worth of frames is enough — we loop it forever.
            val frameCount = positiveOrDefault(
                audioManager.getProperty(AudioManager.PROPERTY_OUTPUT_FRAMES_PER_BUFFER)
                    ?.toIntOrNull(),
                sampleRate / 100, // ~10 ms
            )
            val bufferBytes = frameCount * BYTES_PER_FRAME
            // A freshly allocated direct buffer is zero-filled, i.e. pure silence.
            val silence = ByteBuffer.allocateDirect(bufferBytes)

            val player = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build(),
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(ENCODING)
                        .setSampleRate(sampleRate)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build(),
                )
                .setBufferSizeInBytes(bufferBytes)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .setSessionId(AudioManager.AUDIO_SESSION_ID_GENERATE)
                .build()

            val written = player.write(silence, silence.remaining(), AudioTrack.WRITE_BLOCKING)
            val loopResult = player.setLoopPoints(0, frameCount - 1, -1)
            val ready = player.state == AudioTrack.STATE_INITIALIZED &&
                written >= 0 &&
                loopResult == AudioTrack.SUCCESS
            if (ready) {
                player
            } else {
                Log.w(
                    TAG,
                    "Silent keep-alive track not usable " +
                        "(state=${player.state}, written=$written, loop=$loopResult); discarding.",
                )
                player.release()
                null
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not create silent keep-alive track.", e)
            null
        }
    }

    private fun startModePoller() {
        if (modePoller != null) return
        modePoller = Executors.newSingleThreadScheduledExecutor().also { poller ->
            poller.scheduleWithFixedDelay(
                ::reapplyModeIfReset,
                MODE_POLL_INTERVAL_MS,
                MODE_POLL_INTERVAL_MS,
                TimeUnit.MILLISECONDS,
            )
        }
    }

    private fun reapplyModeIfReset() {
        // Read/write the mode on the shared audio thread so it can't race routing changes.
        AudioDeviceManager.runInAudioThread {
            if (!live) return@runInAudioThread
            val audioManager = context.getSystemService(AUDIO_SERVICE) as AudioManager
            if (audioManager.mode != AudioManager.MODE_IN_COMMUNICATION) {
                Log.d(TAG, "Re-applying MODE_IN_COMMUNICATION after a platform reset.")
                audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            }
        }
    }

    private fun stopModePoller() {
        modePoller?.shutdownNow()
        modePoller = null
    }

    private fun positiveOrDefault(value: Int?, default: Int): Int =
        if (value != null && value > 0) value else default

    companion object {
        private const val TAG = StreamInCallManagerModule.TAG
        private const val DEFAULT_SAMPLE_RATE = 16000
        private const val ENCODING = AudioFormat.ENCODING_PCM_16BIT

        // We always emit mono 16-bit PCM, so a frame is exactly 2 bytes.
        private const val BYTES_PER_FRAME = 2

        // Fallback poll cadence. Deliberately shorter than AOSP's ~6s reset window: the
        // interval bounds only the worst-case wrong-routing gap (<= interval), while the
        // real setMode/HAL transition rate stays governed by the OS re-arm, so polling
        // faster only costs cheap reads and shortens the recovery latency.
        private const val MODE_POLL_INTERVAL_MS = 2000L
    }
}
