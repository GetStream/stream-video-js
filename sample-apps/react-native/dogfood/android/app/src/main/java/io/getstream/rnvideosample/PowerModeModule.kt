package io.getstream.rnvideosample

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.PowerManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class PowerModeModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val powerReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == PowerManager.ACTION_POWER_SAVE_MODE_CHANGED) {
                sendPowerModeEvent()
            }
        }
    }

    override fun getName(): String = "PowerModeModule"

    override fun initialize() {
        super.initialize()
        val filter = IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED)
        reactContext.registerReceiver(powerReceiver, filter)
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        reactContext.unregisterReceiver(powerReceiver)
    }

    private fun sendPowerModeEvent() {
        val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
        val isLowPowerMode = powerManager.isPowerSaveMode
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("powerModeChanged", isLowPowerMode)
    }

    @ReactMethod
    fun isLowPowerModeEnabled(promise: Promise) {
        try {
            val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            promise.resolve(powerManager.isPowerSaveMode)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    override fun getConstants(): Map<String, Any> {
        return mapOf("POWER_MODE_EVENT" to "powerModeChanged")
    }
}