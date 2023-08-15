package com.streamvideo.reactnative

import com.streamvideo.reactnative.video.SimulcastVideoEncoderFactoryWrapper
import com.streamvideo.reactnative.video.WrappedVideoDecoderFactoryProxy
import com.oney.WebRTCModule.WebRTCModuleOptions


object StreamVideoReactNative {

    @JvmStatic
    fun setup() {
        val options = WebRTCModuleOptions.getInstance()
        options.videoEncoderFactory = SimulcastVideoEncoderFactoryWrapper(null, true, true)
        options.videoDecoderFactory = WrappedVideoDecoderFactoryProxy()
    }
}