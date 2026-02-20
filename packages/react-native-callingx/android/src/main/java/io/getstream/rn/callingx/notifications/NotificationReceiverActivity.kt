package io.getstream.rn.callingx.notifications

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import io.getstream.rn.callingx.CallingxModuleImpl

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

    //we need it only for answered call event, as for cold start case we need to send broadcast event and to launch the app
    if (intent.action == CallingxModuleImpl.CALL_ANSWERED_ACTION) {
      val callId = intent.getStringExtra(CallingxModuleImpl.EXTRA_CALL_ID)
      val source = intent.getStringExtra(CallingxModuleImpl.EXTRA_SOURCE)
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
