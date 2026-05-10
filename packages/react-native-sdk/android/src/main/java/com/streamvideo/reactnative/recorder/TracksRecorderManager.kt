package com.streamvideo.reactnative.recorder

import android.content.Context
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import android.util.Log
import com.oney.WebRTCModule.WebRTCModule
import com.oney.WebRTCModule.WebRTCModuleOptions
import org.webrtc.VideoFrame
import org.webrtc.VideoTrack
import java.io.File
import java.nio.ByteBuffer

/**
 * Owns the [MediaMuxer], the H.264 / AAC [MediaCodec] encoders, and the
 * per-track sink lifecycle. Generic orchestrator — knows nothing about
 * loopback or any specific recording use case. The public surface is
 * wrapped by `StreamVideoReactNativeModule.kt`'s `startTrackRecording` /
 * `stopTrackRecording` / `clearStreamRecordings` / `getStreamRecordings`
 * methods, which in turn are the bridge contract used by the JS
 * `useLoopbackRecording` hook.
 *
 * Both video and audio are optional. The caller passes whichever track
 * ids it has; recordings can be video-only, audio-only, or A+V. The
 * `MediaMuxer` only starts once **all** requested encoders have reported
 * their output format (gated by [maybeStartMuxer] on the union of
 * [pendingVideo] and [pendingAudio]).
 *
 * Threading: a dedicated [HandlerThread] serialises every state mutation
 * (start, stop, encoder feed, muxer writes) so the rest of the file is
 * lock-free. WebRTC's video delivery thread retains each [VideoFrame]
 * and posts it to the recorder handler; the audio delivery thread copies
 * each PCM buffer into a fresh direct buffer and posts the same way.
 * Both kinds drain their respective encoders and write to the muxer
 * from the recorder handler.
 *
 * Completion semantics: `startRecording` is the **lifecycle promise** — it
 * fires once at the recording's terminal moment with the produced file (or
 * an error). `stopRecording` is a void sync point that resolves after
 * native finalisation, so callers can `await stopTrackRecording(); await
 * getStreamRecordings()` without racing the disk flush. Same shape as iOS.
 */
class TracksRecorderManager private constructor() {

    // ── Configuration ────────────────────────────────────────────────────

