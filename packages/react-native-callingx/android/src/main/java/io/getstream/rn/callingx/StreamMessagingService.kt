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
open class StreamMessagingService : ReactNativeFirebaseMessagingService() {

  companion object {
    const val TAG = "[Callingx] StreamMessagingService"
  }

  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    debugLog(TAG, "onMessageReceived data=${remoteMessage.data}")

    StreamMessagingHelper.handleMessage(applicationContext, remoteMessage)

    // Let React Native Firebase continue its normal processing so
    // setBackgroundMessageHandler() still runs in JS.
    super.onMessageReceived(remoteMessage)
  }
}
