package io.getstream.rn.callingx

import android.content.Context
import com.google.firebase.messaging.RemoteMessage
import io.getstream.rn.callingx.utils.LifecycleListener
import io.getstream.rn.callingx.utils.SettingsStore


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
 *     // pass remote message to React Native Firebase JS background handler
 *     super.onMessageReceived(remoteMessage)
 *
 *     // Optional gate — provided for finer control over the forwarding flow.
 *     // `handleMessage` is also safe to call unconditionally; it no-ops for
 *     // payloads that aren't a Stream `call.ring`.
 *     if (StreamMessagingHelper.isStreamCallRing(remoteMessage)) {
 *       StreamMessagingHelper.handleMessage(applicationContext, remoteMessage)
 *     } else {
 *       // forward to other push SDKs
 *     }
 *   }
 * }
 * ```
 */
object StreamMessagingHelper {

  private const val TAG = "[Callingx] StreamMessagingHelper"

  /**
   * Returns `true` if [remoteMessage] is a Stream Video incoming `call.ring` push.
   * Useful when you want to short-circuit other SDK forwarders for Stream pushes.
   */
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

    if (!isStreamCallRing(remoteMessage)) {
      debugLog(TAG, "sender or type is not supported, skipping CallService start")
      return
    }

    val callCid = data["call_cid"]
    if (callCid.isNullOrEmpty()) {
      debugLog(TAG, "missing call_cid for call.ring, skipping CallService start")
      return
    }

    if (
        SettingsStore.shouldSkipIncomingPushInForeground(context) &&
        LifecycleListener.isInForeground
      ) {
        debugLog(
          TAG,
          "app is in foreground and skipIncomingPushInForeground=true, letting JS handle call.ring — skipping CallService start",
        )
        return
    }

    CallService.startIncomingCallFromPush(context.applicationContext, data)
  }
}
