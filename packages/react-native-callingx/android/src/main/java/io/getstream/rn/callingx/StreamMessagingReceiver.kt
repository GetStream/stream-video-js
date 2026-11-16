package io.getstream.rn.callingx

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.google.firebase.messaging.RemoteMessage

/**
 * Receives Stream Video FCM messages from the `com.google.android.c2dm.intent.RECEIVE`
 * broadcast that Google Play services sends for every push.
 *
 * Android delivers `com.google.firebase.MESSAGING_EVENT` to a single
 * [com.google.firebase.messaging.FirebaseMessagingService] (the highest-priority one), so a
 * service-based handler competes with the app's own service and with libraries such as
 * `@react-native-firebase/messaging` or `expo-notifications`. Every registered receiver gets the
 * broadcast, so handling messages here works whichever service wins, without any forwarding.
 *
 * Mirrors the routing guards of Firebase's own receiver: the same action also carries control
 * broadcasts (`deleted_messages`, `send_event`, `send_error`) and non-message intents, which are
 * skipped here.
 */
class StreamMessagingReceiver : BroadcastReceiver() {

  companion object {
    const val TAG = "[Callingx] StreamMessagingReceiver"
  }

  override fun onReceive(context: Context, intent: Intent) {
    val extras = intent.extras ?: return

    val messageType = intent.getStringExtra("message_type")
    if (messageType != null && messageType != "gcm") {
      debugLog(TAG, "ignored, non-message type: $messageType")
      return
    }
    if (intent.getStringExtra("google.message_id") == null) {
      debugLog(TAG, "ignored, no google.message_id (not an FCM message)")
      return
    }

    val remoteMessage = RemoteMessage(extras)
    debugLog(TAG, "onReceive messageId=${remoteMessage.messageId} data=${remoteMessage.data}")
    StreamMessagingHelper.handleMessage(context.applicationContext, remoteMessage)
  }
}
