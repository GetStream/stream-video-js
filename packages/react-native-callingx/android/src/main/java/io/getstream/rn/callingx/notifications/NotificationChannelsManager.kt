package io.getstream.rn.callingx.notifications

import android.Manifest
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.PermissionChecker
import io.getstream.rn.callingx.debugLog

class NotificationChannelsManager(
        private val context: Context,
        private val notificationManager: NotificationManagerCompat =
                NotificationManagerCompat.from(context)
) {

  private var notificationsConfig: NotificationsConfig.Channels? = null

  companion object {
    private const val TAG = "[Callingx] NotificationChannelsManager"
  }

  data class NotificationStatus(
          val canPost: Boolean,
          val hasPermissions: Boolean,
          val areNotificationsEnabled: Boolean,
          val isIncomingChannelEnabled: Boolean,
          val isOngoingChannelEnabled: Boolean,
  )

  fun setNotificationsConfig(notificationsConfig: NotificationsConfig.Channels) {
    this.notificationsConfig = notificationsConfig
  }

  fun createNotificationChannels() {
    notificationsConfig?.let {
      val incomingChannel = createNotificationChannel(it.incomingChannel)
      val ongoingChannel = createNotificationChannel(it.ongoingChannel)

      notificationManager.createNotificationChannelsCompat(
              listOf(
                      incomingChannel,
                      ongoingChannel,
              ),
      )
      debugLog(TAG, "createNotificationChannels: Notification channels registered")
    }
  }

  fun getNotificationStatus(): NotificationStatus {
    val areNotificationsEnabled = areNotificationsEnabled()
    val hasPermissions = hasNotificationPermissions()
    val isIncomingChannelEnabled = isChannelEnabled(notificationsConfig?.incomingChannel?.id)
    val isOngoingChannelEnabled = isChannelEnabled(notificationsConfig?.ongoingChannel?.id)

    val canPost =
            areNotificationsEnabled &&
                    hasPermissions &&
                    isIncomingChannelEnabled &&
                    isOngoingChannelEnabled

    return NotificationStatus(
            canPost,
            hasPermissions,
            areNotificationsEnabled,
            isIncomingChannelEnabled,
            isOngoingChannelEnabled
    )
  }

  private fun createNotificationChannel(
          config: NotificationsConfig.ChannelParams
  ): NotificationChannelCompat {
    return NotificationChannelCompat.Builder(config.id, config.importance)
            .apply {
              setName(config.name)
              setVibrationEnabled(config.vibration)
              setSound(null, null)
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
