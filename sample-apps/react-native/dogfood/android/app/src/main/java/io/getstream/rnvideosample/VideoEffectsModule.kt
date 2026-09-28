package io.getstream.rnvideosample

import com.facebook.react.bridge.ReactApplicationContext
import com.oney.WebRTCModule.videoEffects.ProcessorProvider
import io.getstream.rnvideosample.videofilters.GrayScaleVideoFilterFactory

class VideoEffectsModule(reactContext: ReactApplicationContext) :
    NativeVideoEffectsModuleSpec(reactContext) {

    override fun registerVideoFilters(): Boolean {
        ProcessorProvider.addProcessor("grayscale", GrayScaleVideoFilterFactory())
        return true
    }

    companion object {
        const val NAME = NativeVideoEffectsModuleSpec.NAME
    }
}
