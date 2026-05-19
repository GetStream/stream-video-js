package io.getstream.rn.callingx

import android.content.Context
import com.google.firebase.messaging.RemoteMessage

/**
 * Public entry point for consumer apps that host their own [com.google.firebase.messaging.FirebaseMessagingService].
 *
 * To opt out of the default [StreamMessagingService] registration, add to the app manifest:
 * ```
 * <service
 *     android:name="io.getstream.rn.callingx.StreamMessagingService"
 *     tools:node="remove" />
 * ```
 * then invoke [handleMessage] from the app's own messaging service:
 * ```
 * class AppMessagingService : ReactNativeFirebaseMessagingService() {
 *   override fun onMessageReceived(remoteMessage: RemoteMessage) {
 *     StreamMessagingHelper.handleMessage(applicationContext, remoteMessage)
 *     // ...forward to other push SDKs here...
 *     super.onMessageReceived(remoteMessage) // keeps RN-Firebase JS handler running
 *   }
 * }
 * ```
 */
object StreamMessagingHelper {

  private const val TAG = "[Callingx] StreamMessagingHelper"

  @JvmStatic
  fun isStreamCallRing(remoteMessage: RemoteMessage): Boolean {
    val data = remoteMessage.data
    return data["sender"] == "stream.video" && data["type"] == "call.ring"
  }

  /**
   * Handles a Stream Video `call.ring` payload by starting the incoming call flow.
   * No-op for any other payload, so it is safe to call unconditionally from a host
   * messaging service.
   */
  @JvmStatic
  fun handleMessage(context: Context, remoteMessage: RemoteMessage) {
    val data = remoteMessage.data
    debugLog(TAG, "handleMessage data = $data")

    if (!isStreamCallRing(remoteMessage)) {
      debugLog(TAG, "sender or type is not supported, skipping CallService start")
      return
    }

    val callCid = data["call_cid"]
    if (callCid.isNullOrEmpty()) {
      debugLog(TAG, "missing call_cid for call.ring, skipping CallService start")
      return
    }

    CallService.startIncomingCallFromPush(context.applicationContext, data)
  }
}
