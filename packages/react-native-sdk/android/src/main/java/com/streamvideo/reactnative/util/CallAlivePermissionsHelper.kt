package com.streamvideo.reactnative.util

import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log


object CallAlivePermissionsHelper {
    private const val NAME = "StreamVideoReactNative"

    const val PERMISSION_FOREGROUND_SERVICE = "android.permission.FOREGROUND_SERVICE"
    const val PERMISSION_MEDIA_PLAYBACK =
        "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK"
    const val PERMISSION_CAMERA = "android.permission.FOREGROUND_SERVICE_CAMERA"
    const val PERMISSION_MICROPHONE = "android.permission.FOREGROUND_SERVICE_MICROPHONE"

    /**
     * From Android 14 the system verifies, at service creation time, that every foreground service
     * type is backed by its matching FOREGROUND_SERVICE_* permission. Below that the types can be
     * used without declaring them.
     */
    fun enforcesTypePermissions(): Boolean =
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE


    /**
     * The keep-alive service always runs with the `mediaPlayback` type and adds `camera` /
     * `microphone` when those are available, so only FOREGROUND_SERVICE and (on Android 14+)
     * FOREGROUND_SERVICE_MEDIA_PLAYBACK are hard requirements. A missing camera/microphone
     * permission only drops that type - it must not disable the keep-alive altogether, otherwise
     * the app silently loses audio and gets dropped from the call once it is backgrounded.
     */
    fun hasForegroundServicePermissionsDeclared(context: Context): Boolean {
        val declared = declaredPermissions(context)
        if (declared.isEmpty()) {
            return false
        }

        val required = mutableListOf<String>()
        // FOREGROUND_SERVICE only exists from Android 9, and this SDK supports minSdk 24.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            required.add(PERMISSION_FOREGROUND_SERVICE)
        }
        if (enforcesTypePermissions()) {
            required.add(PERMISSION_MEDIA_PLAYBACK)
        }
        val missingRequired = required.filterNot { declared.contains(it) }
        if (missingRequired.isNotEmpty()) {
            Log.w(
                NAME,
                "Keep-call-alive is disabled: the app manifest is missing " +
                    "${missingRequired.joinToString(", ")}. Without it the call cannot be kept " +
                    "alive in the background and the user will be dropped from the call."
            )
            return false
        }

        val missingOptional =
            listOf(PERMISSION_CAMERA, PERMISSION_MICROPHONE).filterNot { declared.contains(it) }
        if (missingOptional.isNotEmpty() && enforcesTypePermissions()) {
            Log.w(
                NAME,
                "Keep-call-alive will run without the ${missingOptional.joinToString(", ")} " +
                    "foreground service type(s) because the app manifest does not declare them. " +
                    "Camera/microphone may be suspended while the app is in the background."
            )
        }
        return true
    }

    /** The permissions declared in the app manifest. One PackageManager round trip. */
    fun declaredPermissions(context: Context): Set<String> {
        return try {
            val packageInfo: PackageInfo = context.packageManager.getPackageInfo(
                context.packageName,
                PackageManager.GET_PERMISSIONS
            )
            packageInfo.requestedPermissions?.toSet() ?: emptySet()
        } catch (e: PackageManager.NameNotFoundException) {
            // do nothing, this can never happen actually
            Log.e(NAME, "Package not found: ${context.packageName}", e)
            emptySet()
        }
    }
}
