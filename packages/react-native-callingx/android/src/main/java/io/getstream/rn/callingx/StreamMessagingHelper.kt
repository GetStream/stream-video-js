package io.getstream.rn.callingx

import android.content.Context
import android.os.Bundle
import com.google.firebase.messaging.RemoteMessage
import io.getstream.rn.callingx.notifications.NotificationsConfig
import io.getstream.rn.callingx.utils.LifecycleListener
import io.getstream.rn.callingx.utils.SettingsStore


/**
 * Public entry point for Stream Video FCM handling.
 *
 * Messages arrive through [StreamMessagingReceiver], which gets every push no matter which
 * [com.google.firebase.messaging.FirebaseMessagingService] the app resolves, so apps that host
 * their own service do not need to forward messages. Forwarding stays supported: [handleMessage]
 * skips a message it has already handled, so calling it from your own service is harmless.
 *
 * Token updates only reach the winning service. [StreamMessagingService] is declared at priority
 * `-100`, so when your app has its own service, forward the token from it for immediate updates
 * (the SDK also registers the current token on every start):
 * ```
 * class AppMessagingService : FirebaseMessagingService() {
 *   override fun onNewToken(token: String) {
 *     // Notify Stream of the new token so the SDK's token rotation flow still fires.
 *     StreamMessagingHelper.forwardNewToken(token)
 *     // ... plus consumer's own SDKs
 *   }
 * }
 * ```
 *
 * To take over message handling completely, remove our receiver in the app manifest and call
 * [handleMessage] from your own service:
 * ```
 * <receiver
 *     android:name="io.getstream.rn.callingx.StreamMessagingReceiver"
 *     tools:node="remove" />
 * ```
 */
object StreamMessagingHelper {

  private const val TAG = "[Callingx] StreamMessagingHelper"

  /** Upper bound on remembered message ids; only recent duplicates matter. */
  private const val MAX_HANDLED_MESSAGE_IDS = 50

  /**
   * FCM message ids already handled, oldest first. The same push can arrive through
   * [StreamMessagingReceiver] and through an app service that still forwards to [handleMessage].
   */
  private val handledMessageIds = LinkedHashSet<String>()

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
   * No-op for any other payload, for a message already handled, or until the app has called
   * `StreamVideoRN.setPushConfig` at least once, so it is safe to call unconditionally from a
   * host messaging service.
   */
  @JvmStatic
  fun handleMessage(context: Context, remoteMessage: RemoteMessage) {
    val data = remoteMessage.data

    if (!isStreamCallRing(remoteMessage)) {
      debugLog(TAG, "sender or type is not supported, skipping CallService start")
      return
    }

    if (!markHandled(remoteMessage.messageId)) {
      debugLog(TAG, "message ${remoteMessage.messageId} already handled, skipping")
      return
    }

    if (!NotificationsConfig.isSaved(context)) {
      debugLog(
        TAG,
        "callingx setup() was never called (StreamVideoRN.setPushConfig), skipping CallService start",
      )
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

  /**
   * Records [messageId] as handled. Returns `false` if it was already recorded. A message
   * without an id is always handled, since it cannot be told apart from another one.
   */
  private fun markHandled(messageId: String?): Boolean {
    if (messageId == null) return true
    synchronized(handledMessageIds) {
      if (!handledMessageIds.add(messageId)) return false
      if (handledMessageIds.size > MAX_HANDLED_MESSAGE_IDS) {
        handledMessageIds.remove(handledMessageIds.first())
      }
      return true
    }
  }
}
