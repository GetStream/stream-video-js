import {
  StreamVideoClient,
  StreamVideoRN,
} from '@stream-io/video-react-native-sdk';
import { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  staticNavigateToNonRingingCall,
  staticNavigateToRingingCall,
} from './staticNavigationUtils';
import { createToken } from './createToken';

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
        sound: 'default',
      },
      incomingCallChannel: {
        id: 'stream_incoming_call_update1',
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
        getBody(_type, _createdUserName) {
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
  const fetchAuthDetails = async () => {
    return await createToken({ user_id: user.id });
  };
  const { apiKey } = await fetchAuthDetails();
  const tokenProvider = () => fetchAuthDetails().then((auth) => auth.token);
  const client = StreamVideoClient.getOrCreateInstance({
    apiKey,
    user,
    tokenProvider,
    options: { logLevel: 'warn' },
  });
  return client;
};
