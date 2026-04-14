import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

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
    handleNotificationTap(response.notification.request.content.data);
  });

  // Handle cold-start tap (app was killed, launched by tapping notification)
  const lastResponse = Notifications.getLastNotificationResponse();
  if (lastResponse) {
    handleNotificationTap(lastResponse.notification.request.content.data);
  }
}

function handleNotificationTap(data?: Record<string, unknown>) {
  if (!data || data.sender !== 'stream.video') {
    return;
  }

  const callCid = data.call_cid;
  if (!callCid || typeof callCid !== 'string') {
    return;
  }

  // Navigate to the meeting screen
  router.push('/meeting');
}
