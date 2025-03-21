import messaging from '@react-native-firebase/messaging';
import {
  firebaseDataHandler,
  isFirebaseStreamVideoMessage,
  isNotifeeStreamVideoEvent,
  onAndroidNotifeeEvent,
} from '@stream-io/video-react-native-sdk';
import notifee from '@notifee/react-native';

export const setFirebaseListeners = () => {
  // Set up the background message handlers
  messaging().setBackgroundMessageHandler(async (msg) => {
    if (isFirebaseStreamVideoMessage(msg)) {
      await firebaseDataHandler(msg.data);
    }
  });
  notifee.onBackgroundEvent(async (event) => {
    if (isNotifeeStreamVideoEvent(event)) {
      await onAndroidNotifeeEvent({ event, isBackground: true });
    }
  });
  // Set up the foreground message handlers
  messaging().onMessage((msg) => {
    if (isFirebaseStreamVideoMessage(msg)) {
      firebaseDataHandler(msg.data);
    }
  });
  notifee.onForegroundEvent((event) => {
    if (isNotifeeStreamVideoEvent(event)) {
      onAndroidNotifeeEvent({ event, isBackground: false });
    }
  });
};
