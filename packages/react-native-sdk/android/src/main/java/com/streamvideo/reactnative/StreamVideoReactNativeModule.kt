package com.streamvideo.reactnative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Bitmap
import android.net.Uri
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.oney.WebRTCModule.WebRTCModule
import com.streamvideo.reactnative.util.CallAlivePermissionsHelper
import com.streamvideo.reactnative.util.CallAliveServiceChecker
import com.streamvideo.reactnative.util.PiPHelper
import com.streamvideo.reactnative.util.RingtoneUtil
import com.streamvideo.reactnative.util.YuvFrame
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.webrtc.VideoSink
import org.webrtc.VideoTrack
import java.io.ByteArrayOutputStream


class StreamVideoReactNativeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return NAME
    }

    private var thermalStatusListener: PowerManager.OnThermalStatusChangedListener? = null

    private var batteryChargingStateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent == null) return
            val result = getBatteryStatusFromIntent(intent)
            reactApplicationContext
                .getJSModule(RCTDeviceEventEmitter::class.java)
                .emit("chargingStateChanged", result)
        }
    }

    override fun initialize() {
        super.initialize()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            StreamVideoReactNative.addPipListener { isInPictureInPictureMode, newConfig ->
                PiPHelper.onPiPChange(reactApplicationContext, isInPictureInPictureMode, newConfig)
            }
        }

        reactApplicationContext.registerReceiver(
            powerReceiver,
            IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED)
        )

        reactApplicationContext.registerReceiver(batteryChargingStateReceiver, IntentFilter().apply {
            addAction(Intent.ACTION_POWER_CONNECTED)
            addAction(Intent.ACTION_POWER_DISCONNECTED)
        })
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
        reactApplicationContext.unregisterReceiver(batteryChargingStateReceiver)
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
    fun exitPipMode(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val success = PiPHelper.exitPipMode(reactApplicationContext)
            promise.resolve(success)
        } else {
            promise.resolve(false)
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

    private fun getVideoTrackForStreamURL(streamURL: String): VideoTrack {
        var videoTrack: VideoTrack? = null


        val module = reactApplicationContext.getNativeModule(WebRTCModule::class.java)
        val stream = module!!.getStreamForReactTag(streamURL)

        if (stream != null) {
            val videoTracks = stream.videoTracks

            if (videoTracks.isNotEmpty()) {
                videoTrack = videoTracks[0]
            }
        }

        if (videoTrack != null) {
            return videoTrack
        }

        throw Exception("No video stream for react tag: $streamURL")
    }

    @ReactMethod
    fun takeScreenshot(streamURL: String?, promise: Promise) {
        if (streamURL == null) {
            promise.reject("ERROR", "Null stream URL provided")
            return
        }
        try {
            val track = getVideoTrackForStreamURL(streamURL)
            var screenshotSink: VideoSink? = null
            screenshotSink = VideoSink { videoFrame -> // Remove the sink before asap
                // to avoid processing multiple frames.
                CoroutineScope(Dispatchers.IO).launch {
                    // This has to be launched asynchronously - removing the sink on the
                    // same thread as the videoframe is delivered will lead to a deadlock
                    // (needs investigation why)
                    track.removeSink(screenshotSink)
                }

                videoFrame.retain()
                val bitmap = YuvFrame.bitmapFromVideoFrame(videoFrame)
                videoFrame.release()

                bitmap?.let {
                    val byteArrayOutputStream = ByteArrayOutputStream()
                    it.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream)
                    val base64Encoded = Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.DEFAULT)
                    promise.resolve(base64Encoded)
                }
            }
            track.addSink(screenshotSink)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getBatteryState(promise: Promise) {
        try {
            val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val batteryStatus = reactApplicationContext.registerReceiver(null, filter)
            if (batteryStatus == null) {
                return promise.reject("BATTERY_ERROR", "Failed to get battery status")
            }

            promise.resolve(getBatteryStatusFromIntent(batteryStatus))
        } catch (e: Exception) {
            promise.reject("BATTERY_ERROR", "Failed to get charging state", e)
        }
    }

    private fun getBatteryStatusFromIntent(intent: Intent): WritableMap {
        val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)

        val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                status == BatteryManager.BATTERY_STATUS_FULL

        val batteryLevel = if (level >= 0 && scale > 0) {
            (level.toFloat() / scale.toFloat()) * 100
        } else -1f

        return Arguments.createMap().apply {
            putBoolean("charging", isCharging)
            putInt("level", batteryLevel.toInt())
        }
    }

    companion object {
        private const val NAME = "StreamVideoReactNative"
    }
}
