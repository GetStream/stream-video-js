package io.getstream.rn.noisecancellation

import android.content.pm.PackageManager
import com.facebook.react.bridge.ReactApplicationContext

class NoiseCancellationReactNativeModule(reactContext: ReactApplicationContext) :
    NativeNoiseCancellationReactNativeSpec(reactContext) {

    override fun isEnabled(): Boolean =
        NoiseCancellationReactNative.controller?.noiseCancellation?.isEnabled() ?: false

    override fun setEnabled(enabled: Boolean): Boolean {
        requireController().noiseCancellation.setEnabled(enabled)
        return true
    }

    override fun deviceSupportsAdvancedAudioProcessing(): Boolean =
        reactApplicationContext.packageManager.hasSystemFeature(PackageManager.FEATURE_AUDIO_PRO)

    private fun requireController(): NoiseCancellationAudioProcessingController =
        checkNotNull(NoiseCancellationReactNative.controller) {
            "NOT_INITIALIZED: Noise cancellation is not initialized. Call registerProcessor first."
        }

    companion object {
        const val NAME = NativeNoiseCancellationReactNativeSpec.NAME
    }
}
