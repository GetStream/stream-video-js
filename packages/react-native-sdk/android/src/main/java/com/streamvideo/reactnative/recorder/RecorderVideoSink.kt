package com.streamvideo.reactnative.recorder

import org.webrtc.VideoFrame
import org.webrtc.VideoSink

/**
 * Per-track [VideoSink] for [TracksRecorderManager]. Stays dumb —
 * retains each incoming frame and forwards it; the manager handles
 * queue hops, I420 → NV12 conversion, and the encoder feed.
 *
 * `onFrame` is invoked from a WebRTC delivery thread. **Never** call
 * `removeSink` from inside `onFrame` — Android WebRTC has a known
 * deadlock there. The manager removes from its handler thread.
 */
internal class RecorderVideoSink(
    private val handler: (VideoFrame) -> Unit,
) : VideoSink {

    override fun onFrame(frame: VideoFrame) {
        // Retain so the buffer outlives this delivery-thread call.
        // The manager releases after the encoder consumes it.
        frame.retain()
        try {
            handler.invoke(frame)
        } catch (t: Throwable) {
            // Balance the retain when the manager rejects the frame.
            frame.release()
            throw t
        }
    }
}
