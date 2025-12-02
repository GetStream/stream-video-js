package com.callingx

import android.content.Context
import android.media.RingtoneManager
import android.net.Uri
import android.telecom.DisconnectCause
import com.facebook.react.bridge.ReadableMap

data class ChannelConfig(
  val id: String,
  val name: String,
  val sound: String,
  val vibration: Boolean,
  val importance: Int,
)

data class NotificationsConfig(
  val incomingChannel: ChannelConfig,
  val outgoingChannel: ChannelConfig,
)

fun extractNotificationsConfig(config: ReadableMap): NotificationsConfig {
  return NotificationsConfig(
    incomingChannel = extractChannelConfig(config.getMap("incomingChannel")),
    outgoingChannel = extractChannelConfig(config.getMap("outgoingChannel")),
  )
}

fun extractChannelConfig(channel: ReadableMap?): ChannelConfig {
  if (channel == null) {
    //return
    return ChannelConfig(
      id = "",
      name = "",
      sound = "",
      vibration = false,
      importance = 0
    )
  }

  return ChannelConfig(
    id = channel.getString("id") ?: "",
    name = channel.getString("name") ?: "",
    sound = channel.getString("sound") ?: "",
    vibration = channel.getBoolean("vibration"),
    importance = 0
  )
}

fun getDisconnectCauseString(cause: DisconnectCause): String {
  return when (cause.code) {
      DisconnectCause.LOCAL -> "local"
      DisconnectCause.REMOTE -> "remote"
      DisconnectCause.REJECTED -> "rejected"
      DisconnectCause.BUSY -> "busy"
      DisconnectCause.ANSWERED_ELSEWHERE -> "answeredElsewhere"
      DisconnectCause.MISSED -> "missed"
      DisconnectCause.ERROR -> "error"
      else -> cause.toString()
  }
}
