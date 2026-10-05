package io.getstream.rn.callingx

import android.os.Bundle
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Handles Stream Video FCM messages. Extends Google's [FirebaseMessagingService] directly (no
 * React Native Firebase dependency).
 *
 * Two responsibilities:
 * - `onMessageReceived`: pass `call.ring` payloads through [StreamMessagingHelper.handleMessage],
 *   which publishes to [CallEventBus] (buffered while JS is booting) and starts [CallService].
 * - `onNewToken`: publish the rotated FCM token to [CallEventBus] on
 *   [CALL_FCM_TOKEN_REFRESH_ACTION] so the SDK can re-register the device.
 *
 * Consumers who ship their own `FirebaseMessagingService` can either remove ours in their
 * manifest (`tools:node="remove"`) or bump their intent-filter priority above `0`. Both winning
 * services must delegate ring payloads to [StreamMessagingHelper.handleMessage] and forward
 * token refreshes via [StreamMessagingHelper.forwardNewToken].
 */
open class StreamMessagingService : FirebaseMessagingService() {

  companion object {
    const val TAG = "[Callingx] StreamMessagingService"
    
    const val EXTRA_TOKEN = "token"
  }

  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    debugLog(TAG, "onMessageReceived data=${remoteMessage.data}")
    StreamMessagingHelper.handleMessage(applicationContext, remoteMessage)
  }

  override fun onNewToken(token: String) {
    debugLog(TAG, "onNewToken")
    val extras = Bundle().apply { putString(EXTRA_TOKEN, token) }
    CallEventBus.publish(CallEvent(CallingxModuleImpl.CALL_FCM_TOKEN_REFRESH_ACTION, extras))
  }
}
