package io.getstream.rn.callingx.notifications

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import io.getstream.rn.callingx.CallingxModuleImpl
import io.getstream.rn.callingx.debugLog

// Android 13+: handles Accept on the incoming call notification. Accept has to bring the app to the
// front, and since Android 12 a notification action may only do that by opening an activity
// directly. Decline opens nothing, so it is a broadcast instead (see CallNotificationManager).
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

}
