package io.getstream.rn.callingx

import android.util.Log
import com.google.firebase.messaging.RemoteMessage
import io.getstream.rn.callingx.notifications.NotificationChannelsManager
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService

/**
 * Extends React Native Firebase's messaging service to start [CallService] when a
 * data message contains "stream" (e.g. incoming call push), then delegates to the
 * parent so setBackgroundMessageHandler() still runs in JS.
 *
 * Only compiled when the app has @react-native-firebase/app and @react-native-firebase/messaging
 * as dependencies. The app must remove the default [ReactNativeFirebaseMessagingService] from
 * the merged manifest so this service is the single FCM handler
 */
class StreamMessagingService : ReactNativeFirebaseMessagingService() {

  companion object {
    const val TAG = "[Callingx] StreamMessagingService"
  }

  private val notificationChannelsManager by lazy {
    NotificationChannelsManager(applicationContext)
  }
  
  override fun onNewToken(token: String) {
    super.onNewToken(token)
  }

  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    val data = remoteMessage.data
    debugLog(TAG, "onMessageReceived data = $data")

    val canPostNotification = notificationChannelsManager.getNotificationStatus().canPost
    if (!canPostNotification || data["sender"] != "stream.video" || data["type"] != "call.ring") {
      super.onMessageReceived(remoteMessage)
      return
    }

    val callCid = data["call_cid"]
    if (callCid.isNullOrEmpty()) {
      Log.d(
        TAG,
        "missing call_cid for call.ring, skipping CallService start",
      )
      super.onMessageReceived(remoteMessage)
      return
    }

    CallService.startCallService(applicationContext, data)

    // Let React Native Firebase continue its normal processing so
    // setBackgroundMessageHandler() still runs in JS.
    super.onMessageReceived(remoteMessage)
  }
}
