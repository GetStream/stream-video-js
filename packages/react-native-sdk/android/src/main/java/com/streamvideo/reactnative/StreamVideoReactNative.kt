package com.streamvideo.reactnative
import kotlin.properties.Delegates


object StreamVideoReactNative {

    var pipListeners = ArrayList<(b: Boolean) -> Unit>()

    @JvmField
    var canAutoEnterPictureInPictureMode = false

    // fires off every time value of the property changes
    private var isInPictureInPictureMode: Boolean by Delegates.observable(false) { _, _, newValue ->
        pipListeners.forEach {listener ->
            listener(newValue)
        }
    }

    @JvmStatic @Deprecated("No need to use setup() anymore")
    fun setup() {
        // do nothing
    }

    @JvmStatic
    fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
        this.isInPictureInPictureMode = isInPictureInPictureMode
    }
}
