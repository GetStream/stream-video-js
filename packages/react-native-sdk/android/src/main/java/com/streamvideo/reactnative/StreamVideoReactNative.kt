package com.streamvideo.reactnative

import android.content.res.Configuration
import java.util.concurrent.CopyOnWriteArrayList // For thread safety

object StreamVideoReactNative {

    // Use CopyOnWriteArrayList for thread safety
    private val pipListeners = CopyOnWriteArrayList<(isInPip: Boolean, newConfig: Configuration) -> Unit>()

    @JvmField
    var canAutoEnterPictureInPictureMode = false

    private var isInPictureInPictureMode: Boolean = false

    @Deprecated("No need to use setup() anymore")
    @JvmStatic
    fun setup() {
        // Do nothing
    }

    @JvmStatic
    fun addPipListener(listener: (isInPip: Boolean, newConfig: Configuration) -> Unit) {
        pipListeners.add(listener)
    }

    @JvmStatic
    fun clearPipListeners() {
        pipListeners.clear()
    }

    @JvmStatic
    fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
        this.isInPictureInPictureMode = isInPictureInPictureMode
        // Iterate safely over the list
        pipListeners.forEach { listener ->
            listener(isInPictureInPictureMode, newConfig)
        }
    }
}
