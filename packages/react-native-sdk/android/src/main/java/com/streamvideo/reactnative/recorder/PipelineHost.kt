package com.streamvideo.reactnative.recorder

import android.media.MediaMuxer
import android.os.Handler

/**
 * Internal coordination contract between [TracksRecorderManager] and audio/video pipelines.
 * The pipelines own their encoder + sink + drain logic; the host owns lifecycle, the muxer,
 * the muxer-start gate, the shared time origin, and the terminal-completion barrier.
 *
 * Every method on this interface is called from the host's handler thread
 * — pipelines must post to [handler] before calling back into the host.
 */
internal interface PipelineHost {
    /** The recorder's serial handler thread. */
    val handler: Handler

    val muxer: MediaMuxer?

    val muxerStarted: Boolean

    /**
     * Returns the recording's shared time origin in nanoseconds. The
     * first pipeline to deliver a sample seeds the origin with its
     * timestamp; subsequent calls return the established value.
     */
    fun seedOriginNs(timestampNs: Long): Long

    /**
     * Pipeline has added a track to the muxer. The host 
     * muxer once all expected pipelines have reported their track.
     */
    fun onTrackAdded()

    fun onFatalError(error: Throwable)
}
