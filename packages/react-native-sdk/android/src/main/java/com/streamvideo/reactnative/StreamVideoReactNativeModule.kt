package com.streamvideo.reactnative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Bitmap
import android.graphics.Canvas
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.util.Base64
import android.util.Log
import android.view.View
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.fabric.FabricUIManager
import com.streamvideo.reactnative.util.CallAlivePermissionsHelper
import com.streamvideo.reactnative.util.CallAliveServiceChecker
import com.streamvideo.reactnative.util.PiPHelper
import com.streamvideo.reactnative.util.RingtoneUtil
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.Executor
import java.util.concurrent.Executors


class StreamVideoReactNativeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return NAME
    }

    private var thermalStatusListener: PowerManager.OnThermalStatusChangedListener? = null
    private val executor: Executor = Executors.newSingleThreadExecutor()

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

    @ReactMethod
    fun captureRef(tagFromJs: Double?, options: ReadableMap, promise: Promise) {
        try {
            val tag = tagFromJs?.toInt() ?: -1
            if (tag <= 0) {
                promise.reject("ERROR_INVALID_VIEW_TAG", "Invalid view tag: $tag")
                return
            }
            
            // Default format is PNG
            val format = if (options.hasKey("format")) options.getString("format") ?: "png" else "png"
            // Default quality is 1.0 (high quality)
            val quality = if (options.hasKey("quality")) options.getDouble("quality") else 1.0
            
            // Get width and height if specified
            val width = if (options.hasKey("width")) options.getInt("width") else null
            val height = if (options.hasKey("height")) options.getInt("height") else null
            
            reactApplicationContext.runOnUiQueueThread {
                try {
                    // First try to access ReactRootView directly from activity
                    val activity = reactApplicationContext.currentActivity
                    if (activity != null) {
                        val rootView = activity.findViewById<View>(android.R.id.content)
                        val reactRootView = findReactRootView(rootView)
                        
                        if (reactRootView != null) {
                            // Now try to find the view using ReactNative tag
                            val targetView = findReactNativeViewByTag(reactRootView, tag)
                            
                            if (targetView != null) {
                                // Found the view, proceed with capture
                                val bitmap = if (width != null && height != null) {
                                    captureViewToBitmap(targetView, width, height)
                                } else {
                                    captureViewToBitmap(targetView)
                                }
                                
                                if (bitmap == null) {
                                    promise.reject("ERROR_CAPTURE_FAILED", "Failed to capture view")
                                    return@runOnUiQueueThread
                                }
                                
                                // Convert bitmap to base64
                                val base64 = bitmapToBase64(bitmap, format, quality.toFloat())
                                if (base64 != null) {
                                    promise.resolve(base64)
                                } else {
                                    promise.reject("ERROR_ENCODING_FAILED", "Failed to encode bitmap to base64")
                                }
                                
                                // Clean up
                                bitmap.recycle()
                                return@runOnUiQueueThread
                            } else {
                                Log.d(NAME, "View with tag $tag not found directly. Trying fallback methods...")
                            }
                        }
                    }
                    
                    // Fallback to legacy UIManager approach
                    val uiManager = reactApplicationContext.getNativeModule(UIManagerModule::class.java)
                    if (uiManager != null) {
                        processViewCapture(uiManager, tag, width, height, format, quality, promise)
                    } else {
                        // If all else fails, try finding the view recursively through the entire hierarchy
                        val rootView = reactApplicationContext.currentActivity?.window?.decorView
                        if (rootView != null) {
                            val targetView = findViewWithReactTag(rootView, tag)
                            if (targetView != null) {
                                // Found the view, proceed with capture
                                val bitmap = if (width != null && height != null) {
                                    captureViewToBitmap(targetView, width, height)
                                } else {
                                    captureViewToBitmap(targetView)
                                }
                                
                                if (bitmap == null) {
                                    promise.reject("ERROR_CAPTURE_FAILED", "Failed to capture view")
                                    return@runOnUiQueueThread
                                }
                                
                                // Convert bitmap to base64
                                val base64 = bitmapToBase64(bitmap, format, quality.toFloat())
                                if (base64 != null) {
                                    promise.resolve(base64)
                                } else {
                                    promise.reject("ERROR_ENCODING_FAILED", "Failed to encode bitmap to base64")
                                }
                                
                                // Clean up
                                bitmap.recycle()
                            } else {
                                promise.reject("ERROR_VIEW_NOT_FOUND", "Could not find view with tag $tag using any method")
                            }
                        } else {
                            promise.reject("ERROR_NO_ROOT_VIEW", "No root view found")
                        }
                    }
                } catch (e: Exception) {
                    Log.e(NAME, "Error processing capture", e)
                    promise.reject("ERROR_CAPTURE_PROCESS", e.message)
                }
            }
        } catch (e: Exception) {
            Log.e(NAME, "Failed to start snapshot process", e)
            promise.reject("ERROR_CAPTURE_FAILED", "Failed to start capture: ${e.message}")
        }
    }
    
    // Helper method to process the view capture with a valid UIManager
    private fun processViewCapture(
        uiManager: UIManagerModule,
        tag: Int,
        width: Int?,
        height: Int?,
        format: String, 
        quality: Double,
        promise: Promise
    ) {
        uiManager.addUIBlock { nativeViewHierarchyManager ->
            try {
                // Get the view by tag
                val view = nativeViewHierarchyManager.resolveView(tag)
                
                // Capture the view as a bitmap
                val bitmap = if (width != null && height != null) {
                    captureViewToBitmap(view, width, height)
                } else {
                    captureViewToBitmap(view)
                }
                
                if (bitmap == null) {
                    promise.reject("ERROR_CAPTURE_FAILED", "Failed to capture view")
                    return@addUIBlock
                }
                
                // Convert bitmap to base64
                val base64 = bitmapToBase64(bitmap, format, quality.toFloat())
                if (base64 != null) {
                    promise.resolve(base64)
                } else {
                    promise.reject("ERROR_ENCODING_FAILED", "Failed to encode bitmap to base64")
                }
                
                // Clean up
                bitmap.recycle()
                
            } catch (e: Exception) {
                Log.e(NAME, "Error capturing view", e)
                promise.reject("ERROR_CAPTURE_FAILED", e.message)
            }
        }
    }
    
    // Helper method to capture a view to a bitmap
    private fun captureViewToBitmap(view: View, width: Int? = null, height: Int? = null): Bitmap? {
        try {
            val w = width ?: view.width
            val h = height ?: view.height
            
            if (w <= 0 || h <= 0) {
                Log.e(NAME, "Invalid view dimensions: $w x $h")
                return null
            }
            
            val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            
            // Save the view's drawing cache state
            val wasDrawingCacheEnabled = view.isDrawingCacheEnabled
            
            if (!wasDrawingCacheEnabled) {
                view.isDrawingCacheEnabled = true
            }
            
            // Draw the view onto the canvas
            view.draw(canvas)
            
            // Restore drawing cache state
            if (!wasDrawingCacheEnabled) {
                view.isDrawingCacheEnabled = false
            }
            
            return bitmap
        } catch (e: Exception) {
            Log.e(NAME, "Error capturing view to bitmap", e)
            return null
        }
    }
    
    // Helper method to convert a bitmap to base64
    private fun bitmapToBase64(bitmap: Bitmap, format: String, quality: Float): String? {
        return try {
            val outputStream = ByteArrayOutputStream()
            val compressFormat = when (format) {
                "jpg", "jpeg" -> Bitmap.CompressFormat.JPEG
                "webp" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        Bitmap.CompressFormat.WEBP_LOSSY
                    } else {
                        @Suppress("DEPRECATION")
                        Bitmap.CompressFormat.WEBP
                    }
                }
                else -> Bitmap.CompressFormat.PNG
            }
            
            bitmap.compress(compressFormat, (quality * 100).toInt(), outputStream)
            Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
        } catch (e: Exception) {
            Log.e(NAME, "Error converting bitmap to base64", e)
            null
        }
    }

    // Find the React root view from any view
    private fun findReactRootView(view: View?): View? {
        if (view == null) return null
        
        // Check if this is a ReactRootView
        if (view.javaClass.name.contains("ReactRootView")) {
            return view
        }
        
        // If this is a ViewGroup, search its children
        if (view is android.view.ViewGroup) {
            for (i in 0 until view.childCount) {
                val result = findReactRootView(view.getChildAt(i))
                if (result != null) {
                    return result
                }
            }
        }
        
        return null
    }

    // Find React Native view by tag, considering both legacy and Fabric
    private fun findReactNativeViewByTag(rootView: View, tag: Int): View? {
        // Try to use the correct method based on the type
        try {
            // First approach: look for a direct method to get view by react tag
            val method = rootView.javaClass.getDeclaredMethod("getViewByReactTag", Int::class.java)
            method.isAccessible = true
            return method.invoke(rootView, tag) as? View
        } catch (e: Exception) {
            Log.d(NAME, "getViewByReactTag method not found, trying alternative approaches")
        }
        
        // Second approach: search recursively
        return findViewWithReactTag(rootView, tag)
    }

    // Comprehensive method to find views with React tags
    private fun findViewWithReactTag(view: View?, tag: Int): View? {
        if (view == null) return null
        
        // Check different tag properties that React Native might use
        // 1. Check standard tag property
        if (view.tag is Number && (view.tag as Number).toInt() == tag) {
            return view
        }
        
        // 2. Check for "reactTag" field via reflection
        try {
            val field = view.javaClass.getDeclaredField("reactTag")
            field.isAccessible = true
            val reactTag = field.get(view)
            if (reactTag is Number && reactTag.toInt() == tag) {
                return view
            }
        } catch (e: Exception) {
            // Field doesn't exist, continue
        }
        
        // 3. Check for id that matches tag
        if (view.id == tag) {
            return view
        }
        
        // 4. Check for tag stored in view's tag map (Fabric might use this)
        try {
            val method = view.javaClass.getDeclaredMethod("getTag", String::class.java)
            method.isAccessible = true
            val reactTag = method.invoke(view, "reactTag")
            if (reactTag is Number && reactTag.toInt() == tag) {
                return view
            }
        } catch (e: Exception) {
            // Method doesn't exist, continue
        }
        
        // If this is a ViewGroup, search its children
        if (view is android.view.ViewGroup) {
            for (i in 0 until view.childCount) {
                val result = findViewWithReactTag(view.getChildAt(i), tag)
                if (result != null) {
                    return result
                }
            }
        }
        
        return null
    }

    companion object {
        private const val NAME = "StreamVideoReactNative"
    }
}
