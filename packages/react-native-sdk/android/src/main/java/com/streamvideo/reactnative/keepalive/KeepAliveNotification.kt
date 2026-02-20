package com.streamvideo.reactnative.keepalive

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat

internal object KeepAliveNotification {
    private const val DEFAULT_CHANNEL_DESCRIPTION = "Stream call keep-alive"

    fun ensureChannel(
        context: Context,
        channelId: String,
        channelName: String
    ) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val existing = manager.getNotificationChannel(channelId)
        if (existing != null) return

        val channel = NotificationChannel(
            channelId,
            channelName,
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = DEFAULT_CHANNEL_DESCRIPTION
            setShowBadge(false)
        }
        manager.createNotificationChannel(channel)
    }

    fun buildOngoingNotification(
        context: Context,
        channelId: String,
        title: String,
        body: String,
        smallIconName: String?
    ): Notification {
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pendingIntentFlags =
            PendingIntent.FLAG_UPDATE_CURRENT or
               PendingIntent.FLAG_IMMUTABLE
        val contentIntent = if (launchIntent != null) {
            PendingIntent.getActivity(context, 0, launchIntent, pendingIntentFlags)
        } else {
            // Fallback: empty intent to avoid crash if launch activity is missing for some reason
            PendingIntent.getActivity(context, 0, Intent(), pendingIntentFlags)
        }

        val iconResId = resolveSmallIconResId(context, smallIconName)
        return NotificationCompat.Builder(context, channelId)
            .setContentTitle(title)
            .setContentText(body)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setContentIntent(contentIntent)
            .setSmallIcon(iconResId)
            .build()
    }

    private fun resolveSmallIconResId(context: Context, smallIconName: String?): Int {
        val resources = context.resources
        val packageName = context.packageName
        if (!smallIconName.isNullOrBlank()) {
            val id = resources.getIdentifier(smallIconName, "drawable", packageName)
            if (id != 0) return id
        }
        // Default to the app icon
        return try {
            val appInfo = context.packageManager.getApplicationInfo(packageName, 0)
            appInfo.icon
        } catch (_: PackageManager.NameNotFoundException) {
            android.R.drawable.ic_dialog_info
        }
    }
}

