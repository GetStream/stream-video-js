package io.getstream.rnvideosample

import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PowerModeModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    override fun getName(): String = "PowerModeModule"

    @ReactMethod
    fun isLowPowerModeEnabled(promise: Promise) {
        try {
            val lowPowerMode = Settings.Global.getInt(
                reactContext.contentResolver,
                "low_power"
            )
            promise.resolve(lowPowerMode == 1)
        } catch (e: Settings.SettingNotFoundException) {
            promise.reject("ERROR", e.message)
        }
    }
}