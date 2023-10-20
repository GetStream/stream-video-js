package com.streamvideo.reactnative

import com.streamvideo.reactnative.video.SimulcastVideoEncoderFactoryWrapper
import com.streamvideo.reactnative.video.WrappedVideoDecoderFactoryProxy
import com.oney.WebRTCModule.WebRTCModuleOptions
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

    @JvmStatic
    fun setup() {
        val options = WebRTCModuleOptions.getInstance()
        options.videoEncoderFactory = SimulcastVideoEncoderFactoryWrapper(null, true, true)
        options.videoDecoderFactory = WrappedVideoDecoderFactoryProxy()
    }

    @JvmStatic
    fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
        this.isInPictureInPictureMode = isInPictureInPictureMode
    }
}
