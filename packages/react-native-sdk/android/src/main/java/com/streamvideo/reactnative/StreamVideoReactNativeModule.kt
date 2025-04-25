package com.streamvideo.reactnative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.streamvideo.reactnative.util.CallAlivePermissionsHelper
import com.streamvideo.reactnative.util.CallAliveServiceChecker
import com.streamvideo.reactnative.util.PiPHelper
import com.streamvideo.reactnative.util.RingtoneUtil


class StreamVideoReactNativeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return NAME
    }

    private var thermalStatusListener: PowerManager.OnThermalStatusChangedListener? = null

    override fun initialize() {
        super.initialize()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            StreamVideoReactNative.addPipListener { isInPictureInPictureMode, newConfig ->
                PiPHelper.onPiPChange(reactApplicationContext, isInPictureInPictureMode, newConfig)
            }
        }
        val filter = IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED)
        reactApplicationContext.registerReceiver(powerReceiver, filter)
    }

    @ReactMethod
    fun getDefaultRingtoneUrl(promise: Promise) {
        val defaultRingtoneUri: Uri? =
            RingtoneUtil.getActualDefaultRingtoneUri(reactApplicationContext)
        if (defaultRingtoneUri != null) {
            promise.resolve(defaultRingtoneUri.toString())
        } else {
            promise.reject(
                NAME,
                "Cannot get default ringtone in Android - check native logs for more info"
            )
        }
    }

    @ReactMethod
    fun isInPiPMode(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            promise.resolve(PiPHelper.isInPiPMode(reactApplicationContext))
        } else {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun isCallAliveConfigured(promise: Promise) {
        val permissionsDeclared =
            CallAlivePermissionsHelper.hasForegroundServicePermissionsDeclared(reactApplicationContext)
        if (!permissionsDeclared) {
            promise.resolve(false)
            return
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            val isForegroundServiceDeclared = CallAliveServiceChecker.isForegroundServiceDeclared(reactApplicationContext)
            promise.resolve(isForegroundServiceDeclared)
        } else {
            promise.resolve(true)
        }
    }

    @Suppress("UNUSED_PARAMETER")
    @ReactMethod
    fun addListener(eventName: String?) {
    }

    @Suppress("UNUSED_PARAMETER")
    @ReactMethod
    fun removeListeners(count: Int) {
    }

    override fun invalidate() {
        StreamVideoReactNative.clearPipListeners()
        reactApplicationContext.unregisterReceiver(powerReceiver)
        stopThermalStatusUpdates()
        super.invalidate()
    }

    @ReactMethod
    fun canAutoEnterPipMode(value: Boolean) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            PiPHelper.canAutoEnterPipMode(reactApplicationContext, value)
        }
    }

    @ReactMethod
    fun startThermalStatusUpdates(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val powerManager =
                    reactApplicationContext.getSystemService(ReactApplicationContext.POWER_SERVICE) as PowerManager

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

                    reactApplicationContext
                        .getJSModule(RCTDeviceEventEmitter::class.java)
                        .emit("thermalStateDidChange", thermalStatus)
                }

                thermalStatusListener = listener
                powerManager.addThermalStatusListener(listener)
                // Get initial status
                currentThermalState(promise)
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
            val powerManager =
                reactApplicationContext.getSystemService(ReactApplicationContext.POWER_SERVICE) as PowerManager
            // Store the current listener in a local val for safe null checking
            val currentListener = thermalStatusListener
            if (currentListener != null) {
                powerManager.removeThermalStatusListener(currentListener)
                thermalStatusListener = null
            }
        }
    }

    @ReactMethod
    fun currentThermalState(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val powerManager =
                    reactApplicationContext.getSystemService(ReactApplicationContext.POWER_SERVICE) as PowerManager
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

    private val powerReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == PowerManager.ACTION_POWER_SAVE_MODE_CHANGED) {
                sendPowerModeEvent()
            }
        }
    }

    private fun sendPowerModeEvent() {
        val powerManager =
            reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
        val isLowPowerMode = powerManager.isPowerSaveMode
        reactApplicationContext
            .getJSModule(RCTDeviceEventEmitter::class.java)
            .emit("isLowPowerModeEnabled", isLowPowerMode)
    }

    @ReactMethod
    fun isLowPowerModeEnabled(promise: Promise) {
        try {
            val powerManager =
                reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            promise.resolve(powerManager.isPowerSaveMode)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    companion object {
        private const val NAME = "StreamVideoReactNative"
    }
}
