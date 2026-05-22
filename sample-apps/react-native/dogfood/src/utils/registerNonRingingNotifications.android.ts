import notifee, { EventType } from '@notifee/react-native';
import { handleNotificationTap } from './notificationUtils';

/**
 * Register notifee event listeners for non-ringing notification taps.
 *
 * Must be called at app startup (outside React lifecycle)
 * so that taps from killed state are captured.
 */
export function registerNonRingingNotificationHandler() {
  // Handle notification taps in foreground/background
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      handleNotificationTap(detail.notification?.data);
    }
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
      handleNotificationTap(detail.notification?.data);
    }
  });

  // Handle cold-start tap (app was killed, launched by tapping notification)
  notifee.getInitialNotification().then((initialNotification) => {
    if (initialNotification) {
      handleNotificationTap(initialNotification.notification.data);
    }
  });
}
