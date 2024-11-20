package io.getstream.rnvideosample

import android.os.Build
import android.os.PowerManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.modules.core.DeviceEventManagerModule

class ThermalModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ThermalModule"

    private var thermalStatusListener: PowerManager.OnThermalStatusChangedListener? = null

    @ReactMethod
    fun startThermalStatusUpdates(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val powerManager = reactContext.getSystemService(ReactApplicationContext.POWER_SERVICE) as PowerManager
                
                val listener = PowerManager.OnThermalStatusChangedListener { status ->
                    val thermalStatus = when (status) {
                        PowerManager.THERMAL_STATUS_NONE -> "NONE"
                        PowerManager.THERMAL_STATUS_LIGHT -> "LIGHT"
                        PowerManager.THERMAL_STATUS_MODERATE -> "MODERATE"
                        PowerManager.THERMAL_STATUS_SEVERE -> "SEVERE"
                        PowerManager.THERMAL_STATUS_CRITICAL -> "CRITICAL"
                        PowerManager.THERMAL_STATUS_EMERGENCY -> "EMERGENCY"
                        PowerManager.THERMAL_STATUS_SHUTDOWN -> "SHUTDOWN"
                        else -> "UNKNOWN"
                    }
                    
                    reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("onThermalStatusChanged", thermalStatus)
                }
                
                thermalStatusListener = listener
                powerManager.addThermalStatusListener(listener)
                // Get initial status
                getCurrentThermalStatus(promise)
            } else {
                promise.resolve("NOT_SUPPORTED")
            }
        } catch (e: Exception) {
            promise.reject("THERMAL_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopThermalStatusUpdates() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val powerManager = reactContext.getSystemService(ReactApplicationContext.POWER_SERVICE) as PowerManager
            // Store the current listener in a local val for safe null checking
            val currentListener = thermalStatusListener
            if (currentListener != null) {
                powerManager.removeThermalStatusListener(currentListener)
                thermalStatusListener = null
            }
        }
    }

    override fun getConstants(): Map<String, Any> {
        return mapOf(
            "THERMAL_EVENT" to "onThermalStatusChanged"
        )
    }

    // TODO: remove if this is not needed
    @ReactMethod
    fun getCurrentThermalStatus(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val powerManager = reactContext.getSystemService(ReactApplicationContext.POWER_SERVICE) as PowerManager
                val status = powerManager.currentThermalStatus
                val thermalStatus = when (status) {
                    PowerManager.THERMAL_STATUS_NONE -> "NONE"
                    PowerManager.THERMAL_STATUS_LIGHT -> "LIGHT"
                    PowerManager.THERMAL_STATUS_MODERATE -> "MODERATE"
                    PowerManager.THERMAL_STATUS_SEVERE -> "SEVERE"
                    PowerManager.THERMAL_STATUS_CRITICAL -> "CRITICAL"
                    PowerManager.THERMAL_STATUS_EMERGENCY -> "EMERGENCY"
                    PowerManager.THERMAL_STATUS_SHUTDOWN -> "SHUTDOWN"
                    else -> "UNKNOWN"
                }
                promise.resolve(thermalStatus)
            } else {
                promise.resolve("NOT_SUPPORTED")
            }
        } catch (e: Exception) {
            promise.reject("THERMAL_ERROR", e.message)
        }
    }
}