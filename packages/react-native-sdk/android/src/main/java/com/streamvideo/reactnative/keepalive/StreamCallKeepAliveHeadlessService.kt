package com.streamvideo.reactnative.keepalive

import android.Manifest
import android.app.Notification
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig
import com.streamvideo.reactnative.util.CallAlivePermissionsHelper

/**
 * Foreground service that runs a React Native HeadlessJS task to keep a call alive.
 *
 */
class StreamCallKeepAliveHeadlessService : HeadlessJsTaskService() {

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Without a call cid there is nothing to keep alive and getTaskConfig() would return null,
        // which leaves the base class with a started service and no task. Stop before going
        // foreground so we neither show an orphan notification nor hold the FGS types.
        val callCid = intent?.getStringExtra(EXTRA_CALL_CID)
        if (callCid == null) {
            Log.w(TAG, "onStartCommand: missing $EXTRA_CALL_CID extra, stopping service")
            stopSelf(startId)
            return START_NOT_STICKY
        }

        val channelId = intent.getStringExtra(EXTRA_CHANNEL_ID) ?: DEFAULT_CHANNEL_ID
        val channelName = intent.getStringExtra(EXTRA_CHANNEL_NAME) ?: DEFAULT_CHANNEL_NAME
        val title = intent.getStringExtra(EXTRA_TITLE) ?: DEFAULT_TITLE
        val body = intent.getStringExtra(EXTRA_BODY) ?: DEFAULT_BODY
        val smallIconName = intent.getStringExtra(EXTRA_SMALL_ICON_NAME)

        KeepAliveNotification.ensureChannel(this, channelId, channelName)
        val notification = KeepAliveNotification.buildOngoingNotification(
            context = this,
            channelId = channelId,
            title = title,
            body = body,
            smallIconName = smallIconName
        )

        if (!startForegroundCompat(notification)) {
            // We never entered the foreground. Stop immediately: the system arms a watchdog when
            // startForegroundService() is used and crashes the app with
            // ForegroundServiceDidNotStartInTimeException unless the service either goes foreground
            // or is destroyed. Also pointless to run a JS task with no foreground service behind it.
            stopSelf(startId)
            return START_NOT_STICKY
        }

        // Ensure HeadlessJS task is started
        return try {
            super.onStartCommand(intent, flags, startId)
            // Deliberately override the base class' START_REDELIVER_INTENT: that would have the
            // system recreate this service (and the process) from the background after a kill,
            // which is a background foreground-service start with while-in-use types
            // (camera/microphone) and is rejected on Android 12+/14+. The call being kept alive
            // does not survive the process anyway, so there is nothing to restart for.
            START_NOT_STICKY
        } catch (e: Exception) {
            // startTask() can throw when the app's Application is not a ReactApplication, when the
            // bridgeless ReactHost is missing, or when the react context was already destroyed.
            // Don't take the app down with us.
            Log.e(TAG, "onStartCommand: Failed to start HeadlessJS task: ${e.message}", e)
            stopSelf(startId)
            START_NOT_STICKY
        }
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
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    private fun computeForegroundServiceTypes(): Int {
        // From Android 14 a claimed type must also be backed by its FOREGROUND_SERVICE_*
        // permission, and claiming an undeclared type fails the whole startForeground() call. On
        // older platforms those permissions do not exist, so the runtime grant is the only gate and
        // the manifest does not need to be read at all. Read once when it is needed: this runs
        // inside the window the system gives us to enter the foreground.
        val declaredTypePermissions =
            if (CallAlivePermissionsHelper.enforcesTypePermissions()) {
                CallAlivePermissionsHelper.declaredPermissions(this)
            } else {
                null
            }

        var types = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK

        if (canUseType(
                Manifest.permission.CAMERA,
                CallAlivePermissionsHelper.PERMISSION_CAMERA,
                declaredTypePermissions
            )
        ) {
            types = types or ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
        }

        if (canUseType(
                Manifest.permission.RECORD_AUDIO,
                CallAlivePermissionsHelper.PERMISSION_MICROPHONE,
                declaredTypePermissions
            )
        ) {
            types = types or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
        }

        return types
    }

    /**
     * @param declaredTypePermissions the permissions declared in the app manifest, or null when the
     * platform does not require foreground service types to be declared (Android 13 and below).
     */
    private fun canUseType(
        runtimePermission: String,
        fgsTypePermission: String,
        declaredTypePermissions: Set<String>?
    ): Boolean {
        val granted = ContextCompat.checkSelfPermission(this, runtimePermission) ==
            PackageManager.PERMISSION_GRANTED
        if (!granted) {
            return false
        }
        return declaredTypePermissions == null ||
            fgsTypePermission in declaredTypePermissions
    }

    /**
     * @return true when the service actually entered the foreground.
     */
    private fun startForegroundCompat(notification: Notification): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val types = computeForegroundServiceTypes()
            if (tryStartForeground(notification, types)) {
                return true
            }
            // The camera/microphone types are rejected on API 34+ when the app hasn't declared the
            // matching FOREGROUND_SERVICE_* permission. mediaPlayback on its own still keeps the JS
            // timers hot, so degrade to it rather than losing the keep-alive entirely.
            val mediaPlaybackOnly = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            return types != mediaPlaybackOnly && tryStartForeground(notification, mediaPlaybackOnly)
        }
        return tryStartForeground(notification, null)
    }

    private fun tryStartForeground(notification: Notification, types: Int?): Boolean {
        return try {
            if (types != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, types)
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
            true
        } catch (e: Exception) {
            // Avoid crashing the app if the system rejects starting a foreground service (e.g.
            // background start restrictions, invalid notification/channel, or permission issues).
            Log.e(
                TAG,
                "tryStartForeground: Failed to start foreground service (types=$types): ${e.message}",
                e
            )
            false
        }
    }

    companion object {
        private const val TAG = "StreamCallKeepAliveHeadlessService"

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
            context: Context,
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

        fun buildStopIntent(context: Context): Intent {
            return Intent(context, StreamCallKeepAliveHeadlessService::class.java)
        }
    }
}
