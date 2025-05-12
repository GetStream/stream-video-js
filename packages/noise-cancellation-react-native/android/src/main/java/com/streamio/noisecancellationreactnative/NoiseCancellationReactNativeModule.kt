package com.streamio.noisecancellationreactnative

import android.content.pm.PackageManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.util.Log

class NoiseCancellationReactNativeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return NAME
    }

    @ReactMethod
    fun isEnabled(promise: Promise) {
        val controller = guardControllerInit(promise)
        controller?.let {
            promise.resolve(it.noiseCancellation.isEnabled())
        }
    }

    @ReactMethod
    fun setEnabled(enabled: Boolean, promise: Promise) {
        val controller = guardControllerInit(promise)
        controller?.let {
            it.noiseCancellation.setEnabled(enabled)
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun deviceSupportsAdvancedAudioProcessing(promise: Promise) {
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
        const val NAME = "NoiseCancellationReactNative"
    }
}
