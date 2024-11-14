import messaging from '@react-native-firebase/messaging';
import {
  isFirebaseStreamVideoMessage,
  firebaseDataHandler,
} from '@stream-io/video-react-native-sdk';

export const setFirebaseListeners = () => {
  // Set up the background message handler for
  // 1. incoming call notifications
  // 2. non-ringing notifications
  messaging().setBackgroundMessageHandler(async (msg) => {
    if (isFirebaseStreamVideoMessage(msg)) {
      await firebaseDataHandler(msg.data);
    }
  });
  // Set up the foreground message handler for
  // 1. incoming call notifications
  // 2. non-ringing notifications
  messaging().onMessage((msg) => {
    if (isFirebaseStreamVideoMessage(msg)) {
      firebaseDataHandler(msg.data);
    }
  });
};
