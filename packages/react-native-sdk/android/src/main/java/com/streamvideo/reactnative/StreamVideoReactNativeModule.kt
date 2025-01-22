package com.streamvideo.reactnative

import android.app.AppOpsManager
import android.app.PictureInPictureParams
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.content.pm.PackageManager.NameNotFoundException
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.Process
import android.util.Log
import android.util.Rational
import androidx.annotation.RequiresApi
import com.facebook.react.ReactActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.streamvideo.reactnative.util.RingtoneUtil


class StreamVideoReactNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return NAME;
    }

    private var thermalStatusListener: PowerManager.OnThermalStatusChangedListener? = null

    override fun initialize() {
        super.initialize()
        StreamVideoReactNative.addPipListener { isInPictureInPictureMode, newConfig ->
            // Send event to JavaScript
            reactApplicationContext.getJSModule(
                RCTDeviceEventEmitter::class.java
            ).emit(PIP_CHANGE_EVENT, isInPictureInPictureMode)
            // inform the activity
            if (isInPictureInPictureMode && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && hasPiPSupport()) {
                (reactApplicationContext.currentActivity as? ReactActivity)?.let { activity ->
                    try {
                        val params = getPiPParams()
                        val aspect =
                            if (newConfig.orientation == ActivityInfo.SCREEN_ORIENTATION_PORTRAIT) {
                                Rational(9, 16)
                            } else {
                                Rational(16, 9)
                            }
                        params.setAspectRatio(aspect)
                        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                            // this platform doesn't support autoEnterEnabled
                            // so we manually enter here
                            activity.enterPictureInPictureMode(params.build())
                        } else {
                            activity.setPictureInPictureParams(params.build())
                        }
                        // NOTE: workaround - on PiP mode, android goes to "paused but can render" state
                        // RN pauses rendering in paused mode, so we instruct it to resume here
                        reactApplicationContext?.onHostResume(activity)
                    } catch (e: IllegalStateException) {
                        Log.d(NAME, "Skipping Picture-in-Picture mode. Its not enabled for activity")
                    }
                }
            }
        }
        
        val filter = IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED)
        reactApplicationContext.registerReceiver(powerReceiver, filter)
    }

    @ReactMethod
    fun getDefaultRingtoneUrl(promise: Promise) {
        val defaultRingtoneUri: Uri? =
            RingtoneUtil.getActualDefaultRingtoneUri(reactApplicationContext);
        if (defaultRingtoneUri != null) {
            promise.resolve(defaultRingtoneUri.toString());
        } else {
            promise.reject(NAME, "Cannot get default ringtone in Android - check native logs for more info");
        }
    }

    @ReactMethod
    fun isInPiPMode(promise: Promise) {
        val inPictureInPictureMode: Boolean? =
            reactApplicationContext.currentActivity?.isInPictureInPictureMode
        promise.resolve(inPictureInPictureMode)
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
        StreamVideoReactNative.canAutoEnterPictureInPictureMode = value
        if (!hasPiPSupport() || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
        val activity = reactApplicationContext!!.currentActivity!!
        try {
            if (value) {
                activity.setPictureInPictureParams(getPiPParams().build())
            // NOTE: for SDK_INT < Build.VERSION_CODES.S
            // onUserLeaveHint from Activity is used, SDK cant directly use it
            // onUserLeaveHint will call the PiP listener and we call enterPictureInPictureMode there
            } else {
                val params = PictureInPictureParams.Builder()
                params.setAutoEnterEnabled(false)
                activity.setPictureInPictureParams(params.build())
            }
        } catch (e: IllegalStateException) {
            Log.d(NAME, "Skipping Picture-in-Picture mode. Its not enabled for activity")
        }
    }

    @ReactMethod
    fun startThermalStatusUpdates(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val powerManager = reactApplicationContext.getSystemService(ReactApplicationContext.POWER_SERVICE) as PowerManager
                
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
            val powerManager = reactApplicationContext.getSystemService(ReactApplicationContext.POWER_SERVICE) as PowerManager
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
                val powerManager = reactApplicationContext.getSystemService(ReactApplicationContext.POWER_SERVICE) as PowerManager
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
        val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
        val isLowPowerMode = powerManager.isPowerSaveMode
        reactApplicationContext
            .getJSModule(RCTDeviceEventEmitter::class.java)
            .emit("isLowPowerModeEnabled", isLowPowerMode)
    }

    @ReactMethod
    fun isLowPowerModeEnabled(promise: Promise) {
        try {
            val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            promise.resolve(powerManager.isPowerSaveMode)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun hasPiPSupport(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && reactApplicationContext.packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
            val appOps =
                reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val packageName = reactApplicationContext.packageName
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_PICTURE_IN_PICTURE, Process.myUid(), packageName) == AppOpsManager.MODE_ALLOWED
            } else {
                appOps.checkOpNoThrow(AppOpsManager.OPSTR_PICTURE_IN_PICTURE, Process.myUid(), packageName) == AppOpsManager.MODE_ALLOWED
            }
        } else {
            false
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun getPiPParams(): PictureInPictureParams.Builder {
        val activity = reactApplicationContext!!.currentActivity!!
        val currentOrientation = activity.resources.configuration.orientation

        val aspect =
            if (currentOrientation == ActivityInfo.SCREEN_ORIENTATION_PORTRAIT) {
                Rational(9, 16)
            } else {
                Rational(16, 9)
            }

        val params = PictureInPictureParams.Builder()
        params.setAspectRatio(aspect).apply {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                setAutoEnterEnabled(true)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                setTitle("Video Player")
                setSeamlessResizeEnabled(false)
            }
        }
        return params
    }

    companion object {
        private const val NAME = "StreamVideoReactNative"
        private const val PIP_CHANGE_EVENT = NAME + "_PIP_CHANGE_EVENT"
    }
}
