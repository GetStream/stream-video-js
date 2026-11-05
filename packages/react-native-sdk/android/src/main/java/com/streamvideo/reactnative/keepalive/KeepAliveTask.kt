package com.streamvideo.reactnative.keepalive

import android.os.Bundle

object KeepAliveTask {
    const val NAME = "StreamVideoKeepCallAlive"

    const val EXTRA_BACKEND = "backend"
    const val BACKEND_SDK = "sdk"
    const val BACKEND_CALLINGX = "callingx"

    /** Task data for a task started by [backend]. */
    fun data(backend: String): Bundle = Bundle().apply { putString(EXTRA_BACKEND, backend) }
}
