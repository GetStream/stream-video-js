package com.streamvideo.reactnative.recorder

import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import android.util.Log
import com.oney.WebRTCModule.WebRTCModule
import com.oney.WebRTCModule.WebRTCModuleOptions
import java.nio.ByteBuffer

/**
 * Audio pipeline owned by [TracksRecorderManager]. Encapsulates the AAC
 * audio path:
 *  - the [RecorderPlaybackSamplesSink] registered with
 *    `WebRTCModuleOptions.addPlaybackSamplesObserver` (the fork's
 *    multi-tenant fan-out over `JavaAudioDeviceModule.PlaybackSamplesReadyCallback`),
 *  - the [MediaCodec] AAC encoder + its configuration,
 *  - reflection-based speaker mute via `WebRtcAudioTrack.audioTrack.setVolume(0)`
 *    so the SFU loopback echo doesn't feed back into the mic,
 *  - encoder output drain (format-locked addTrack, sample append, EOS),
 *  - per-recording counters surfaced for the end-of-recording log line.
 *
 * All state mutation runs on the host's handler thread.
 */
internal class AudioPipeline(
    private val host: PipelineHost,
    private val webRTCModule: WebRTCModule,
) {
    private companion object {
        const val TAG = "TracksRecorder.Audio"
        const val MIME = "audio/mp4a-latm"
        const val BIT_RATE = 64_000
    }

    private val handler = host.handler

    private var encoder: MediaCodec? = null
    private var sink: RecorderPlaybackSamplesSink? = null

    private var trackIndex: Int = -1
    private var formatLocked = false

    private var sampleRate: Int = 0
    private var channelCount: Int = 0
    private var bitsPerSample: Int = 0

    /**
     * Reference to the system [android.media.AudioTrack] held while
     * playback is muted for recording, so cleanup can restore the
     * original volume. `@Volatile` because [restoreLoopbackPlaybackMute]
     * is invoked from both the recorder handler (manual stop) and the
     * main looper (auto-stop runnable).
     */
    @Volatile
    private var mutedSystemAudioTrack: android.media.AudioTrack? = null

    //diagnostic counters
    private var buffersReceived = 0
    private var samplesAppended = 0
    private var buffersDropped = 0
    private var firstSamplePtsUs: Long = -1
    private var lastSamplePtsUs: Long = -1

    /**
     * Register the playback-samples observer with the fork's fan-out and
     * mute the system playback track. Future audio buffers post to the
     * handler.
     */
    fun start() {
        val s = RecorderPlaybackSamplesSink { data, sr, ch, frames ->
            onAudioBufferDelivered(data, sr, ch, frames)
        }
        sink = s
        WebRTCModuleOptions.getInstance().addPlaybackSamplesObserver(s)

        // Always mute the speaker so the loopback echo doesn't feed
        // back into the mic. See [applyLoopbackPlaybackMute].
        applyLoopbackPlaybackMute()
    }

    /**
     * Detach the sink and restore speaker volume synchronously from any
     * thread. Both operations are off-handler so they take effect
     * immediately — routing them through the handler would queue them
     * behind the encoder backlog and keep accepting samples / leave the
     * speaker muted past the user-facing stop point.
     */
    fun detachSink() {
        try {
            sink?.let {
                WebRTCModuleOptions.getInstance().removePlaybackSamplesObserver(it)
            }
        } catch (t: Throwable) {
            Log.w(TAG, "removePlaybackSamplesObserver threw", t)
        }
        sink = null
        restoreLoopbackPlaybackMute()
    }

    /** On-handler. Submit EOS to the encoder. Returns `true` if queued. */
    fun signalEndOfStream(muxerInstance: MediaMuxer): Boolean {
        val enc = encoder ?: return false
        return signalEoS(enc, muxerInstance)
    }

    /** On-handler. Drain until BUFFER_FLAG_END_OF_STREAM or budget expires. */
    fun drainAfterEoS(muxerInstance: MediaMuxer) {
        val enc = encoder ?: return
        drain(enc, muxerInstance, endOfStream = true)
    }

    /** On-handler. Stop + release the encoder. */
    fun stopAndRelease() {
        try {
            encoder?.stop()
        } catch (t: Throwable) {
            Log.w(TAG, "encoder.stop() threw", t)
        }
        try {
            encoder?.release()
        } catch (t: Throwable) {
            Log.w(TAG, "encoder.release() threw", t)
        }
        encoder = null
    }

    fun logSummary() {
        val durationMs = if (firstSamplePtsUs >= 0 && lastSamplePtsUs >= firstSamplePtsUs) {
            (lastSamplePtsUs - firstSamplePtsUs) / 1000
        } else {
            -1
        }
        Log.i(
            TAG,
            "summary received=$buffersReceived appended=$samplesAppended dropped=$buffersDropped firstPtsUs=$firstSamplePtsUs lastPtsUs=$lastSamplePtsUs durationMs=$durationMs",
        )
    }

    /**
     * Mutes the system playback track by setting its volume to 0 so
     * the SFU loopback echo doesn't feed back into the mic. The JADM
     * audio thread keeps running, so the playback-samples callback
     * still fires with real PCM and the recording captures audio —
     * only the speaker is silenced.
     *
     * Reflection is required because `WebRtcAudioTrack` is package-
     * private and its `audioTrack` field private. Best-effort — if
     * reflection fails (WebRTC class layout changed), recording still
     * works; the user just hears the echo.
     */
    private fun applyLoopbackPlaybackMute() {
        try {
            val adm = webRTCModule.audioDeviceModule ?: return
            val audioOutputField = adm.javaClass.getField("audioOutput")
            val audioOutput = audioOutputField.get(adm) ?: return
            val audioTrackField = audioOutput.javaClass.getDeclaredField("audioTrack")
            audioTrackField.isAccessible = true
            val systemAudioTrack = audioTrackField.get(audioOutput) as? android.media.AudioTrack
            if (systemAudioTrack == null) {
                Log.w(TAG, "applyLoopbackPlaybackMute: AudioTrack reflection returned null")
                return
            }
            systemAudioTrack.setVolume(0f)
            mutedSystemAudioTrack = systemAudioTrack
        } catch (t: Throwable) {
            Log.w(TAG, "applyLoopbackPlaybackMute failed — recording will still work but speaker will play loopback", t)
        }
    }

    private fun restoreLoopbackPlaybackMute() {
        val track = mutedSystemAudioTrack ?: return
        try {
            track.setVolume(1f)
        } catch (t: Throwable) {
            Log.w(TAG, "restoreLoopbackPlaybackMute failed", t)
        }
        mutedSystemAudioTrack = null
    }

    private fun onAudioBufferDelivered(
        data: ByteBuffer,
        sampleRate: Int,
        channels: Int,
        frames: Int,
    ) {
        // System.nanoTime() shares the monotonic source WebRTC uses
        // for video frame timestamps, so audio and video PTS line up
        // against the same origin.
        val arrivalNs = System.nanoTime()
        handler.post {
            try {
                handleAudioBufferOnHandler(data, sampleRate, channels, frames, arrivalNs)
            } catch (t: Throwable) {
                Log.e(TAG, "handleAudioBufferOnHandler threw", t)
            }
        }
    }

    private fun handleAudioBufferOnHandler(
        data: ByteBuffer,
        sr: Int,
        ch: Int,
        frames: Int,
        arrivalNs: Long,
    ) {
        val muxerInstance = host.muxer ?: return

        // JADM playback always uses 16-bit signed PCM
        // (`WebRtcAudioTrack.BITS_PER_SAMPLE`).
        val bps = 16
        val enc = encoder ?: createEncoder(sr, ch, bps) ?: return

        // MediaCodec can't re-negotiate format mid-stream; drop
        // mismatched buffers. Rare in practice — WebRTC keeps PCM
        // format constant per render session.
        if (sr != sampleRate || ch != channelCount) {
            buffersDropped++
            if (buffersDropped <= 5 || buffersDropped % 30 == 0) {
                Log.w(
                    TAG,
                    "dropping audio buffer sr=$sr ch=$ch (configured sr=$sampleRate ch=$channelCount dropped=$buffersDropped)",
                )
            }
            return
        }

        // First buffer of any kind establishes the shared origin so
        // video and audio PTS share zero.
        val originNs = host.seedOriginNs(arrivalNs)

        // Wall-clock PTS bounds the file's reported duration to the
        // actual recording window. A sample-counter approach would
        // over-count if JADM delivered a burst (e.g. playback-startup
        // buffer flush), making the MP4 longer than the recording
        // window. Jitter in delivery cadence shows up as a few-ms
        // variance in sample spacing — below audible threshold.
        val ptsUs = ((arrivalNs - originNs) / 1000L).coerceAtLeast(0L)

        val byteCount = frames * ch * (bps / 8)
        val inputIndex = try {
            enc.dequeueInputBuffer(EncoderConstants.DEQUEUE_TIMEOUT_US)
        } catch (t: Throwable) {
            Log.e(TAG, "audio dequeueInputBuffer threw", t)
            buffersDropped++
            return
        }
        if (inputIndex < 0) {
            buffersDropped++
            return
        }
        val input = enc.getInputBuffer(inputIndex)
        if (input == null) {
            buffersDropped++
            enc.queueInputBuffer(inputIndex, 0, 0, ptsUs, 0)
            return
        }
        input.clear()
        if (input.capacity() < byteCount) {
            Log.w(
                TAG,
                "audio input buffer too small (${input.capacity()} < $byteCount) — dropping",
            )
            enc.queueInputBuffer(inputIndex, 0, 0, ptsUs, 0)
            buffersDropped++
            return
        }
        input.put(data)
        enc.queueInputBuffer(inputIndex, 0, byteCount, ptsUs, 0)
        buffersReceived++

        drain(enc, muxerInstance, endOfStream = false)
    }

    private fun createEncoder(sr: Int, ch: Int, bps: Int): MediaCodec? {
        val format = MediaFormat.createAudioFormat(MIME, sr, ch).apply {
            setInteger(
                MediaFormat.KEY_AAC_PROFILE,
                MediaCodecInfo.CodecProfileLevel.AACObjectLC,
            )
            setInteger(MediaFormat.KEY_BIT_RATE, BIT_RATE)
            // 4× the typical 10 ms PCM buffer — generous so the input
            // slot is never tight.
            val pcmBytesPerBuffer = sr * ch * (bps / 8) / 100
            setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, pcmBytesPerBuffer * 4)
        }
        return try {
            val enc = MediaCodec.createEncoderByType(MIME)
            enc.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            enc.start()
            encoder = enc
            sampleRate = sr
            channelCount = ch
            bitsPerSample = bps
            // INVARIANT: see the symmetric comment in [VideoPipeline.createEncoder].
            // The host's pending-pipeline counter must remain positive for this
            // pipeline until `muxer.addTrack(audio)` has been called or the
            // muxer would start without the audio track.
            enc
        } catch (t: Throwable) {
            Log.e(TAG, "failed to create AAC encoder", t)
            host.onFatalError(t)
            null
        }
    }

    /**
     * Queues a zero-length input buffer with `BUFFER_FLAG_END_OF_STREAM`.
     * Drains output between input attempts so the encoder's input
     * slots can free up — a polling-only loop deadlocks when output
     * queues are full. Returns `true` only if the marker was
     * successfully queued; the caller skips the EOS drain otherwise so
     * the handler doesn't hang waiting for a marker that won't arrive.
     */
    private fun signalEoS(enc: MediaCodec, muxerInstance: MediaMuxer): Boolean {
        repeat(EncoderConstants.EOS_INPUT_RETRIES) {
            val idx = try {
                enc.dequeueInputBuffer(EncoderConstants.DEQUEUE_TIMEOUT_US)
            } catch (t: Throwable) {
                Log.w(TAG, "dequeueInputBuffer during EOS threw", t)
                return false
            }
            if (idx >= 0) {
                enc.queueInputBuffer(
                    idx, 0, 0, 0L,
                    MediaCodec.BUFFER_FLAG_END_OF_STREAM,
                )
                return true
            }
            // Keep output flowing so input slots can be released.
            try {
                drain(enc, muxerInstance, endOfStream = false)
            } catch (t: Throwable) {
                Log.w(TAG, "drainEncoder during EOS retry threw", t)
            }
        }
        Log.w(TAG, "could not queue EOS — skipping EOS drain to avoid hang")
        return false
    }

    private fun drain(
        enc: MediaCodec,
        muxerInstance: MediaMuxer,
        endOfStream: Boolean,
    ) {
        val info = MediaCodec.BufferInfo()
        val timeoutUs =
            if (endOfStream) EncoderConstants.DEQUEUE_TIMEOUT_US_EOS else 0L
        val deadlineMs = System.currentTimeMillis() +
            if (endOfStream) EncoderConstants.EOS_DRAIN_BUDGET_MS else Long.MAX_VALUE

        while (true) {
            val outIndex = try {
                enc.dequeueOutputBuffer(info, timeoutUs)
            } catch (t: Throwable) {
                Log.e(TAG, "dequeueOutputBuffer threw", t)
                return
            }

            when {
                outIndex == MediaCodec.INFO_TRY_AGAIN_LATER -> {
                    if (!endOfStream) return
                    if (System.currentTimeMillis() >= deadlineMs) {
                        Log.w(
                            TAG,
                            "EOS drain timed out without seeing BUFFER_FLAG_END_OF_STREAM — bailing out",
                        )
                        return
                    }
                    // During EOS keep polling until the marker arrives.
                }

                outIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                    if (formatLocked) {
                        Log.w(TAG, "output format changed twice — ignoring")
                        continue
                    }
                    val newIndex = muxerInstance.addTrack(enc.outputFormat)
                    trackIndex = newIndex
                    formatLocked = true
                    host.onTrackAdded()
                }

                outIndex >= 0 -> {
                    val out = enc.getOutputBuffer(outIndex)
                    if (out != null && info.size > 0 && host.muxerStarted &&
                        trackIndex >= 0 &&
                        info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0
                    ) {
                        out.position(info.offset)
                        out.limit(info.offset + info.size)
                        try {
                            muxerInstance.writeSampleData(trackIndex, out, info)
                            samplesAppended++
                            if (firstSamplePtsUs < 0 || info.presentationTimeUs < firstSamplePtsUs) {
                                firstSamplePtsUs = info.presentationTimeUs
                            }
                            if (info.presentationTimeUs > lastSamplePtsUs) {
                                lastSamplePtsUs = info.presentationTimeUs
                            }
                        } catch (t: Throwable) {
                            Log.e(TAG, "writeSampleData failed", t)
                        }
                    }
                    enc.releaseOutputBuffer(outIndex, false)
                    if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) return
                }
            }

            if (!endOfStream && outIndex < 0) return
        }
    }
}
