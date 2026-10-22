package io.getstream.rn.callingx

import android.content.Context
import android.os.Bundle
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
 * (Alternatively, bump your own intent-filter's `android:priority` above `0` — ours declares
 * priority `0` by default.)
 *
 * Then invoke [handleMessage] from the app's own messaging service:
 * ```
 * class AppMessagingService : FirebaseMessagingService() {
 *   override fun onMessageReceived(remoteMessage: RemoteMessage) {
 *     // Optional gate — provided for finer control over the forwarding flow.
 *     // `handleMessage` is also safe to call unconditionally; it no-ops for
 *     // payloads that aren't a Stream `call.ring`.
 *     if (StreamMessagingHelper.isStreamCallRing(remoteMessage)) {
 *       StreamMessagingHelper.handleMessage(applicationContext, remoteMessage)
 *     } else {
 *       // forward to other push SDKs
 *     }
 *   }
 *
 *   override fun onNewToken(token: String) {
 *     // Notify Stream of the new token so the SDK's token rotation flow still fires.
 *     StreamMessagingHelper.forwardNewToken(token)
 *     // ... plus consumer's own SDKs
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

    val extras = Bundle().apply { data.forEach { (key, value) -> putString(key, value) } }
    CallEventBus.publish(CallEvent(CallingxModuleImpl.CALL_RING_PUSH_ACTION, extras))

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

  /**
   * Forwards a rotated FCM device token to the Stream SDK so the `fcmTokenRefresh` JS event
   * fires and `client.addDevice` is re-invoked with the new token. Call from your service's
   * `onNewToken` when your app hosts its own [com.google.firebase.messaging.FirebaseMessagingService].
   */
  @JvmStatic
  fun forwardNewToken(token: String) {
    val extras = Bundle().apply {
      putString(StreamMessagingService.EXTRA_TOKEN, token)
    }
    CallEventBus.publish(
      CallEvent(CallingxModuleImpl.CALL_FCM_TOKEN_REFRESH_ACTION, extras),
    )
  }
}
