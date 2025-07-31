import {
  StreamVideoClient,
  StreamVideoRN,
} from '@stream-io/video-react-native-sdk';
import { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Users } from '../constants/Users';

const API_KEY = process.env.STREAM_API_KEY;

export function setPushConfig() {
  StreamVideoRN.setPushConfig({
    isExpo: true,
    ios: {
      pushProviderName: 'expo-apn-video-ringingtutorial',
    },
    android: {
      pushProviderName: 'expo-fcm-video',
      callChannel: {
        id: 'stream_call_notifications',
        name: 'Call notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      },
      incomingCallChannel: {
        id: 'stream_incoming_call',
        name: 'Incoming call notifications',
        importance: AndroidImportance.HIGH,
      },
      incomingCallNotificationTextGetters: {
        getTitle: (createdUserName: string) =>
          `Incoming call from ${createdUserName}`,
        getBody: () => 'Tap to open the call',
      },
    },
    createStreamVideoClient,
  });
}

/**
 * Create a StreamVideoClient instance with the user details from mmkvStorage.
 * This is used to create a video client for incoming calls in the background on a push notification.
 */
const createStreamVideoClient = async () => {
  const userId = await AsyncStorage.getItem('@userid-key');
  const userWithToken = Users.find((user) => user.id === userId);
  if (!userWithToken) {
    console.error(
      'Push - createStreamVideoClient -- userWithToken is undefined',
    );
    return;
  }
  return StreamVideoClient.getOrCreateInstance({
    apiKey: API_KEY,
    tokenProvider: () => Promise.resolve(userWithToken.token),
    user: { id: userWithToken.id, name: userWithToken.name },
  });
};
