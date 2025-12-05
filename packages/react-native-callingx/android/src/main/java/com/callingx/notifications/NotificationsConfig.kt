package com.callingx.notifications

import android.content.Context
import android.util.Log
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.edit
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

  private const val DEFAULT_INCOMING_CHANNEL_ID = "incoming_channel"
  private const val DEFAULT_INCOMING_CHANNEL_NAME = "Incoming calls"
  private const val DEFAULT_ONGOING_CHANNEL_ID = "ongoing_channel"
  private const val DEFAULT_ONGOING_CHANNEL_NAME = "Ongoing calls"

  data class ChannelParams(
    val id: String,
    val name: String,
    val sound: String?,
    val vibration: Boolean,
    val importance: Int,
  )

  data class Channels(
    val incomingChannel: ChannelParams,
    val outgoingChannel: ChannelParams,
  )

  fun saveNotificationsConfig(context: Context, rawConfig: ReadableMap): Channels {
    Log.d(TAG, "saveNotificationsConfig: Saving notifications config: $rawConfig")
    val config = extractNotificationsConfig(rawConfig)
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    prefs.edit {
      // Incoming channel
      putString(PREFIX_IN + KEY_ID, config.incomingChannel.id)
      putString(PREFIX_IN + KEY_NAME, config.incomingChannel.name)
      putString(PREFIX_IN + KEY_SOUND, config.incomingChannel.sound)
      putBoolean(PREFIX_IN + KEY_VIBRATION, config.incomingChannel.vibration)

      // Outgoing channel
      putString(PREFIX_OUT + KEY_ID, config.outgoingChannel.id)
      putString(PREFIX_OUT + KEY_NAME, config.outgoingChannel.name)
    }

    return config
  }

  fun loadNotificationsConfig(context: Context): Channels {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    Log.d(
      TAG,
      "loadNotificationsConfig: Loading notifications config ${
        prefs.getString(
          PREFIX_IN + KEY_ID,
          ""
        )
      }"
    )
    return Channels(
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
          importance = NotificationManagerCompat.IMPORTANCE_DEFAULT,
          vibration = false,
          sound = null,
        )
    )
  }

  fun extractNotificationsConfig(config: ReadableMap): Channels {
    return Channels(
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
      sound = channel.getString("sound"),
      vibration = channel.hasKey("vibration") && channel.getBoolean("vibration") ?: false,
      importance = importance,
    )
  }
}
