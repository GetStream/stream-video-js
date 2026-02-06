package io.getstream.rn.callingx.notifications

import android.content.Context
import android.os.Build
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationManagerCompat
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

    // CallStyle is exempt from notification permission when self-managing calls (Android 13+).
    // On older versions we require areNotificationsEnabled().
    val canPostCallStyle =
            hasPermissions &&
                    isIncomingChannelEnabled &&
                    isOngoingChannelEnabled &&
                    (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU || areNotificationsEnabled())

    return NotificationStatus(
            canPostCallStyle,
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
    // CallStyle is exempt from notification permission when self-managing calls.
    return true
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
