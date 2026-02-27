package io.getstream.rn.callingx

import android.telecom.DisconnectCause
import android.util.Log

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

fun debugLog(tag: String, message: String) {
  if (BuildConfig.DEBUG) {
    Log.d(tag, message)
  }
}