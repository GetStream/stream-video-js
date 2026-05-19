import * as Notifications from 'expo-notifications';
import { handleNotificationTap } from './notificationUtils';

/**
 * Register notification tap listeners.
 * When a user taps a non-ringing notification, navigate to the meeting screen.
 *
 * Must be called at app startup (outside React lifecycle)
 * so that taps from killed state are captured.
 */
export function registerNonRingingNotificationHandler() {
  // Handle notification taps when app is running
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    const payload = (data?.stream as Record<string, unknown>) ?? data;
    handleNotificationTap(payload);
  });

  // Handle cold-start tap (app was killed, launched by tapping notification)
  const lastResponse = Notifications.getLastNotificationResponse();
  if (lastResponse) {
    const data = lastResponse.notification.request.content.data;
    const payload = (data?.stream as Record<string, unknown>) ?? data;
    handleNotificationTap(payload);
  }
}
