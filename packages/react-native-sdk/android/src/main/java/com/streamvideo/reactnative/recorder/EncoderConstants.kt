package com.streamvideo.reactnative.recorder

internal object EncoderConstants {
    /** Non-blocking dequeue timeout used during normal frame/buffer feed. */
    const val DEQUEUE_TIMEOUT_US: Long = 10_000L

    /** Slower poll used while waiting for the EOS marker to surface. */
    const val DEQUEUE_TIMEOUT_US_EOS: Long = 100_000L

    /** Max attempts to queue an EOS input buffer before giving up. */
    const val EOS_INPUT_RETRIES: Int = 50

    /** Wall-clock cap on the EOS-mode drain so a missed EOS can't hang the handler. */
    const val EOS_DRAIN_BUDGET_MS: Long = 2_000L
}

class RecordingError(message: String) : RuntimeException(message)
