package io.getstream.rnvideosample

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.oney.WebRTCModule.videoEffects.ProcessorProvider
import io.getstream.rnvideosample.videofilters.GrayScaleVideoFilterFactory

class VideoEffectsModule (reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return NAME;
    }

    @ReactMethod
    fun registerVideoFilters() {
        ProcessorProvider.addProcessor("grayscale", GrayScaleVideoFilterFactory())
    }

    companion object {
        private const val NAME = "VideoEffectsModule"
    }
}
