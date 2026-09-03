package com.streamvideo.reactnative.recorder

import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import android.util.Log
import org.webrtc.VideoFrame
import org.webrtc.VideoTrack

/**
 * Video pipeline encapsulates everything specific to the H.264 video path:
 *  - the [RecorderVideoSink] attached to the source [VideoTrack],
 *  - the [MediaCodec] H.264 encoder + its configuration,
 *  - per-frame I420→NV12 normalisation (via [YuvHelper.I420ToNV12]),
 *  - encoder output drain (format-locked addTrack, sample append, EOS),
 *  - per-recording counters surfaced for the end-of-recording log line.
 *
 * Reports format-locked / sample-appended events to the host so the host
 * can gate the muxer-start and track file duration. All state mutation
 * runs on the host's handler thread.
 */
internal class VideoPipeline(
    private val host: PipelineHost,
    private val videoTrack: VideoTrack,
    private val targetWidth: Int = 0,
    private val targetHeight: Int = 0,
) {
    private companion object {
        const val TAG = "TracksRecorder.Video"
        const val MIME = "video/avc"
        const val BIT_RATE = 1_000_000
        const val FRAME_RATE = 30
        const val I_FRAME_INTERVAL_SECS = 1
    }

    private val handler = host.handler

    private var encoder: MediaCodec? = null
    private var sink: RecorderVideoSink? = null

    private var trackIndex: Int = -1
    private var formatLocked = false

    /**
     * Dimensions the encoder was configured with (locked to the first
     * delivered frame). MediaCodec's input buffer slot size is fixed at
     * `configure()` time, so frames at a different resolution are
     * rescaled before encoding.
     */
    private var encoderWidth: Int = 0
    private var encoderHeight: Int = 0
    private var rotationApplied = false

    //diagnostic counters
    private var framesEncoded = 0
    private var samplesAppended = 0
    private var framesDropped = 0
    private var framesScaled = 0
    private var firstSamplePtsUs: Long = -1
    private var lastSamplePtsUs: Long = -1

    /** Attach the sink to the video track. Future frames post to the handler. */
    fun start() {
        val s = RecorderVideoSink { frame -> onFrameDelivered(frame) }
        sink = s
        videoTrack.addSink(s)
    }

    /**
     * Detach the sink synchronously from any thread. `VideoTrack.removeSink`
     * is thread-safe and idempotent. Called off the recorder handler so
     * no new frames arrive while the backlog drains — going through the
     * handler would queue the detach behind the encoder backlog.
     */
    fun detachSink() {
        try {
            sink?.let { videoTrack.removeSink(it) }
        } catch (t: Throwable) {
            Log.w(TAG, "removeSink threw", t)
        }
        sink = null
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
            "summary encoded=$framesEncoded appended=$samplesAppended scaled=$framesScaled dropped=$framesDropped firstPtsUs=$firstSamplePtsUs lastPtsUs=$lastSamplePtsUs durationMs=$durationMs",
        )
    }

    private fun onFrameDelivered(frame: VideoFrame) {
        // Sink already retained the frame on the WebRTC delivery thread;
        // release once on the recorder handler after encoding.
        handler.post {
            try {
                handleVideoFrameOnHandler(frame)
            } finally {
                frame.release()
            }
        }
    }

    private fun handleVideoFrameOnHandler(frame: VideoFrame) {
        val muxerInstance = host.muxer ?: return
        val width = frame.buffer.width
        val height = frame.buffer.height
        if (width <= 0 || height <= 0) return

        // Lazy-create the encoder on the first frame. Prefer the
        // publisher's max video dimensions so the encoder is sized for the
        // highest layer the SFU might ever forward; fall back to the
        // first frame's actual dimensions when no target is supplied.
        val (encW, encH) = resolveEncoderDimensions(
            targetW = targetWidth,
            targetH = targetHeight,
            frameW = width,
            frameH = height,
        )
        val enc = encoder ?: createEncoder(encW, encH) ?: return

        // WebRTC's adaptive layers can change resolution mid-recording.
        // The encoder's input slots are sized to its configured
        // dimensions, so frames are rescaled instead of dropped.
        // Aspect-ratio mismatches stretch (no crop) — in practice the
        // adaptive layers preserve ratio.
        val needsScale = (width != encoderWidth || height != encoderHeight)
        val originNs = host.seedOriginNs(frame.timestampNs)
        val ptsUs = ((frame.timestampNs - originNs) / 1000L).coerceAtLeast(0L)

        if (!rotationApplied) {
            rotationApplied = true
            try {
                muxerInstance.setOrientationHint(((frame.rotation % 360) + 360) % 360)
            } catch (t: Throwable) {
                Log.w(TAG, "setOrientationHint failed", t)
            }
        }

        // Both branches end with a buffer the caller owns and must
        // release: `cropAndScale` produces a new ref-counted buffer,
        // and the no-scale branch retains the original. Every exit
        // path below calls `sourceBuffer.release()`.
        val sourceBuffer: VideoFrame.Buffer = if (needsScale) {
            framesScaled++
            try {
                frame.buffer.cropAndScale(0, 0, width, height, encoderWidth, encoderHeight)
            } catch (t: Throwable) {
                Log.e(TAG, "cropAndScale failed", t)
                framesDropped++
                return
            }
        } else {
            frame.buffer.also { it.retain() }
        }

        val i420 = sourceBuffer.toI420()
        if (i420 == null) {
            sourceBuffer.release()
            framesDropped++
            return
        }

        val inputIndex = try {
            enc.dequeueInputBuffer(EncoderConstants.DEQUEUE_TIMEOUT_US)
        } catch (t: Throwable) {
            Log.e(TAG, "dequeueInputBuffer threw", t)
            i420.release()
            sourceBuffer.release()
            framesDropped++
            return
        }
        if (inputIndex < 0) {
            i420.release()
            sourceBuffer.release()
            framesDropped++
            return
        }

        // The codec's Image exposes each plane's actual `rowStride` /
        // `pixelStride`, so libyuv can write into the slot honouring
        // whatever alignment the hardware needs. A tightly-packed
        // ByteBuffer would produce green chroma + grey Y banding
        // whenever the encoder pads rows or slice height.
        val image = enc.getInputImage(inputIndex)
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
            enc.queueInputBuffer(inputIndex, 0, 0, ptsUs, 0)
            framesDropped++
            return
        }

        enc.queueInputBuffer(inputIndex, 0, bytesQueued, ptsUs, 0)
        framesEncoded++

        drain(enc, muxerInstance, endOfStream = false)
    }

    /**
     * Converts an I420 frame to NV12 directly into the codec's `Image`
     * plane buffers via libyuv. For NV12 semi-planar, `planes[1]` is
     * the U-byte view of the UV plane and its underlying buffer is a
     * contiguous U,V,U,V,… byte sequence — exactly what `I420ToNV12`
     * writes, so it can be passed directly as `dstUV`. libyuv honours
     * the supplied row strides, handling any encoder padding
     * automatically.
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

    /**
     * Picks the encoder dimensions, preferring the caller-supplied
     * `targetW`/`targetH` (publisher's max video publish dimension) but
     * oriented to match the actual frame buffer. Publish options are
     * expressed in WebRTC's canonical landscape form; the buffer may
     * be portrait. When they disagree, swap the target axes so the
     * encoder slot is in the same orientation as the frames flowing
     * through it. Falls back to the frame's own dimensions if no
     * target was supplied (target ≤ 0).
     */
    private fun resolveEncoderDimensions(
        targetW: Int,
        targetH: Int,
        frameW: Int,
        frameH: Int,
    ): Pair<Int, Int> {
        if (targetW <= 0 || targetH <= 0) return frameW to frameH

        val framePortrait = frameH > frameW
        val targetPortrait = targetH > targetW
        return if (framePortrait == targetPortrait) {
            targetW to targetH
        } else {
            targetH to targetW
        }
    }

    private fun createEncoder(width: Int, height: Int): MediaCodec? {
        // Without KEY_MAX_INPUT_SIZE MediaCodec picks a small default
        // (~64 KB) and `put(nv12)` overflows at any non-trivial size.
        val nv12FrameSize = width * height * 3 / 2
        val format = MediaFormat.createVideoFormat(MIME, width, height).apply {
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
            val enc = MediaCodec.createEncoderByType(MIME)
            enc.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            enc.start()
            encoder = enc
            encoderWidth = width
            encoderHeight = height
            // INVARIANT: the host's "pending pipelines" counter must
            // stay positive for this pipeline until INFO_OUTPUT_FORMAT_CHANGED
            // has fired and `muxer.addTrack(video)` has been called.
            // Reporting onTrackAdded() here would let the muxer start
            // before the video track was added, and a later `addTrack`
            // would crash with "Muxer is not initialized".
            enc
        } catch (t: Throwable) {
            Log.e(TAG, "failed to create H.264 encoder", t)
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
