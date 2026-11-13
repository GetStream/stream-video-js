import {
  getMessaging,
  setBackgroundMessageHandler,
  onMessage,
  RemoteMessage,
} from '@react-native-firebase/messaging';
import { isFirebaseStreamVideoMessage } from '@stream-io/video-react-native-sdk';
import notifee, { AndroidImportance } from '@notifee/react-native';
import {
  NON_RINGING_CHANNEL_ID,
  displayNonRingingNotification,
} from './notificationUtils';

async function handleNonRingingMessage(msg: RemoteMessage): Promise<void> {
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

  const messagingInstance = getMessaging();

  // Background message handler
  setBackgroundMessageHandler(messagingInstance, async (msg) => {
    if (isFirebaseStreamVideoMessage(msg)) {
      await handleNonRingingMessage(msg);
    }
  });

  // Foreground message handler
  onMessage(messagingInstance, async (msg) => {
    if (isFirebaseStreamVideoMessage(msg)) {
      await handleNonRingingMessage(msg);
    }
  });
};
