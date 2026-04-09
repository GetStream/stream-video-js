package io.getstream.rn.callingx.notifications

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.telecom.DisconnectCause
import io.getstream.rn.callingx.CallingxModuleImpl
import io.getstream.rn.callingx.debugLog
import io.getstream.rn.callingx.getDisconnectCauseString

// For Android 12+
class NotificationReceiverActivity : Activity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    handleIntent(intent)
    finish()
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    handleIntent(intent)
    finish()
  }

  private fun handleIntent(intent: Intent?) {
    val nonNullIntent = intent ?: return
    val action = nonNullIntent.action ?: return

    when (action) {
      CallingxModuleImpl.CALL_ANSWERED_ACTION -> onCallAnswered(nonNullIntent)
      CallingxModuleImpl.CALL_END_ACTION -> onCallEnded(nonNullIntent)
    }
  }

  private fun onCallAnswered(intent: Intent) {
    debugLog("[Callingx] NotificationReceiverActivity", "[receiver] answered call action")
    val callId = intent.getStringExtra(CallingxModuleImpl.EXTRA_CALL_ID)
    val source = intent.getStringExtra(CallingxModuleImpl.EXTRA_SOURCE)

    if (callId != null) {
      Intent(CallingxModuleImpl.CALL_OPTIMISTIC_ACCEPT_ACTION)
        .apply {
          setPackage(packageName)
          putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
        }
        .also { sendBroadcast(it) }
    }

    Intent(CallingxModuleImpl.CALL_ANSWERED_ACTION)
      .apply {
        setPackage(packageName)
        putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
        putExtra(CallingxModuleImpl.EXTRA_SOURCE, source)
      }
      .also { sendBroadcast(it) }
  }

  private fun onCallEnded(intent: Intent) {
    debugLog("[Callingx] NotificationReceiverActivity", "[receiver] rejected call action")
    val callId = intent.getStringExtra(CallingxModuleImpl.EXTRA_CALL_ID)
    val source = intent.getStringExtra(CallingxModuleImpl.EXTRA_SOURCE)

    Intent(CallingxModuleImpl.CALL_END_ACTION)
      .apply {
        setPackage(packageName)
        putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
        putExtra(CallingxModuleImpl.EXTRA_SOURCE, source)
        putExtra(
          CallingxModuleImpl.EXTRA_DISCONNECT_CAUSE,
          getDisconnectCauseString(DisconnectCause(DisconnectCause.REJECTED))
        )
      }
      .also { sendBroadcast(it) }
  }
}
