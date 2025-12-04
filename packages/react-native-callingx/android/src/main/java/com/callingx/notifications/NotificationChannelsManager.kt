package com.callingx.notifications

import android.Manifest
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.PermissionChecker

class NotificationChannelsManager(
        private val context: Context,
        private val notificationManager: NotificationManagerCompat =
                NotificationManagerCompat.from(context)
) {

  private var notificationsConfig: NotificationsConfig.ChannelsConfig? = null

  companion object {
    private const val TAG = "[Callingx] NotificationChannelsManager"
  }

  data class NotificationStatus(
          val canPost: Boolean,
          val hasPermissions: Boolean,
          val areNotificationsEnabled: Boolean,
          val isIncomingChannelEnabled: Boolean,
          val isOutgoingChannelEnabled: Boolean,
  )

  fun setNotificationsConfig(notificationsConfig: NotificationsConfig.ChannelsConfig) {
    this.notificationsConfig = notificationsConfig
  }

  fun createNotificationChannels() {
    notificationsConfig?.let {
      val incomingChannel = createNotificationChannel(it.incomingChannel)
      val ongoingChannel = createNotificationChannel(it.outgoingChannel)

      notificationManager.createNotificationChannelsCompat(
              listOf(
                      incomingChannel,
                      ongoingChannel,
              ),
      )
      Log.d(TAG, "createNotificationChannels: Notification channels registered")
    }
  }

  fun getNotificationStatus(): NotificationStatus {
    val areNotificationsEnabled = areNotificationsEnabled()
    val hasPermissions = hasNotificationPermissions()
    val isIncomingChannelEnabled = isChannelEnabled(notificationsConfig?.incomingChannel?.id)
    val isOutgoingChannelEnabled = isChannelEnabled(notificationsConfig?.outgoingChannel?.id)

    val canPost =
            areNotificationsEnabled &&
                    hasPermissions &&
                    isIncomingChannelEnabled &&
                    isOutgoingChannelEnabled

    return NotificationStatus(
            canPost,
            hasPermissions,
            areNotificationsEnabled,
            isIncomingChannelEnabled,
            isOutgoingChannelEnabled
    )
  }

  private fun createNotificationChannel(
          config: NotificationsConfig.ChannelParams
  ): NotificationChannelCompat {
    Log.d(TAG, "createNotificationChannel: Creating notification channel: ${config.id}, ${config.name}, ${config.importance}, ${config.vibration}, ${config.sound}")
    return NotificationChannelCompat.Builder(config.id, config.importance)
            .apply {
              setName(config.name)
              setVibrationEnabled(config.vibration)
              ResourceUtils.getSoundUri(context, config.sound)?.let { setSound(it, null) }
            }
            .build()
  }

  private fun areNotificationsEnabled(): Boolean {
    return notificationManager.areNotificationsEnabled()
  }

  private fun hasNotificationPermissions(): Boolean {
    // POST_NOTIFICATIONS permission is only required on Android 13+
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      return true
    }

    val permission =
            PermissionChecker.checkSelfPermission(
                    context,
                    Manifest.permission.POST_NOTIFICATIONS,
            )
    return permission == PermissionChecker.PERMISSION_GRANTED
  }

  private fun isChannelEnabled(channelId: String?): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return true
    }

    if (channelId == null) {
      return false
    }

    val channel = notificationManager.getNotificationChannel(channelId)
    return channel != null && channel.importance != NotificationManagerCompat.IMPORTANCE_NONE
  }
}
