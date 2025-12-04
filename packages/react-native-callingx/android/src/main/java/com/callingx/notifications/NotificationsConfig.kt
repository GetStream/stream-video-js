package com.callingx.notifications

import android.content.Context
import android.util.Log
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.ReadableMap

object NotificationsConfig {
  private const val TAG = "[Callingx] NotificationsConfig"
  private const val PREFS_NAME = "CallingxPrefs"
  private const val PREFIX_IN = "incoming_"
  private const val PREFIX_OUT = "outgoing_"
  private const val KEY_ID = "id"
  private const val KEY_NAME = "name"
  private const val KEY_SOUND = "sound"
  private const val KEY_VIBRATION = "vibration"
  private const val KEY_TIMEOUT = "timeout"

  private const val DEFAULT_INCOMING_CHANNEL_ID = "incoming_channel"
  private const val DEFAULT_INCOMING_CHANNEL_NAME = "Incoming calls"
  private const val DEFAULT_ONGOING_CHANNEL_ID = "ongoing_channel"
  private const val DEFAULT_ONGOING_CHANNEL_NAME = "Ongoing calls"

  data class ChannelParams(
          val id: String,
          val name: String,
          val sound: String,
          val vibration: Boolean,
          val importance: Int,
  )

  data class ChannelsConfig(
          val incomingChannel: ChannelParams,
          val outgoingChannel: ChannelParams,
  )

  fun saveNotificationsConfig(context: Context, rawConfig: ReadableMap): ChannelsConfig {
    Log.d(TAG, "saveNotificationsConfig: Saving notifications config: $rawConfig")
    val config = extractNotificationsConfig(rawConfig)
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    prefs.edit()
            .apply {
              // Incoming channel
              putString(PREFIX_IN + KEY_ID, config.incomingChannel.id)
              putString(PREFIX_IN + KEY_NAME, config.incomingChannel.name)
              putString(PREFIX_IN + KEY_SOUND, config.incomingChannel.sound)
              putBoolean(PREFIX_IN + KEY_VIBRATION, config.incomingChannel.vibration)

              // Outgoing channel
              putString(PREFIX_OUT + KEY_ID, config.outgoingChannel.id)
              putString(PREFIX_OUT + KEY_NAME, config.outgoingChannel.name)
              putString(PREFIX_OUT + KEY_SOUND, config.outgoingChannel.sound)
              putBoolean(PREFIX_OUT + KEY_VIBRATION, config.outgoingChannel.vibration)
            }
            .apply()

    return config
  }

  fun loadNotificationsConfig(context: Context): ChannelsConfig {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    Log.d(
            TAG,
            "loadNotificationsConfig: Loading notifications config ${prefs.getString(PREFIX_IN + KEY_ID, "")}"
    )
    return ChannelsConfig(
            incomingChannel =
                    ChannelParams(
                            id = prefs.getString(PREFIX_IN + KEY_ID, "")
                                            ?: DEFAULT_INCOMING_CHANNEL_ID,
                            name = prefs.getString(PREFIX_IN + KEY_NAME, "")
                                            ?: DEFAULT_INCOMING_CHANNEL_NAME,
                            sound = prefs.getString(PREFIX_IN + KEY_SOUND, "") ?: "",
                            vibration = prefs.getBoolean(PREFIX_IN + KEY_VIBRATION, false),
                            importance = NotificationManagerCompat.IMPORTANCE_MAX,
                    ),
            outgoingChannel =
                    ChannelParams(
                            id = prefs.getString(PREFIX_OUT + KEY_ID, "")
                                            ?: DEFAULT_ONGOING_CHANNEL_ID,
                            name = prefs.getString(PREFIX_OUT + KEY_NAME, "")
                                            ?: DEFAULT_ONGOING_CHANNEL_NAME,
                            sound = prefs.getString(PREFIX_OUT + KEY_SOUND, "") ?: "",
                            vibration = prefs.getBoolean(PREFIX_OUT + KEY_VIBRATION, false),
                            importance = NotificationManagerCompat.IMPORTANCE_DEFAULT,
                    )
    )
  }

  fun extractNotificationsConfig(config: ReadableMap): ChannelsConfig {
    return ChannelsConfig(
            incomingChannel =
                    extractChannelConfig(
                            config.getMap("incomingChannel"),
                            NotificationManagerCompat.IMPORTANCE_MAX
                    ),
            outgoingChannel =
                    extractChannelConfig(
                            config.getMap("outgoingChannel"),
                            NotificationManagerCompat.IMPORTANCE_DEFAULT
                    ),
    )
  }

  fun extractChannelConfig(channel: ReadableMap?, importance: Int): ChannelParams {
    if (channel == null) {
      return ChannelParams(
              id = "",
              name = "",
              sound = "",
              vibration = false,
              importance = importance,
      )
    }

    return ChannelParams(
            id = channel.getString("id") ?: "",
            name = channel.getString("name") ?: "",
            sound = channel.getString("sound") ?: "",
            vibration = channel.getBoolean("vibration"),
            importance = importance,
    )
  }
}
