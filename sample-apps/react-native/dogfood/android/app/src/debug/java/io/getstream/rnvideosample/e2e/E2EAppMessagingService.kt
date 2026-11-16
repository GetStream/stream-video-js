package io.getstream.rnvideosample.e2e

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import io.getstream.rn.callingx.StreamMessagingHelper

/**
 * Test-only stand-in for an app's own Firebase messaging service, used by the push ringing e2e
 * tests (`e2e/tests/RingPushTests.e2e.ts`, `e2e/push/`). Debug builds only, and disabled until a
 * test turns it on with `adb shell pm enable`.
 *
 * Android delivers `MESSAGING_EVENT` to one service only, the one with the highest priority. This
 * one is declared above callingx's `StreamMessagingService`, so once it is on, it gets every message
 * and token update instead. It does not forward messages to Stream, like an app that knows nothing
 * about Stream: callingx's `StreamMessagingReceiver` must still ring.
 */
class E2EAppMessagingService : FirebaseMessagingService() {

  override fun onMessageReceived(message: RemoteMessage) {
    Log.d(TAG, "onMessageReceived messageId=${message.messageId}")
  }

  override fun onNewToken(token: String) {
    // Only the winning service gets onNewToken, so it forwards the token to Stream, as the
    // StreamMessagingHelper docs ask apps with their own service to do.
    Log.d(TAG, "onNewToken, forwarding it to Stream")
    StreamMessagingHelper.forwardNewToken(token)
  }

  private companion object {
    const val TAG = "E2EAppMessagingService"
  }
}
