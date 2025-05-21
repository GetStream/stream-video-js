package com.streamvideo.reactnative.util

import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext


object CallAlivePermissionsHelper {
    private const val NAME = "StreamVideoReactNative"

    fun hasForegroundServicePermissionsDeclared(context: ReactApplicationContext): Boolean {
        val packageManager = context.packageManager
        val packageName = context.packageName

        try {
            val packageInfo: PackageInfo =
                packageManager.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS)
            val requestedPermissions = packageInfo.requestedPermissions

            if (requestedPermissions != null) {
                val requiredPermissions = arrayOf(
                    "android.permission.FOREGROUND_SERVICE",
                    "android.permission.FOREGROUND_SERVICE_CAMERA",
                    "android.permission.FOREGROUND_SERVICE_MICROPHONE",
                    "android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE",
                    "android.permission.FOREGROUND_SERVICE_DATA_SYNC"
                )

                val missingPermissions =
                    requiredPermissions.filterNot { requestedPermissions.contains(it) }

                if (missingPermissions.isNotEmpty()) {
                    Log.w(
                        NAME,
                        "Missing ForegroundServicePermissions: ${missingPermissions.joinToString(", ")}"
                    )
                    return false
                } else {
                    return true
                }
            }
        } catch (e: PackageManager.NameNotFoundException) {
            // do nothing, this can never happen actually
            Log.e(
                NAME,
                "Package not found: $packageName",
                e
            )
        }
        return false
    }

}
