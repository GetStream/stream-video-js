package io.getstream.rn.callingx.utils

import android.Manifest
import android.app.Service
import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import java.util.concurrent.ConcurrentHashMap

/**
 * Works out which foreground service types a call service may claim.
 *
 * `phoneCall` is always claimed. The while-in-use types `microphone`/`camera` are claimed only when
 * the app is allowed to, and only when its manifest declares them. Apps that never use the camera
 * in the background can drop the camera type from their manifest, and calls keep working on
 * `phoneCall|microphone`.
 *
 * @param serviceClass the service whose merged `android:foregroundServiceType` bounds the result.
 */
internal class ForegroundServiceTypes(
        private val context: Context,
        private val serviceClass: Class<out Service>,
) {

    companion object {
        private const val TAG = "[Callingx] ForegroundServiceTypes"

        private const val PERMISSION_FGS_CAMERA = "android.permission.FOREGROUND_SERVICE_CAMERA"
        private const val PERMISSION_FGS_MICROPHONE =
                "android.permission.FOREGROUND_SERVICE_MICROPHONE"

        // Every type bit set, same as ServiceInfo.FOREGROUND_SERVICE_TYPE_MANIFEST: no filtering.
        private const val ALL_SERVICE_TYPES = -1

        fun describe(type: Int): String {
            val names = mutableListOf<String>()
            if ((type and ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL) != 0)
                    names.add("phoneCall")
            if ((type and ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE) != 0)
                    names.add("microphone")
            if ((type and ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA) != 0) names.add("camera")
            return names.joinToString("|").ifEmpty { "0x${Integer.toHexString(type)}" }
        }
    }

    /** The service's merged `android:foregroundServiceType`. */
    private val manifestServiceTypes: Int by lazy { readManifestServiceTypes() }

    /** Permissions the app manifest requests, or null when unreadable. Read once, on API 34+. */
    private val declaredPermissions: Set<String>? by lazy { readDeclaredPermissions() }

    /** Types already reported as skipped, so the warning is logged once per instance. */
    private val loggedSkippedTypes: MutableSet<Int> = ConcurrentHashMap.newKeySet()

    /**
     * Always includes `phoneCall`. Adds the while-in-use types `microphone`/`camera` only when:
     * - the platform is Android 11+ (R) — these FGS types were added in API 30; passing them to
     * ```
     *    startForeground() on older versions is unsupported, so we keep `phoneCall`-only there, AND
     * ```
     * - the app currently holds while-in-use access (foreground), AND
     * - [canUseType] allows it: the runtime permission is granted and the app manifest declares
     * ```
     *    the type.
     * ```
     */
    fun compute(): Int {
        var type = ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL

        // microphone/camera FGS types require API 30 (R) — keep phoneCall-only below it.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            return type
        }
        if (!LifecycleListener.isInForeground) {
            return type
        }

        if (canUseType(
                        Manifest.permission.RECORD_AUDIO,
                        PERMISSION_FGS_MICROPHONE,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                )
        ) {
            type = type or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
        }

        if (canUseType(
                        Manifest.permission.CAMERA,
                        PERMISSION_FGS_CAMERA,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
                )
        ) {
            type = type or ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
        }

        return type
    }

    /**
     * The types to pass to startForeground(), in order: [compute] first, then `phoneCall` alone —
     * the type Telecom requires — when [allowBaseFallback] is set and it differs from [compute].
     *
     * @param allowBaseFallback whether to fall back to `phoneCall` alone. Pass false when upgrading
     *   the type of a service that is already foreground, so a failed upgrade never narrows the
     *   type it already holds.
     */
    fun typesToTry(allowBaseFallback: Boolean): List<Int> {
        val requested = compute()
        val base = ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL
        return if (allowBaseFallback && requested != base) {
            listOf(requested, base)
        } else {
            listOf(requested)
        }
    }

    /**
     * Whether [typeBit] can be claimed: [runtimePermission] is granted, the type is in the
     * service's merged `android:foregroundServiceType` (requesting one outside it throws on Android
     * 11–13), and on Android 14+ the app declares [fgsTypePermission] (claiming the type without it
     * throws a SecurityException).
     */
    private fun canUseType(
            runtimePermission: String,
            fgsTypePermission: String,
            typeBit: Int
    ): Boolean {
        val granted =
                ContextCompat.checkSelfPermission(context, runtimePermission) ==
                        PackageManager.PERMISSION_GRANTED
        if (!granted) {
            return false
        }

        val typeDeclared = (manifestServiceTypes and typeBit) != 0
        val permissionDeclared =
                Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE ||
                        declaredPermissions?.contains(fgsTypePermission) ?: true
        if (typeDeclared && permissionDeclared) {
            return true
        }

        if (loggedSkippedTypes.add(typeBit)) {
            Log.w(
                    TAG,
                    "Not claiming the ${describe(typeBit)} foreground service type: " +
                            "the app manifest does not declare it " +
                            "(serviceType=$typeDeclared, $fgsTypePermission=$permissionDeclared)"
            )
        }
        return false
    }

    /** Reads the service's merged `android:foregroundServiceType`. */
    private fun readManifestServiceTypes(): Int {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return ALL_SERVICE_TYPES
        }
        return try {
            val component = ComponentName(context, serviceClass)
            val packageManager = context.packageManager
            val info =
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        packageManager.getServiceInfo(
                                component,
                                PackageManager.ComponentInfoFlags.of(0)
                        )
                    } else {
                        @Suppress("DEPRECATION") packageManager.getServiceInfo(component, 0)
                    }
            info.foregroundServiceType
        } catch (e: PackageManager.NameNotFoundException) {
            // Cannot happen for our own service; keep the pre-gating behaviour if it does.
            Log.e(TAG, "readManifestServiceTypes: ${e.message}", e)
            ALL_SERVICE_TYPES
        }
    }

    /** Reads the app's requested permissions, or null when they cannot be read. */
    private fun readDeclaredPermissions(): Set<String>? {
        return try {
            val packageManager = context.packageManager
            val info =
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        packageManager.getPackageInfo(
                                context.packageName,
                                PackageManager.PackageInfoFlags.of(
                                        PackageManager.GET_PERMISSIONS.toLong()
                                )
                        )
                    } else {
                        @Suppress("DEPRECATION")
                        packageManager.getPackageInfo(
                                context.packageName,
                                PackageManager.GET_PERMISSIONS
                        )
                    }
            info.requestedPermissions?.toSet() ?: emptySet()
        } catch (e: PackageManager.NameNotFoundException) {
            // Cannot happen for our own package; keep the pre-gating behaviour if it does.
            Log.e(TAG, "readDeclaredPermissions: ${e.message}", e)
            null
        }
    }
}
