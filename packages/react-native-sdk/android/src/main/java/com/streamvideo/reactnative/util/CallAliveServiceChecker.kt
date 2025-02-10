package com.streamvideo.reactnative.util

import android.content.ComponentName
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.ReactApplicationContext

@RequiresApi(api = Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
object CallAliveServiceChecker {
    private const val NAME = "StreamVideoReactNative"

    fun isForegroundServiceDeclared(context: ReactApplicationContext): Boolean {
        val packageManager = context.packageManager
        val packageName = context.packageName // Get the package name of your app
        val componentName = ComponentName(
            packageName,
            "app.notifee.core.ForegroundService"
        ) // Use service name string

        try {
            val serviceInfo =
                packageManager.getServiceInfo(componentName, PackageManager.GET_META_DATA)

            val expectedForegroundServiceTypes =
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE or
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC or
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA or
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE

            val actualForegroundServiceType = serviceInfo.foregroundServiceType

            if (actualForegroundServiceType == expectedForegroundServiceTypes) {
                return true
            } else {
                Log.w(
                    NAME,
                    "android:foregroundServiceType does not match: expected=${
                        foregroundServiceTypeToString(
                            expectedForegroundServiceTypes
                        )
                    }, actual=${foregroundServiceTypeToString(actualForegroundServiceType)}"
                )
                return false
            }

        } catch (e: PackageManager.NameNotFoundException) {
            Log.d(NAME, "Service not found: " + e.message)
            return false // Service not declared
        }
    }

    private fun foregroundServiceTypeToString(foregroundServiceType: Int): String {
        val types = mutableListOf<String>()
        if (foregroundServiceType and ServiceInfo.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE != 0) {
            types.add("shortService")
        }
        if (foregroundServiceType and ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC != 0) {
            types.add("dataSync")
        }
        if (foregroundServiceType and ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA != 0) {
            types.add("camera")
        }
        if (foregroundServiceType and ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE != 0) {
            types.add("microphone")
        }
        if (foregroundServiceType and ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE != 0) {
            types.add("connectedDevice")
        }
        if (foregroundServiceType and ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION != 0) {
            types.add("location")
        }
        if (foregroundServiceType and ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK != 0) {
            types.add("mediaPlayback")
        }
        if (foregroundServiceType and ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION != 0) {
            types.add("mediaProjection")
        }
        if (foregroundServiceType and ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL != 0) {
            types.add("phoneCall")
        }
        if (foregroundServiceType and ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH != 0) {
            types.add("health")
        }
        if (foregroundServiceType and ServiceInfo.FOREGROUND_SERVICE_TYPE_REMOTE_MESSAGING != 0) {
            types.add("remoteMessaging")
        }
        if (foregroundServiceType and ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED != 0) {
            types.add("systemExempted")
        }
        return types.joinToString("|")
    }
}
