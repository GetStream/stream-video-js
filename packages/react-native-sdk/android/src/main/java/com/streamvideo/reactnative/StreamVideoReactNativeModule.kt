package com.streamvideo.reactnative

import android.app.AppOpsManager
import android.app.PictureInPictureParams
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import android.util.Rational
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.facebook.react.bridge.Promise;


class StreamVideoReactNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return NAME;
    }

    private var isInPictureInPictureMode = false

    override fun initialize() {
        super.initialize()
        StreamVideoReactNative.pipListeners.add {isInPictureInPictureMode ->
            reactApplicationContext.getJSModule(
                RCTDeviceEventEmitter::class.java
            ).emit(PIP_CHANGE_EVENT, isInPictureInPictureMode)
            this.isInPictureInPictureMode = isInPictureInPictureMode
        }
    }

    @ReactMethod
    fun isInPiPMode(promise: Promise) {
        promise.resolve(isInPictureInPictureMode);
    }

    @ReactMethod
    fun addListener(eventName: String?) {
    }

    @ReactMethod
    fun removeListeners(count: Int) {
    }

    @RequiresApi(Build.VERSION_CODES.O)
    @ReactMethod
    fun enterPipMode(width: Int, height: Int) {
        if (hasPermission()) {
            val width1 = if (width > 0) width else 480
            val height1 = if (height > 0) height else 640
            val ratio = Rational(width1, height1)
            val pipBuilder = PictureInPictureParams.Builder()
            pipBuilder.setAspectRatio(ratio)
            reactApplicationContext!!.currentActivity!!.enterPictureInPictureMode(pipBuilder.build())
        }
    }

    override fun onCatalystInstanceDestroy() {
        StreamVideoReactNative.pipListeners.clear()
        super.onCatalystInstanceDestroy()
    }

    @ReactMethod
    fun canAutoEnterPipMode(value: Boolean) {
        StreamVideoReactNative.canAutoEnterPictureInPictureMode = value
    }

    private fun hasPermission(): Boolean {
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

    companion object {
        private const val NAME = "StreamVideoReactNative"
        private const val PIP_CHANGE_EVENT = NAME + "_PIP_CHANGE_EVENT"
    }
}
