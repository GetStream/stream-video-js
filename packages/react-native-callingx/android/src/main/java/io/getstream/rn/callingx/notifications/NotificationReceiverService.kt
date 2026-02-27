package io.getstream.rn.callingx.notifications

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import io.getstream.rn.callingx.CallingxModuleImpl

class NotificationReceiverService : Service() {

  companion object {
    const val TAG = "[Callingx] NotificationReceiverService"
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val action = intent?.action
    if (action == null) {
      stopSelf(startId)
      return START_NOT_STICKY
    }

    when (action) {
      CallingxModuleImpl.CALL_ANSWERED_ACTION -> onCallAnswered(intent)
    }

    stopSelf(startId)
    return START_NOT_STICKY
  }

  private fun onCallAnswered(intent: Intent) {
    val callId = intent.getStringExtra(CallingxModuleImpl.EXTRA_CALL_ID)
    val source = intent.getStringExtra(CallingxModuleImpl.EXTRA_SOURCE)
    callId?.let {
      try {
        NotificationIntentFactory.getPendingBroadcastIntent(
                        applicationContext,
                        CallingxModuleImpl.CALL_ANSWERED_ACTION,
                        it
                ) { putExtra(CallingxModuleImpl.EXTRA_SOURCE, source) }
                .send()

        NotificationIntentFactory.getLaunchActivityIntent(
                        applicationContext,
                        CallingxModuleImpl.CALL_ANSWERED_ACTION,
                        it,
                        source
                )
                .send()
      } catch (e: Exception) {
        Log.e(TAG, "Error sending call answered intent", e)
      }
    }
  }
}
