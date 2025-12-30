package io.getstream.rn.callingx.notifications

import android.app.Service
import android.content.Intent
import android.os.IBinder
import io.getstream.rn.callingx.CallingxModule

class NotificationReceiverService : Service() {

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val action = intent?.action
    if (action == null) {
      stopSelf(startId)
      return START_NOT_STICKY
    }

    when (action) {
      CallingxModule.CALL_ANSWERED_ACTION -> onCallAnswered(intent)
    }

    stopSelf(startId)
    return START_NOT_STICKY
  }

  private fun onCallAnswered(intent: Intent) {
    val callId = intent.getStringExtra(CallingxModule.EXTRA_CALL_ID)
    val source = intent.getStringExtra(CallingxModule.EXTRA_SOURCE)
    callId?.let {
      NotificationIntentFactory.getPendingBroadcastIntent(
                      applicationContext,
                      CallingxModule.CALL_ANSWERED_ACTION,
                      it
              ) { putExtra(CallingxModule.EXTRA_SOURCE, source) }
              .send()

      NotificationIntentFactory.getLaunchActivityIntent(
                      applicationContext,
                      CallingxModule.CALL_ANSWERED_ACTION,
                      it,
                      source
              )
              .send()
    }
  }
}
