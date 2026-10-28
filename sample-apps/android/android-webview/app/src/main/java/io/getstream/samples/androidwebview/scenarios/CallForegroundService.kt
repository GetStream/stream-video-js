package io.getstream.samples.androidwebview.scenarios

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import io.getstream.samples.androidwebview.AppState
import io.getstream.samples.androidwebview.LogTab

/**
 * Foreground service of type `microphone|camera`. Android blocks microphone
 * and camera capture for apps in the background unless a foreground service
 * of the matching type was started while the app was visible, so this
 * service decides whether a WebView call keeps capturing after the app is
 * minimized or the screen is locked.
 */
class CallForegroundService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        ensureChannel(this)
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle("AndroidWebView call")
            .setContentText("Keeping microphone/camera capture alive in the background")
            .setOngoing(true)
            .setCategory(Notification.CATEGORY_CALL)
            .build()
        val type = foregroundServiceTypes()
        try {
            ServiceCompat.startForeground(this, NOTIFICATION_ID, notification, type)
            AppState.log(LogTab.SCENARIOS, "fgs", "foreground service started (types=${describeTypes(type)})")
        } catch (e: Exception) {
            AppState.log(LogTab.ERRORS, "fgs", "startForeground failed: $e")
            stopSelf()
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        AppState.log(LogTab.SCENARIOS, "fgs", "foreground service stopped")
        super.onDestroy()
    }

    /** Typed foreground services exist from API 30; API 29 starts an untyped one. */
    private fun foregroundServiceTypes(): Int {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return 0
        var type = 0
        if (isGranted(Manifest.permission.RECORD_AUDIO)) {
            type = type or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
        }
        if (isGranted(Manifest.permission.CAMERA)) {
            type = type or ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
        }
        return type
    }

    private fun isGranted(permission: String): Boolean =
        ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED

    private fun describeTypes(type: Int): String = buildList {
        if (type and ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE != 0) add("microphone")
        if (type and ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA != 0) add("camera")
    }.ifEmpty { listOf("none") }.joinToString("|")

    companion object {
        private const val CHANNEL_ID = "call"
        private const val NOTIFICATION_ID = 1001

        fun start(context: Context) {
            ContextCompat.startForegroundService(context, Intent(context, CallForegroundService::class.java))
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, CallForegroundService::class.java))
        }

        private fun ensureChannel(context: Context) {
            val manager = context.getSystemService(NotificationManager::class.java)
            if (manager.getNotificationChannel(CHANNEL_ID) != null) return
            manager.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "Ongoing call", NotificationManager.IMPORTANCE_LOW),
            )
        }
    }
}
