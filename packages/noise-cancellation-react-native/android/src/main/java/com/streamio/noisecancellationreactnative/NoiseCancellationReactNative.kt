package com.streamio.noisecancellationreactnative

import android.content.Context
import android.util.Log
import com.oney.WebRTCModule.WebRTCModuleOptions

object NoiseCancellationReactNative {

    private const val TAG = "NoiseCancellationReactNative"
    var controller: NoiseCancellationAudioProcessingController? = null

    @JvmStatic
    fun registerProcessor(applicationContext: Context) {
        try {
            if (controller != null) {
                Log.w(TAG, "Noise cancellation processor is already registered")
                return
            }
            controller = NoiseCancellationAudioProcessingController(applicationContext)
            WebRTCModuleOptions.getInstance().audioProcessingFactoryProvider = controller
            Log.d(TAG, "Noise cancellation processor registered successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize noise cancellation", e)
        }
    }
}
