import messaging from '@react-native-firebase/messaging';
import {
  firebaseDataHandler,
  isFirebaseStreamVideoMessage,
} from '@stream-io/video-react-native-sdk';

export const setFirebaseListeners = () => {
  // Set up the background message handlers
  messaging().setBackgroundMessageHandler(async (msg) => {
    if (isFirebaseStreamVideoMessage(msg)) {
      await firebaseDataHandler(msg.data);
    }
  });
  // Set up the foreground message handlers
  messaging().onMessage((msg) => {
    if (isFirebaseStreamVideoMessage(msg)) {
      firebaseDataHandler(msg.data);
    }
  });
};
