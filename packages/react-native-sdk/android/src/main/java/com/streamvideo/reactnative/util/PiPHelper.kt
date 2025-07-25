package com.streamvideo.reactnative.util

import android.app.Activity
import android.app.AppOpsManager
import android.app.PictureInPictureParams
import android.content.Context
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.os.Build
import android.os.Process
import android.util.Log
import android.util.Rational
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.streamvideo.reactnative.StreamVideoReactNative

@RequiresApi(api = Build.VERSION_CODES.O)
object PiPHelper {
    private const val NAME = "StreamVideoReactNative"
    private const val PIP_CHANGE_EVENT =  NAME + "_PIP_CHANGE_EVENT"

    fun onPiPChange(
        reactApplicationContext: ReactApplicationContext,
        isInPictureInPictureMode: Boolean,
        newConfig: Configuration
    ) {
        // Send event to JavaScript
        reactApplicationContext.getJSModule(
            RCTDeviceEventEmitter::class.java
        ).emit(PIP_CHANGE_EVENT, isInPictureInPictureMode)
        // inform activity
        reactApplicationContext.currentActivity?.let { activity ->
            if (isInPictureInPictureMode && hasPiPSupport(reactApplicationContext)) {
                try {
                    val params = getPiPParams(activity)
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
                    reactApplicationContext.onHostResume(activity)
                } catch (e: IllegalStateException) {
                    Log.d(
                        NAME,
                        "Skipping Picture-in-Picture mode. Its not enabled for activity"
                    )
                }
            }
        }
    }

    fun canAutoEnterPipMode(reactApplicationContext: ReactApplicationContext, value: Boolean) {
        StreamVideoReactNative.canAutoEnterPictureInPictureMode = value
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
        reactApplicationContext.currentActivity?.let { activity ->
            try {
                val builder = getPiPParams(activity)
                if (value) {
                    activity.setPictureInPictureParams(builder.build())
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
    }

    fun isInPiPMode(reactApplicationContext: ReactApplicationContext): Boolean? {
        return reactApplicationContext.currentActivity?.isInPictureInPictureMode
    }

    fun exitPipMode(reactApplicationContext: ReactApplicationContext): Boolean {
        return try {
            reactApplicationContext.currentActivity?.let { activity ->
                if (activity.isInPictureInPictureMode) {
                    // Move the task to back to exit PiP mode and return to normal app view
                    activity.moveTaskToBack(false)
                    true
                } else {
                    // Not in PiP mode, so nothing to do
                    false
                }
            } ?: false
        } catch (e: Exception) {
            Log.e(NAME, "Failed to exit Picture-in-Picture mode", e)
            false
        }
    }

    private fun getPiPParams(activity: Activity): PictureInPictureParams.Builder {
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

    private fun hasPiPSupport(reactApplicationContext: ReactApplicationContext): Boolean {
        return if (reactApplicationContext.packageManager.hasSystemFeature(
                PackageManager.FEATURE_PICTURE_IN_PICTURE
            )
        ) {
            val appOps =
                reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val packageName = reactApplicationContext.packageName
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_PICTURE_IN_PICTURE,
                    Process.myUid(),
                    packageName
                ) == AppOpsManager.MODE_ALLOWED
            } else {
                appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_PICTURE_IN_PICTURE,
                    Process.myUid(),
                    packageName
                ) == AppOpsManager.MODE_ALLOWED
            }
        } else {
            false
        }
    }
}
