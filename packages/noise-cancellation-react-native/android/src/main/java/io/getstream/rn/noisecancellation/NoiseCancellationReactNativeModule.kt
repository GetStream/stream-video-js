package io.getstream.rn.noisecancellation

import android.content.pm.PackageManager
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

class NoiseCancellationReactNativeModule(reactContext: ReactApplicationContext) :
    NativeNoiseCancellationReactNativeSpec(reactContext) {

    override fun isEnabled(promise: Promise) {
        val controller = guardControllerInit(promise)
        controller?.let {
            promise.resolve(it.noiseCancellation.isEnabled())
        }
    }

    override fun setEnabled(enabled: Boolean, promise: Promise) {
        val controller = guardControllerInit(promise)
        controller?.let {
            it.noiseCancellation.setEnabled(enabled)
            promise.resolve(true)
        }
    }

    override fun deviceSupportsAdvancedAudioProcessing(promise: Promise) {
        val hasSupport = reactApplicationContext.packageManager.hasSystemFeature(PackageManager.FEATURE_AUDIO_PRO)
        promise.resolve(hasSupport)
    }

    private fun guardControllerInit(promise: Promise): NoiseCancellationAudioProcessingController? {
        val controller = NoiseCancellationReactNative.controller
        if (controller == null) {
            Log.e(NAME, "Noise cancellation is not initialized")
            promise.reject(
                "NOT_INITIALIZED",
                "Noise cancellation is not initialized. Call registerProcessor first."
            )
        }
        return controller
    }

    companion object {
        const val NAME = NativeNoiseCancellationReactNativeSpec.NAME
    }
}
