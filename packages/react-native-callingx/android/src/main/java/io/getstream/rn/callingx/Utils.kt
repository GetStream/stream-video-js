package io.getstream.rn.callingx

import android.telecom.DisconnectCause

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
