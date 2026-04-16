import * as Notifications from 'expo-notifications';
import { displayNonRingingNotification } from './notificationUtils';

export const setNotificationListeners = () => {
  // iOS: expo-notifications receives APNs via Expo's native handling.
  // Stream sends APNs with empty aps.alert, so we display via notifee.
  Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data;
    const stream = data?.stream as Record<string, string> | undefined;
    if (
      stream &&
      stream.sender === 'stream.video' &&
      stream.type !== 'call.ring'
    ) {
      displayNonRingingNotification(stream);
    }
  });
};
