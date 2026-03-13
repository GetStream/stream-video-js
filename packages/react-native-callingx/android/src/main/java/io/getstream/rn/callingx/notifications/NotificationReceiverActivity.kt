package io.getstream.rn.callingx.notifications

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import io.getstream.rn.callingx.CallingxModuleImpl
import io.getstream.rn.callingx.debugLog

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

  //re-send intent from notification to the turbo module
  private fun handleIntent(intent: Intent?) {
    if (intent == null) {
      return
    }

    if (intent.action == CallingxModuleImpl.CALL_ANSWERED_ACTION) {
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
}
