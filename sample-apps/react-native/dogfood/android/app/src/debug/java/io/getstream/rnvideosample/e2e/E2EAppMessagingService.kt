package io.getstream.rnvideosample.e2e

import android.content.Context
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import io.getstream.rn.callingx.StreamMessagingHelper

/**
 * Test-only stand-in for an app's own Firebase messaging service, used by the push ringing e2e
 * tests (`e2e/tests/RingPushTests.e2e.ts`, `e2e/push/`). Debug builds only, and disabled until a
 * test turns it on through [E2EAppMessagingServiceSwitch].
 *
 * Android delivers `MESSAGING_EVENT` to one service only, the one with the highest priority. This
 * one is declared above callingx's `StreamMessagingService`, so once it is on, it gets every message
 * and token update instead.
 *
 * By default it doesn't forward messages to Stream, like an app that knows nothing about Stream:
 * callingx's `StreamMessagingReceiver` must still ring. With forwarding on, it passes every message
 * to [StreamMessagingHelper.handleMessage], like an app that followed the old integration docs: the
 * push then reaches `handleMessage` twice and must still ring once.
 */
class E2EAppMessagingService : FirebaseMessagingService() {

  override fun onMessageReceived(message: RemoteMessage) {
    val forward = shouldForwardMessages(applicationContext)
    Log.d(TAG, "onMessageReceived messageId=${message.messageId} forward=$forward")
    if (forward) {
      StreamMessagingHelper.handleMessage(applicationContext, message)
    }
  }

  override fun onNewToken(token: String) {
    // Only the winning service gets onNewToken, so it forwards the token to Stream, as the
    // StreamMessagingHelper docs ask apps with their own service to do.
    Log.d(TAG, "onNewToken, forwarding it to Stream")
    StreamMessagingHelper.forwardNewToken(token)
  }

  companion object {
    private const val TAG = "E2EAppMessagingService"
    private const val PREFS = "e2e_app_messaging_service"
    private const val KEY_FORWARD_MESSAGES = "forward_messages"

    fun shouldForwardMessages(context: Context): Boolean =
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        .getBoolean(KEY_FORWARD_MESSAGES, false)

    fun setForwardMessages(context: Context, forward: Boolean) {
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        .edit()
        .putBoolean(KEY_FORWARD_MESSAGES, forward)
        .commit()
    }
  }
}