    fun recordingsDirectory(context: Context): File {
        val dir = File(context.cacheDir, RECORDINGS_DIR_NAME)
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    // ── State ────────────────────────────────────────────────────────────

    private val thread = HandlerThread("io.stream.video.tracks-recorder").apply { start() }
    private val handler = Handler(thread.looper)
    /**
     * Auto-stop timer runs on the main looper, not the recorder handler.
     * If posted to the recorder handler the timer would queue behind the
     * encoder backlog and fire late, overshooting the user-facing
     * deadline.
     */
    private val timerHandler = Handler(Looper.getMainLooper())

    private var muxer: MediaMuxer? = null
    private var muxerStarted = false

    private var videoEncoder: MediaCodec? = null
    private var videoTrackIndex: Int = -1
    private var videoFormatLocked = false
    /**
     * Dimensions the encoder was configured with (locked to the first
     * delivered frame). MediaCodec's input buffer slot size is fixed at
     * `configure()` time, so frames at a different resolution are
     * rescaled before encoding.
     */
    private var encoderWidth: Int = 0
    private var encoderHeight: Int = 0

    private var videoSink: RecorderVideoSink? = null
    private var videoTrack: VideoTrack? = null

    // Audio capture is render-side via the fork's
    // `WebRTCModuleOptions.addPlaybackSamplesObserver`, which fans out
    // the JADM playback callback. Independent of whatever
    // `AudioProcessingFactory` is configured (custom APM, third-party
    // noise cancellation, default), so the recorder works regardless.
    private var audioEncoder: MediaCodec? = null
    private var audioTrackIndex: Int = -1
    private var audioFormatLocked = false
    private var audioSink: RecorderPlaybackSamplesSink? = null
    private var audioSampleRate: Int = 0
    private var audioChannelCount: Int = 0
    private var audioBitsPerSample: Int = 0
    /**
     * Reference to the system [android.media.AudioTrack] held while
     * playback is muted for recording, so `stopRecording` can restore
     * the original volume. `@Volatile` because
     * [restoreLoopbackPlaybackMute] is invoked from both the recorder
     * handler (manual stop) and the main looper (auto-stop runnable).
     */
    @Volatile
    private var mutedSystemAudioTrack: android.media.AudioTrack? = null

    private var outputFile: File? = null

    /**
     * Fires exactly once at the recording's terminal moment. Gated by
     * [terminalBarrierFired] so auto-stop, manual stop, and
     * fatal-startup paths don't double-fire.
     */
    private var startCompletion: ((File?, Throwable?) -> Unit)? = null
    private var terminalBarrierFired = false

    private var isRecording = false
    private var pendingVideo = false
    private var pendingAudio = false
    private var recordingStartHostTimeNs: Long? = null
    private var autoStopRunnable: Runnable? = null

    private var videoFramesEncoded = 0
    private var videoSamplesAppended = 0
    private var videoFramesDropped = 0
    private var videoFramesScaled = 0
    private var rotationApplied = false
    private var firstSamplePtsUs: Long = -1
    private var lastSamplePtsUs: Long = -1
    private var audioBuffersReceived = 0
    private var audioSamplesAppended = 0
    private var audioBuffersDropped = 0

    // ── Public API ───────────────────────────────────────────────────────

    fun startRecording(
        context: Context,
        webRTCModule: WebRTCModule,
        videoTrackId: String?,
        audioTrackId: String?,
        maxDurationMs: Long,
        completion: (File?, Throwable?) -> Unit,
    ) {
        handler.post {
            if (isRecording) {
                completion(null, RecordingError("recording_in_progress"))
                return@post
            }

            val resolvedVideoTrack = videoTrackId
                ?.let { webRTCModule.getTrackById(it) } as? VideoTrack
            // Audio is captured via the JADM playback callback, so
            // `audioTrackId` is just a request signal — the actual
            // track instance is irrelevant.
            val audioRequested = (audioTrackId != null)
            if (resolvedVideoTrack == null && !audioRequested) {
                completion(null, RecordingError("no_tracks_resolved"))
                return@post
            }

            val dir = recordingsDirectory(context)
            val outFile = File(dir, "recording_${System.currentTimeMillis()}.mp4")
            val muxerInstance: MediaMuxer = try {
                MediaMuxer(outFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
            } catch (t: Throwable) {
                completion(null, t)
                return@post
            }

            resetTransientState()
            this.muxer = muxerInstance
            this.outputFile = outFile
            this.videoTrack = resolvedVideoTrack
            this.startCompletion = completion
            this.pendingVideo = (resolvedVideoTrack != null)
            this.pendingAudio = audioRequested
            this.isRecording = true

            if (resolvedVideoTrack != null) {
                val sink = RecorderVideoSink { frame -> onFrameDelivered(frame) }
                this.videoSink = sink
                resolvedVideoTrack.addSink(sink)
            }
            if (audioRequested) {
                val sink = RecorderPlaybackSamplesSink { data, sr, ch, frames ->
                    onAudioBufferDelivered(data, sr, ch, frames)
                }
                this.audioSink = sink
                WebRTCModuleOptions.getInstance().addPlaybackSamplesObserver(sink)

                // Always mute the speaker so the loopback echo doesn't
                // feed back into the mic. See [applyLoopbackPlaybackMute].
                applyLoopbackPlaybackMute(webRTCModule)
            }

            if (maxDurationMs > 0) {
                val runnable = Runnable { stopRecording { /* fire-and-forget */ } }
                autoStopRunnable = runnable
                timerHandler.postDelayed(runnable, maxDurationMs)
            }

            Log.i(
                TAG,
                "recording started video=${resolvedVideoTrack != null} audio=$audioRequested → ${outFile.absolutePath}",
            )
        }
    }

    /**
     * Mutes the system playback track by setting its volume to 0 so
     * the SFU loopback echo doesn't feed back into the mic. The JADM
     * audio thread keeps running, so our playback-samples callback
     * still fires with real PCM and the recording captures audio —
     * only the speaker is silenced.
     *
     * Reflection is required because `WebRtcAudioTrack` is package-
     * private and its `audioTrack` field private. Best-effort — if
     * reflection fails (WebRTC class layout changed), recording still
     * works; the user just hears the echo.
     */
    private fun applyLoopbackPlaybackMute(webRTCModule: WebRTCModule) {
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

    /**
     * Detaches sinks synchronously from any thread. Both
     * `VideoTrack.removeSink` and `removePlaybackSamplesObserver` are
     * thread-safe and idempotent. Called off the recorder handler so
     * new buffers stop arriving immediately — going through the
     * handler would queue the detach behind the encoder backlog and
     * keep accepting samples past the user-facing stop point.
     */
    private fun detachSinksImmediate() {
        try {
            videoTrack?.let { track ->
                videoSink?.let { sink -> track.removeSink(sink) }
            }
        } catch (t: Throwable) {
            Log.w(TAG, "detachSinksImmediate: removeSink(video) threw", t)
        }
        try {
            audioSink?.let { sink ->
                WebRTCModuleOptions.getInstance().removePlaybackSamplesObserver(sink)
            }
        } catch (t: Throwable) {
            Log.w(TAG, "detachSinksImmediate: removePlaybackSamplesObserver threw", t)
        }
    }

    fun stopRecording(completion: () -> Unit) {
        // Detach sinks synchronously off the recorder handler so no
        // new buffers can be enqueued while the backlog drains. See
        // [detachSinksImmediate].
        detachSinksImmediate()
        restoreLoopbackPlaybackMute()
        autoStopRunnable?.let { timerHandler.removeCallbacks(it) }
        autoStopRunnable = null

        handler.post {
            if (!isRecording) {
                completion()
                return@post
            }

            // In-flight handler posts from a sink (queued before the
            // synchronous detach above) see null and bail.
            videoSink = null
            audioSink = null

            val vEncoder = videoEncoder
            val aEncoder = audioEncoder
            val muxerInstance = muxer
            val resolved = outputFile

            // No samples ever made it to the muxer — nothing to finalise.
            if (!muxerStarted || muxerInstance == null) {
                Log.w(
                    TAG,
                    "stopRecording: muxer never started (videoFrames=$videoFramesEncoded audioBuffers=$audioBuffersReceived)",
                )
                try {
                    vEncoder?.stop()
                } catch (_: Throwable) {
                }
                try {
                    vEncoder?.release()
                } catch (_: Throwable) {
                }
                try {
                    aEncoder?.stop()
                } catch (_: Throwable) {
                }
                try {
                    aEncoder?.release()
                } catch (_: Throwable) {
                }
                try {
                    muxerInstance?.release()
                } catch (_: Throwable) {
                }
                // Best-effort: delete the empty file so getStreamRecordings()
                // doesn't surface an unplayable 0-byte mp4.
                resolved?.delete()
                fireTerminalCompletion(null, null)
                cleanupAfterStop()
                completion()
                return@post
            }

            // Skip the EOS drain when EOS can't be queued — waiting on
            // a marker that will never arrive would hang the handler.
            if (vEncoder != null) {
                try {
                    val queued = signalEndOfStream(vEncoder, muxerInstance, TrackKind.VIDEO)
                    if (queued) {
                        drainEncoder(vEncoder, muxerInstance, TrackKind.VIDEO, endOfStream = true)
                    }
                } catch (t: Throwable) {
                    Log.e(TAG, "stopRecording: video drain failed", t)
                }
            }
            if (aEncoder != null) {
                try {
                    val queued = signalEndOfStream(aEncoder, muxerInstance, TrackKind.AUDIO)
                    if (queued) {
                        drainEncoder(aEncoder, muxerInstance, TrackKind.AUDIO, endOfStream = true)
                    }
                } catch (t: Throwable) {
                    Log.e(TAG, "stopRecording: audio drain failed", t)
                }
            }

            try {
                vEncoder?.stop()
            } catch (t: Throwable) {
                Log.w(TAG, "video encoder.stop() threw", t)
            }
            try {
                vEncoder?.release()
            } catch (t: Throwable) {
                Log.w(TAG, "video encoder.release() threw", t)
            }
            try {
                aEncoder?.stop()
            } catch (t: Throwable) {
                Log.w(TAG, "audio encoder.stop() threw", t)
            }
            try {
                aEncoder?.release()
            } catch (t: Throwable) {
                Log.w(TAG, "audio encoder.release() threw", t)
            }

            var finalResolved: File? = resolved
            try {
                muxerInstance.stop()
            } catch (t: Throwable) {
                Log.e(TAG, "muxer.stop() threw — likely no usable samples", t)
                finalResolved = null
                resolved?.delete()
            }
            try {
                muxerInstance.release()
            } catch (t: Throwable) {
                Log.w(TAG, "muxer.release() threw", t)
            }

            val durationMs = if (firstSamplePtsUs >= 0 && lastSamplePtsUs >= firstSamplePtsUs) {
                (lastSamplePtsUs - firstSamplePtsUs) / 1000
            } else {
                -1
            }
            Log.i(
                TAG,
                "recording finalised video[encoded=$videoFramesEncoded appended=$videoSamplesAppended scaled=$videoFramesScaled dropped=$videoFramesDropped] audio[received=$audioBuffersReceived appended=$audioSamplesAppended dropped=$audioBuffersDropped] firstPtsUs=$firstSamplePtsUs lastPtsUs=$lastSamplePtsUs durationMs=$durationMs resolved=${finalResolved?.absolutePath ?: "nil"}",
            )

            fireTerminalCompletion(finalResolved, null)
            cleanupAfterStop()
            completion()
        }
    }

    fun clearRecordingsDirectory(context: Context, completion: (Throwable?) -> Unit) {
        handler.post {
            try {
                val dir = recordingsDirectory(context)
                dir.listFiles()?.forEach { it.deleteRecursively() }
                completion(null)
            } catch (t: Throwable) {
                completion(t)
            }
        }
    }

    fun listRecordings(context: Context): List<File> {
        val dir = File(context.cacheDir, RECORDINGS_DIR_NAME)
        if (!dir.isDirectory) return emptyList()
        return dir.listFiles()
            ?.sortedByDescending { it.lastModified() }
            ?: emptyList()
    }

    // ── Frame ingest ─────────────────────────────────────────────────────

    private fun onFrameDelivered(frame: VideoFrame) {
        // Sink already retained the frame on the WebRTC delivery
        // thread; release once on the recorder handler after encoding.
        handler.post {
            try {
                handleVideoFrameOnHandler(frame)
            } finally {
                frame.release()
            }
        }
    }

    private fun handleVideoFrameOnHandler(frame: VideoFrame) {
        if (!isRecording) return

        val muxerInstance = muxer ?: return
        val width = frame.buffer.width
        val height = frame.buffer.height
        if (width <= 0 || height <= 0) return

        // Lazy-create the encoder on the first frame so its dimensions
        // match the actual delivered resolution. The format-changed
        // event from the encoder's first output then carries the
        // SPS/PPS-bearing MediaFormat the muxer needs.
        val encoder = videoEncoder ?: createVideoEncoder(width, height) ?: return

        // WebRTC's adaptive layers can change resolution mid-recording.
        // The encoder's input slots are sized to its configured
        // dimensions, so we rescale instead of dropping. Aspect-ratio
        // mismatches stretch (we don't crop) — in practice the
        // adaptive layers preserve ratio.
        val needsScale = (width != encoderWidth || height != encoderHeight)
        if (recordingStartHostTimeNs == null) {
            recordingStartHostTimeNs = frame.timestampNs
        }
        if (!rotationApplied) {
            rotationApplied = true
            try {
                muxerInstance.setOrientationHint(((frame.rotation % 360) + 360) % 360)
            } catch (t: Throwable) {
                Log.w(TAG, "setOrientationHint failed", t)
            }
        }

        val originNs = recordingStartHostTimeNs!!
        val ptsUs = ((frame.timestampNs - originNs) / 1000L).coerceAtLeast(0L)

        // Both branches end with a buffer the caller owns and must
        // release: `cropAndScale` produces a new ref-counted buffer,
        // and the no-scale branch retains the original. Every exit
        // path below calls `sourceBuffer.release()`.
        val sourceBuffer: VideoFrame.Buffer = if (needsScale) {
            videoFramesScaled++
            try {
                frame.buffer.cropAndScale(0, 0, width, height, encoderWidth, encoderHeight)
            } catch (t: Throwable) {
                Log.e(TAG, "cropAndScale failed", t)
                videoFramesDropped++
                return
            }
        } else {
            frame.buffer.also { it.retain() }
        }

        val i420 = sourceBuffer.toI420()
        if (i420 == null) {
            sourceBuffer.release()
            videoFramesDropped++
            return
        }

        val inputIndex = try {
            encoder.dequeueInputBuffer(DEQUEUE_TIMEOUT_US)
        } catch (t: Throwable) {
            Log.e(TAG, "dequeueInputBuffer threw", t)
            i420.release()
            sourceBuffer.release()
            videoFramesDropped++
            return
        }
        if (inputIndex < 0) {
            i420.release()
            sourceBuffer.release()
            videoFramesDropped++
            return
        }

        // The codec's Image exposes each plane's actual `rowStride` /
        // `pixelStride`, so libyuv can write into the slot honouring
        // whatever alignment the hardware needs. A tightly-packed
        // ByteBuffer would produce green chroma + grey Y banding
        // whenever the encoder pads rows or slice height.
        val image = encoder.getInputImage(inputIndex)
        val bytesQueued = if (image != null) {
            try {
                writeI420ToCodecImage(i420, image, encoderWidth, encoderHeight)
            } catch (t: Throwable) {
                Log.e(TAG, "writeI420ToCodecImage failed", t)
                -1
            }
        } else {
            -1
        }
        i420.release()
        sourceBuffer.release()

        if (bytesQueued <= 0) {
            // Release the codec slot without queueing real data.
            encoder.queueInputBuffer(inputIndex, 0, 0, ptsUs, 0)
            videoFramesDropped++
            return
        }

        encoder.queueInputBuffer(inputIndex, 0, bytesQueued, ptsUs, 0)
        videoFramesEncoded++

        drainEncoder(encoder, muxerInstance, TrackKind.VIDEO, endOfStream = false)
    }

    /**
     * Converts an I420 frame to NV12 directly into the codec's `Image`
     * plane buffers via libyuv. For NV12 semi-planar, `planes[1]` is
     * the U-byte view of the UV plane and its underlying buffer is a
     * contiguous U,V,U,V,… byte sequence — exactly what `I420ToNV12`
     * writes, so we pass it directly as `dstUV`. libyuv honours the
     * supplied row strides, handling any encoder padding automatically.
     *
     * Returns the logical NV12 frame size (`width * height * 3 / 2`).
     * NOT the strided sum: `queueInputBuffer`'s underlying input
     * buffer is sized to the natural frame, and passing the strided
     * value would crash with `IllegalArgumentException: buffer offset
     * and size goes beyond the capacity`.
     */
    private fun writeI420ToCodecImage(
        i420: VideoFrame.I420Buffer,
        image: android.media.Image,
        width: Int,
        height: Int,
    ): Int {
        val planes = image.planes
        if (planes.size < 3) return -1

        val planeY = planes[0]
        val planeUV = planes[1]
        try {
            org.webrtc.YuvHelper.I420ToNV12(
                i420.dataY, i420.strideY,
                i420.dataU, i420.strideU,
                i420.dataV, i420.strideV,
                planeY.buffer, planeY.rowStride,
                planeUV.buffer, planeUV.rowStride,
                width, height,
            )
        } catch (t: Throwable) {
            Log.e(TAG, "YuvHelper.I420ToNV12 failed", t)
            return -1
        }
        return width * height * 3 / 2
    }

    // ── Audio ingest ─────────────────────────────────────────────────────

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
        sampleRate: Int,
        channels: Int,
        frames: Int,
        arrivalNs: Long,
    ) {
        if (!isRecording) return
        val muxerInstance = muxer ?: return

        // JADM playback always uses 16-bit signed PCM
        // (`WebRtcAudioTrack.BITS_PER_SAMPLE`).
        val bitsPerSample = 16
        val encoder = audioEncoder ?: createAudioEncoder(sampleRate, channels, bitsPerSample)
            ?: return

        // MediaCodec can't re-negotiate format mid-stream; drop
        // mismatched buffers. Rare in practice — WebRTC keeps PCM
        // format constant per render session.
        if (sampleRate != audioSampleRate || channels != audioChannelCount) {
            audioBuffersDropped++
            if (audioBuffersDropped <= 5 || audioBuffersDropped % 30 == 0) {
                Log.w(
                    TAG,
                    "dropping audio buffer sr=$sampleRate ch=$channels (configured sr=$audioSampleRate ch=$audioChannelCount dropped=$audioBuffersDropped)",
                )
            }
            return
        }

        // First buffer of any kind establishes the shared origin so
        // video and audio PTS share zero.
        if (recordingStartHostTimeNs == null) {
            recordingStartHostTimeNs = arrivalNs
        }
        val originNs = recordingStartHostTimeNs!!

        // Wall-clock PTS bounds the file's reported duration to the
        // actual recording window. A sample-counter approach would
        // over-count if JADM delivered a burst (e.g. playback-startup
        // buffer flush), making the MP4 longer than the recording
        // window. Jitter in delivery cadence shows up as a few-ms
        // variance in sample spacing — below audible threshold.
        val ptsUs = ((arrivalNs - originNs) / 1000L).coerceAtLeast(0L)

        val byteCount = frames * channels * (bitsPerSample / 8)
        val inputIndex = try {
            encoder.dequeueInputBuffer(DEQUEUE_TIMEOUT_US)
        } catch (t: Throwable) {
            Log.e(TAG, "audio dequeueInputBuffer threw", t)
            audioBuffersDropped++
            return
        }
        if (inputIndex < 0) {
            audioBuffersDropped++
            return
        }
        val input = encoder.getInputBuffer(inputIndex)
        if (input == null) {
            audioBuffersDropped++
            encoder.queueInputBuffer(inputIndex, 0, 0, ptsUs, 0)
            return
        }
        input.clear()
        if (input.capacity() < byteCount) {
            Log.w(
                TAG,
                "audio input buffer too small (${input.capacity()} < $byteCount) — dropping",
            )
            encoder.queueInputBuffer(inputIndex, 0, 0, ptsUs, 0)
            audioBuffersDropped++
            return
        }
        input.put(data)
        encoder.queueInputBuffer(inputIndex, 0, byteCount, ptsUs, 0)
        audioBuffersReceived++

        drainEncoder(encoder, muxerInstance, TrackKind.AUDIO, endOfStream = false)
    }

    // ── Encoder helpers ──────────────────────────────────────────────────

    private fun createVideoEncoder(width: Int, height: Int): MediaCodec? {
        // Without KEY_MAX_INPUT_SIZE MediaCodec picks a small default
        // (~64 KB) and `put(nv12)` overflows at any non-trivial size.
        val nv12FrameSize = width * height * 3 / 2
        val format = MediaFormat.createVideoFormat(MIME_VIDEO_AVC, width, height).apply {
            setInteger(
                MediaFormat.KEY_COLOR_FORMAT,
                MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420SemiPlanar,
            )
            setInteger(MediaFormat.KEY_BIT_RATE, BIT_RATE)
            setInteger(MediaFormat.KEY_FRAME_RATE, FRAME_RATE)
            setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, I_FRAME_INTERVAL_SECS)
            setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, nv12FrameSize)
            // Baseline profile suppresses B-frames. With B-frames the
            // output `presentationTimeUs` arrives in coded (DTS) order
            // and MediaMuxer silently truncates the file's reported
            // duration at the first non-monotonic transition. Level 3.1
            // covers up to 720p30, well above the SFU loopback range.
            setInteger(
                MediaFormat.KEY_PROFILE,
                MediaCodecInfo.CodecProfileLevel.AVCProfileBaseline,
            )
            setInteger(
                MediaFormat.KEY_LEVEL,
                MediaCodecInfo.CodecProfileLevel.AVCLevel31,
            )
            // API 30+: low-latency encode = no reorder. Harmless on
            // older API levels (key ignored).
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                setInteger(MediaFormat.KEY_LATENCY, 1)
            }
        }
        return try {
            val encoder = MediaCodec.createEncoderByType(MIME_VIDEO_AVC)
            encoder.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            encoder.start()
            videoEncoder = encoder
            encoderWidth = width
            encoderHeight = height
            // INVARIANT: `pendingVideo` must stay `true` until
            // `videoFormatLocked` is set (i.e. until INFO_OUTPUT_FORMAT_CHANGED
            // has fired and we've called `muxer.addTrack(video)`).
            // Clearing it here would let `maybeStartMuxer` fire before
            // the video track has been added, and a later `addTrack`
            // would crash with "Muxer is not initialized".
            encoder
        } catch (t: Throwable) {
            Log.e(TAG, "failed to create H.264 encoder", t)
            fireTerminalCompletion(null, t)
            cleanupAfterFailure()
            null
        }
    }

    private fun createAudioEncoder(
        sampleRate: Int,
        channels: Int,
        bitsPerSample: Int,
    ): MediaCodec? {
        val format = MediaFormat.createAudioFormat(MIME_AUDIO_AAC, sampleRate, channels).apply {
            setInteger(
                MediaFormat.KEY_AAC_PROFILE,
                MediaCodecInfo.CodecProfileLevel.AACObjectLC,
            )
            setInteger(MediaFormat.KEY_BIT_RATE, AUDIO_BIT_RATE)
            // 4× the typical 10 ms PCM buffer — generous so the input
            // slot is never tight.
            val pcmBytesPerBuffer = sampleRate * channels * (bitsPerSample / 8) / 100
            setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, pcmBytesPerBuffer * 4)
        }
        return try {
            val encoder = MediaCodec.createEncoderByType(MIME_AUDIO_AAC)
            encoder.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            encoder.start()
            audioEncoder = encoder
            audioSampleRate = sampleRate
            audioChannelCount = channels
            audioBitsPerSample = bitsPerSample
            // INVARIANT: see the symmetric comment in `createVideoEncoder`.
            // `pendingAudio` must remain `true` until `audioFormatLocked`
            // is set or the muxer would start without the audio track.
            encoder
        } catch (t: Throwable) {
            Log.e(TAG, "failed to create AAC encoder", t)
            fireTerminalCompletion(null, t)
            cleanupAfterFailure()
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
    private fun signalEndOfStream(
        encoder: MediaCodec,
        muxerInstance: MediaMuxer,
        kind: TrackKind,
    ): Boolean {
        repeat(EOS_INPUT_RETRIES) {
            val idx = try {
                encoder.dequeueInputBuffer(DEQUEUE_TIMEOUT_US)
            } catch (t: Throwable) {
                Log.w(TAG, "dequeueInputBuffer during EOS threw (kind=$kind)", t)
                return false
            }
            if (idx >= 0) {
                encoder.queueInputBuffer(
                    idx, 0, 0, 0L,
                    MediaCodec.BUFFER_FLAG_END_OF_STREAM,
                )
                return true
            }
            // Keep output flowing so input slots can be released.
            try {
                drainEncoder(encoder, muxerInstance, kind, endOfStream = false)
            } catch (t: Throwable) {
                Log.w(TAG, "drainEncoder during EOS retry threw (kind=$kind)", t)
            }
        }
        Log.w(TAG, "could not queue EOS for $kind — skipping EOS drain to avoid hang")
        return false
    }

    /**
     * Output drain for either kind. `kind` selects which track index
     * the muxer write targets, and which counters / format-locked
     * flag the format-changed path updates.
     */
    private fun drainEncoder(
        encoder: MediaCodec,
        muxerInstance: MediaMuxer,
        kind: TrackKind,
        endOfStream: Boolean,
    ) {
        val info = MediaCodec.BufferInfo()
        val timeoutUs = if (endOfStream) DEQUEUE_TIMEOUT_US_EOS else 0L
        // Wall-clock guard so a missed EOS marker can't hang the
        // recorder thread forever.
        val deadlineMs = System.currentTimeMillis() +
            if (endOfStream) EOS_DRAIN_BUDGET_MS else Long.MAX_VALUE

        while (true) {
            val outIndex = try {
                encoder.dequeueOutputBuffer(info, timeoutUs)
            } catch (t: Throwable) {
                Log.e(TAG, "dequeueOutputBuffer threw (kind=$kind)", t)
                return
            }

            when {
                outIndex == MediaCodec.INFO_TRY_AGAIN_LATER -> {
                    if (!endOfStream) return
                    if (System.currentTimeMillis() >= deadlineMs) {
                        Log.w(
                            TAG,
                            "EOS drain timed out for $kind without seeing BUFFER_FLAG_END_OF_STREAM — bailing out",
                        )
                        return
                    }
                    // During EOS keep polling until the marker arrives.
                }

                outIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                    val locked = when (kind) {
                        TrackKind.VIDEO -> videoFormatLocked
                        TrackKind.AUDIO -> audioFormatLocked
                    }
                    if (locked) {
                        Log.w(TAG, "$kind output format changed twice — ignoring")
                        continue
                    }
                    val newIndex = muxerInstance.addTrack(encoder.outputFormat)
                    when (kind) {
                        TrackKind.VIDEO -> {
                            videoTrackIndex = newIndex
                            videoFormatLocked = true
                        }
                        TrackKind.AUDIO -> {
                            audioTrackIndex = newIndex
                            audioFormatLocked = true
                        }
                    }
                    maybeStartMuxer(muxerInstance)
                }

                outIndex >= 0 -> {
                    val out = encoder.getOutputBuffer(outIndex)
                    val trackIndex = when (kind) {
                        TrackKind.VIDEO -> videoTrackIndex
                        TrackKind.AUDIO -> audioTrackIndex
                    }
                    if (out != null && info.size > 0 && muxerStarted &&
                        trackIndex >= 0 &&
                        info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0
                    ) {
                        out.position(info.offset)
                        out.limit(info.offset + info.size)
                        try {
                            muxerInstance.writeSampleData(trackIndex, out, info)
                            when (kind) {
                                TrackKind.VIDEO -> videoSamplesAppended++
                                TrackKind.AUDIO -> audioSamplesAppended++
                            }
                            if (firstSamplePtsUs < 0 || info.presentationTimeUs < firstSamplePtsUs) {
                                firstSamplePtsUs = info.presentationTimeUs
                            }
                            if (info.presentationTimeUs > lastSamplePtsUs) {
                                lastSamplePtsUs = info.presentationTimeUs
                            }
                        } catch (t: Throwable) {
                            Log.e(TAG, "writeSampleData failed (kind=$kind)", t)
                        }
                    }
                    encoder.releaseOutputBuffer(outIndex, false)
                    if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) return
                }
            }

            if (!endOfStream && outIndex < 0) return
        }
    }

    /**
     * Starts the muxer once every requested track has been added.
     * Calling `start()` before all `addTrack` calls makes subsequent
     * `addTrack` throw "Muxer is not initialized", so the gate is
     * load-bearing.
     */
    private fun maybeStartMuxer(muxerInstance: MediaMuxer) {
        if (muxerStarted) return
        if (pendingVideo && !videoFormatLocked) return
        if (pendingAudio && !audioFormatLocked) return
        try {
            muxerInstance.start()
            muxerStarted = true
        } catch (t: Throwable) {
            Log.e(TAG, "muxer.start() threw", t)
            fireTerminalCompletion(null, t)
            cleanupAfterFailure()
        }
    }

    private enum class TrackKind { VIDEO, AUDIO }

    // ── Lifecycle helpers ────────────────────────────────────────────────

    private fun fireTerminalCompletion(file: File?, error: Throwable?) {
        if (terminalBarrierFired) return
        terminalBarrierFired = true
        val cb = startCompletion
        startCompletion = null
        cb?.invoke(file, error)
    }

    /**
     * Resets every transient field to its initial value. Single source
     * of truth for "the manager is between recordings". Does NOT
     * release native resources — the caller must stop/release encoders
     * and the muxer before invoking this.
     */
    private fun resetTransientState() {
        muxer = null
        muxerStarted = false
        videoEncoder = null
        videoTrackIndex = -1
        videoFormatLocked = false
        encoderWidth = 0
        encoderHeight = 0
        videoSink = null
        videoTrack = null
        audioEncoder = null
        audioTrackIndex = -1
        audioFormatLocked = false
        audioSink = null
        audioSampleRate = 0
        audioChannelCount = 0
        audioBitsPerSample = 0
        mutedSystemAudioTrack = null
        outputFile = null
        startCompletion = null
        terminalBarrierFired = false
        isRecording = false
        pendingVideo = false
        pendingAudio = false
        recordingStartHostTimeNs = null
        autoStopRunnable?.let { timerHandler.removeCallbacks(it) }
        autoStopRunnable = null
        videoFramesEncoded = 0
        videoSamplesAppended = 0
        videoFramesDropped = 0
        videoFramesScaled = 0
        audioBuffersReceived = 0
        audioSamplesAppended = 0
        audioBuffersDropped = 0
        rotationApplied = false
        firstSamplePtsUs = -1
        lastSamplePtsUs = -1
    }

    private fun cleanupAfterFailure() {
        try {
            videoTrack?.let { track -> videoSink?.let { sink -> track.removeSink(sink) } }
        } catch (_: Throwable) {
        }
        try {
            audioSink?.let { sink ->
                WebRTCModuleOptions.getInstance().removePlaybackSamplesObserver(sink)
            }
        } catch (_: Throwable) {
        }
        // Don't leave the speaker muted after a fatal-start failure.
        try {
            restoreLoopbackPlaybackMute()
        } catch (_: Throwable) {
        }
        try {
            videoEncoder?.stop()
        } catch (_: Throwable) {
        }
        try {
            videoEncoder?.release()
        } catch (_: Throwable) {
        }
        try {
            audioEncoder?.stop()
        } catch (_: Throwable) {
        }
        try {
            audioEncoder?.release()
        } catch (_: Throwable) {
        }
        try {
            muxer?.release()
        } catch (_: Throwable) {
        }
        resetTransientState()
    }

    private fun cleanupAfterStop() {
        resetTransientState()
    }

    // ── Errors ───────────────────────────────────────────────────────────

    class RecordingError(message: String) : RuntimeException(message)

    companion object {
        @JvmField
        val shared = TracksRecorderManager()

        private const val TAG = "TracksRecorder"
        private const val RECORDINGS_DIR_NAME = "StreamRecordings"

        private const val MIME_VIDEO_AVC = "video/avc"
        private const val BIT_RATE = 1_000_000
        private const val FRAME_RATE = 30
        private const val I_FRAME_INTERVAL_SECS = 1

        private const val MIME_AUDIO_AAC = "audio/mp4a-latm"
        private const val AUDIO_BIT_RATE = 64_000

        private const val DEQUEUE_TIMEOUT_US = 10_000L
        private const val DEQUEUE_TIMEOUT_US_EOS = 100_000L
        private const val EOS_INPUT_RETRIES = 50
        /** Wall-clock cap on the EOS-mode drain so a missed EOS can't hang the handler. */
        private const val EOS_DRAIN_BUDGET_MS = 2_000L
    }
}
