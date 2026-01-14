package com.streamvideo.reactnative.keepalive

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/**
 * Foreground service that runs a React Native HeadlessJS task to keep a call alive.
 *
 * This replaces the Notifee foreground-service usage for the keep-call-alive feature.
 */
class StreamCallKeepAliveHeadlessService : HeadlessJsTaskService() {

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val safeIntent = intent ?: Intent()
        val channelId = safeIntent.getStringExtra(EXTRA_CHANNEL_ID) ?: DEFAULT_CHANNEL_ID
        val channelName = safeIntent.getStringExtra(EXTRA_CHANNEL_NAME) ?: DEFAULT_CHANNEL_NAME
        val title = safeIntent.getStringExtra(EXTRA_TITLE) ?: DEFAULT_TITLE
        val body = safeIntent.getStringExtra(EXTRA_BODY) ?: DEFAULT_BODY
        val smallIconName = safeIntent.getStringExtra(EXTRA_SMALL_ICON_NAME)

        KeepAliveNotification.ensureChannel(this, channelId, channelName)
        val notification = KeepAliveNotification.buildOngoingNotification(
            context = this,
            channelId = channelId,
            title = title,
            body = body,
            smallIconName = smallIconName
        )

        startForegroundCompat(NOTIFICATION_ID, notification)

        // Ensure HeadlessJS task is started
        return super.onStartCommand(safeIntent, flags, startId)
    }

    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        val callCid = intent?.getStringExtra(EXTRA_CALL_CID) ?: return null
        val data = Arguments.createMap().apply {
            putString("callCid", callCid)
        }
        // We intentionally allow long-running work (the JS task can return a never-resolving Promise).
        return HeadlessJsTaskConfig(
            TASK_NAME,
            data,
            0, // timeout (0 = no timeout)
            true // allowedInForeground
        )
    }

    override fun onDestroy() {
        super.onDestroy()
        stopForeground(STOP_FOREGROUND_REMOVE)
    }

    @RequiresApi(Build.VERSION_CODES.R)
    private fun computeForegroundServiceTypes(): Int {
        var types = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK

        val hasCameraPermission =
            ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        if (hasCameraPermission) {
            types = types or ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
        }

        val hasMicrophonePermission =
            ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        if (hasMicrophonePermission) {
            types = types or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
        }

        return types
    }

    private fun startForegroundCompat(id: Int, notification: android.app.Notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val types = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) computeForegroundServiceTypes() else ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            startForeground(id, notification, types)
        } else {
            startForeground(id, notification)
        }
    }

    companion object {
        const val TASK_NAME = "StreamVideoKeepCallAlive"

        const val EXTRA_CALL_CID = "callCid"
        const val EXTRA_CHANNEL_ID = "channelId"
        const val EXTRA_CHANNEL_NAME = "channelName"
        const val EXTRA_TITLE = "title"
        const val EXTRA_BODY = "body"
        const val EXTRA_SMALL_ICON_NAME = "smallIconName"

        private const val NOTIFICATION_ID = 6061

        private const val DEFAULT_CHANNEL_ID = "stream_call_foreground_service"
        private const val DEFAULT_CHANNEL_NAME = "Call in progress"
        private const val DEFAULT_TITLE = "Call in progress"
        private const val DEFAULT_BODY = "Tap to return to the call"

        fun buildStartIntent(
            context: android.content.Context,
            callCid: String,
            channelId: String,
            channelName: String,
            title: String,
            body: String,
            smallIconName: String?
        ): Intent {
            return Intent(context, StreamCallKeepAliveHeadlessService::class.java).apply {
                putExtra(EXTRA_CALL_CID, callCid)
                putExtra(EXTRA_CHANNEL_ID, channelId)
                putExtra(EXTRA_CHANNEL_NAME, channelName)
                putExtra(EXTRA_TITLE, title)
                putExtra(EXTRA_BODY, body)
                if (!smallIconName.isNullOrBlank()) {
                    putExtra(EXTRA_SMALL_ICON_NAME, smallIconName)
                }
            }
        }

        fun buildStopIntent(context: android.content.Context): Intent {
            return Intent(context, StreamCallKeepAliveHeadlessService::class.java)
        }
    }
}

