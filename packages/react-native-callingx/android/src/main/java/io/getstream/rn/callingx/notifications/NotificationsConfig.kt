package io.getstream.rn.callingx.notifications

import android.content.Context
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.edit
import com.facebook.react.bridge.ReadableMap
import io.getstream.rn.callingx.debugLog

object NotificationsConfig {
  private const val TAG = "[Callingx] NotificationsConfig"
  private const val PREFS_NAME = "CallingxPrefs"
  private const val PREFIX_IN = "incoming_"
  private const val PREFIX_OUT = "ongoing_"
  private const val KEY_ID = "id"
  private const val KEY_NAME = "name"
  private const val KEY_SOUND = "sound"
  private const val KEY_VIBRATION = "vibration"
  private const val KEY_CALLS_HISTORY = "calls_history"

  data class ChannelParams(
    val id: String,
    val name: String,
    val sound: String?,
    val vibration: Boolean,
    val importance: Int,
  )

  data class Channels(
    val incomingChannel: ChannelParams,
    val ongoingChannel: ChannelParams,
    val callsHistory: Boolean = false,
  )

  fun saveNotificationsConfig(context: Context, rawConfig: ReadableMap): Channels {
    debugLog(TAG, "saveNotificationsConfig: Saving notifications config: $rawConfig")
    val config = extractNotificationsConfig(rawConfig)
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    prefs.edit {
      // Incoming channel
      putString(PREFIX_IN + KEY_ID, config.incomingChannel.id)
      putString(PREFIX_IN + KEY_NAME, config.incomingChannel.name)
      putString(PREFIX_IN + KEY_SOUND, config.incomingChannel.sound)
      putBoolean(PREFIX_IN + KEY_VIBRATION, config.incomingChannel.vibration)

      // Outgoing channel
      putString(PREFIX_OUT + KEY_ID, config.ongoingChannel.id)
      putString(PREFIX_OUT + KEY_NAME, config.ongoingChannel.name)

      putBoolean(KEY_CALLS_HISTORY, config.callsHistory)
    }

    return config
  }

  fun loadNotificationsConfig(context: Context): Channels {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    debugLog(
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
          id = prefs.getString(PREFIX_IN + KEY_ID, "") ?: "",
          name = prefs.getString(PREFIX_IN + KEY_NAME, "") ?: "",
          sound = prefs.getString(PREFIX_IN + KEY_SOUND, "") ?: "",
          vibration = prefs.getBoolean(PREFIX_IN + KEY_VIBRATION, false),
          importance = NotificationManagerCompat.IMPORTANCE_MAX,
        ),
      ongoingChannel =
        ChannelParams(
          id = prefs.getString(PREFIX_OUT + KEY_ID, "") ?: "",
          name = prefs.getString(PREFIX_OUT + KEY_NAME, "") ?: "",
          importance = NotificationManagerCompat.IMPORTANCE_DEFAULT,
          vibration = false,
          sound = null,
        ),
      callsHistory = prefs.getBoolean(KEY_CALLS_HISTORY, false),
    )
  }

  fun extractNotificationsConfig(config: ReadableMap): Channels {
    return Channels(
      incomingChannel =
        extractChannelConfig(
          config.getMap("incomingChannel"),
          NotificationManagerCompat.IMPORTANCE_MAX
        ),
      ongoingChannel =
        extractChannelConfig(
          config.getMap("ongoingChannel"),
          NotificationManagerCompat.IMPORTANCE_DEFAULT
        ),
      callsHistory = config.hasKey("callsHistory") && config.getBoolean("callsHistory"),
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
