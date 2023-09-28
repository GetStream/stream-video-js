import {
  StreamVideoClient,
  StreamVideoRN,
} from '@stream-io/video-react-native-sdk';
import { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STREAM_API_KEY } from '../data/constants';
import {
  staticNavigateToNonRingingCall,
  staticNavigateToRingingCall,
} from './staticNavigationUtils';

export function setPushConfig() {
  StreamVideoRN.setPushConfig({
    isExpo: true,
    ios: {
      pushProviderName: 'rn-expo-apn-video',
    },
    android: {
      pushProviderName: 'rn-fcm-video',
      callChannel: {
        id: 'stream_call_notifications',
        name: 'Call notifications',
        importance: AndroidImportance.HIGH,
      },
      incomingCallChannel: {
        id: 'stream_incoming_call',
        name: 'Incoming call notifications',
        importance: AndroidImportance.HIGH,
      },
      incomingCallNotificationTextGetters: {
        getTitle: (createdUserName: string) =>
          `Incoming call from ${createdUserName}`,
        getBody: (_createdUserName: string) => 'Tap to open the call',
      },
      callNotificationTextGetters: {
        getTitle(type, createdUserName) {
          if (type === 'call.live_started') {
            return `Call went live, it was started by ${createdUserName}`;
          } else {
            return `${createdUserName} is notifying you about a call`;
          }
        },
        getBody(_type, createdUserName) {
          return 'Tap to open the call';
        },
      },
    },
    createStreamVideoClient,
    navigateAcceptCall: () => {
      staticNavigateToRingingCall();
    },
    navigateToIncomingCall: () => {
      staticNavigateToRingingCall();
    },
    onTapNonRingingCallNotification: (_cid, _type) => {
      staticNavigateToNonRingingCall();
    },
  });
}

/**
 * Create a StreamVideoClient instance with the user details from mmkvStorage.
 * This is used to create a video client for incoming calls in the background on a push notification.
 */
const createStreamVideoClient = async () => {
  const userJson = await AsyncStorage.getItem('my-user');
  const user = JSON.parse(userJson ?? '');
  if (user.id === undefined) {
    console.error('Push - createStreamVideoClient -- user.id is undefined');
    return;
  }
  const client = new StreamVideoClient({
    apiKey: STREAM_API_KEY,
    user,
    tokenProvider: user.custom.token,
    options: { logLevel: 'warn' },
  });
  return client;
};
