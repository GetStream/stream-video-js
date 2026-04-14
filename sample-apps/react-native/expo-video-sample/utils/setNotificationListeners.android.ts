import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import {
  isFirebaseStreamVideoMessage,
  firebaseDataHandler,
} from '@stream-io/video-react-native-sdk';
import {
  displayNonRingingNotification,
  ensureNotificationChannel,
} from './notificationUtils';

async function handleNonRingingMessage(
  msg: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  // If FCM has a notification payload, the system already displayed it
  if (msg.notification) {
    return;
  }

  const data = msg.data;
  if (!data || data.sender !== 'stream.video') {
    return;
  }

  await displayNonRingingNotification(data as Record<string, string>);
}

export const setNotificationListeners = () => {
  // Create Android notification channel
  ensureNotificationChannel();

  // Background message handler
  messaging().setBackgroundMessageHandler(async (msg) => {
    if (isFirebaseStreamVideoMessage(msg)) {
      await firebaseDataHandler(msg.data);
      await handleNonRingingMessage(msg);
    }
  });

  // Foreground message handler
  messaging().onMessage(async (msg) => {
    if (isFirebaseStreamVideoMessage(msg)) {
      firebaseDataHandler(msg.data);
      await handleNonRingingMessage(msg);
    }
  });
};
