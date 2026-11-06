package io.getstream.rn.callingx

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Receives FCM token updates for Stream Video. Extends Google's [FirebaseMessagingService]
 * directly (no React Native Firebase dependency).
 *
 * Messages are handled by [StreamMessagingReceiver], which gets every push regardless of which
 * `FirebaseMessagingService` the app resolves. This service only covers `onNewToken`: it publishes
 * the rotated token to [CallEventBus] on [CallingxModuleImpl.CALL_FCM_TOKEN_REFRESH_ACTION] so the
 * SDK can re-register the device.
 *
 * It is declared at priority `-100`, so any other FCM service in the app wins. When that happens,
 * the SDK still registers the current token on every start; apps can call
 * [StreamMessagingHelper.forwardNewToken] from their own `onNewToken` for immediate updates.
 */
open class StreamMessagingService : FirebaseMessagingService() {

  companion object {
    const val TAG = "[Callingx] StreamMessagingService"

    const val EXTRA_TOKEN = "token"
  }

  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    // No-op: StreamMessagingReceiver handles messages. Handling them here too would process
    // every push twice whenever this service is the one Firebase resolves.
    debugLog(TAG, "onMessageReceived messageId=${remoteMessage.messageId}, handled by StreamMessagingReceiver")
  }

  override fun onNewToken(token: String) {
    debugLog(TAG, "onNewToken")
    StreamMessagingHelper.forwardNewToken(token)
  }
}
