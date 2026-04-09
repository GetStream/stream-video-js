package io.getstream.rn.callingx

import android.annotation.SuppressLint
import com.google.firebase.messaging.RemoteMessage
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService

/**
 * Extends React Native Firebase's messaging service to start [CallService] when a
 * data message contains "stream" (e.g. incoming call push), then delegates to the
 * parent so setBackgroundMessageHandler() still runs in JS.
 *
 * Only compiled when the app has @react-native-firebase/app and @react-native-firebase/messaging
 * as dependencies. The app must remove the default [io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService] from
 * the merged manifest so this service is the single FCM handler
 */
@SuppressLint("MissingFirebaseInstanceTokenRefresh")
class StreamMessagingService : ReactNativeFirebaseMessagingService() {

  companion object {
    const val TAG = "[Callingx] StreamMessagingService"
  }

  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    val data = remoteMessage.data
    debugLog(TAG, "onMessageReceived data = $data")

    val isSupportedStreamVideoCallRing =
      data["sender"] == "stream.video" && data["type"] == "call.ring"

    if (isSupportedStreamVideoCallRing) {
      val callCid = data["call_cid"]
      if (callCid.isNullOrEmpty()) {
        debugLog(
          TAG,
          "missing call_cid for call.ring, skipping CallService start",
        )
      } else {
        CallService.startIncomingCallFromPush(applicationContext, data)
      }
    } else {
      debugLog(TAG, "sender or type is not supported, skipping CallService start")
    }

    // Let React Native Firebase continue its normal processing so
    // setBackgroundMessageHandler() still runs in JS.
    super.onMessageReceived(remoteMessage)
  }
}
