import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import {
  isFirebaseStreamVideoMessage,
  firebaseDataHandler,
} from '@stream-io/video-react-native-sdk';
import notifee, { AndroidImportance } from '@notifee/react-native';
import {
  NON_RINGING_CHANNEL_ID,
  displayNonRingingNotification,
} from './notificationUtils';

async function handleNonRingingMessage(
  msg: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  // If FCM has a notification payload, the system already displayed it
  if (msg.notification) {
    return;
  }

  const data = msg.data;
  if (!data || data.sender !== 'stream.video' || !data.call_cid) {
    return;
  }

  await displayNonRingingNotification(data as Record<string, string>);
}

export const setNotificationListeners = () => {
  // Create Android notification channel
  notifee
    .createChannel({
      id: NON_RINGING_CHANNEL_ID,
      name: 'Call Notifications',
      importance: AndroidImportance.HIGH,
      vibration: true,
    })
    .catch((error) => {
      console.error('Error creating notification channel', error);
    });

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
      await firebaseDataHandler(msg.data);
      await handleNonRingingMessage(msg);
    }
  });
};
