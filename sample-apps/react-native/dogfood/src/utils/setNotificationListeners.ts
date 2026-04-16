// eslint-disable-next-line import/no-extraneous-dependencies
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { displayNonRingingNotification } from './notificationUtils';

export const setNotificationListeners = () => {
  // iOS: PushNotificationIOS receives APNs via AppDelegate forwarding.
  // Stream sends APNs with empty aps.alert, so we display via notifee.
  PushNotificationIOS.addEventListener('notification', (notification) => {
    const data = notification.getData();
    const stream = data?.stream;
    if (
      stream &&
      stream.sender === 'stream.video' &&
      stream.type !== 'call.ring'
    ) {
      notification.finish(PushNotificationIOS.FetchResult.NoData);
      displayNonRingingNotification(stream);
    }
    notification.finish(PushNotificationIOS.FetchResult.NoData);
  });
};
