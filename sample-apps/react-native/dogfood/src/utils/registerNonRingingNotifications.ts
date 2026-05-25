import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { handleNotificationTap } from './notificationUtils';

/**
 * Register PushNotificationIOS event listeners for non-ringing notification taps.
 *
 * Must be called at app startup (outside React lifecycle)
 * so that taps from killed state are captured.
 */
export function registerNonRingingNotificationHandler() {
  // Handle notification taps in foreground/background
  PushNotificationIOS.addEventListener('localNotification', (notification) => {
    handleNotificationTap(notification.getData()?.stream);
    notification.finish(PushNotificationIOS.FetchResult.NoData);
  });

  PushNotificationIOS.getInitialNotification().then((notification) => {
    if (notification) {
      handleNotificationTap(notification.getData()?.stream);
      notification.finish(PushNotificationIOS.FetchResult.NoData);
    }
  });
}
