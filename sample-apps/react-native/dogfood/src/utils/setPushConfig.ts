import {
  StreamVideoClient,
  StreamVideoRN,
} from '@stream-io/video-react-native-sdk';
import { AndroidImportance } from '@notifee/react-native';
import { STREAM_API_KEY } from 'react-native-dotenv';
import { staticNavigate } from './staticNavigationUtils';
import { mmkvStorage } from '../contexts/createStoreContext';
import { createToken } from '../modules/helpers/createToken';

export function setPushConfig() {
  StreamVideoRN.setPushConfig({
    ios: {
      pushProviderName: 'rn-apn-video',
    },
    android: {
      pushProviderName: 'rn-fcm-video',
      incomingCallChannel: {
        id: 'stream_incoming_call',
        name: 'Incoming call notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      },
      incomingCallNotificationTextGetters: {
        getTitle: (createdUserName: string) =>
          `Incoming call from ${createdUserName}`,
        getBody: (_createdUserName: string) => 'Tap to answer the call',
      },
    },
    createStreamVideoClient,
    navigateAcceptCall: () => {
      staticNavigate({ name: 'Call', params: undefined });
    },
    navigateToIncomingCall: () => {
      staticNavigate({ name: 'Call', params: undefined });
    },
  });
}

/**
 * Create a StreamVideoClient instance with the user details from mmkvStorage.
 * This is used to create a video client for incoming calls in the background on a push notification.
 */
const createStreamVideoClient = async () => {
  const userId = mmkvStorage.getString('userId');
  const userName = mmkvStorage.getString('userName');
  const userImageUrl = mmkvStorage.getString('userImageUrl');
  if (!userId || !userImageUrl) {
    return undefined;
  }
  const user = {
    id: userId,
    name: userName,
    imageUrl: userImageUrl,
  };
  return new StreamVideoClient({
    apiKey: STREAM_API_KEY,
    user,
    tokenProvider: async () => {
      const token = await createToken({ user_id: user.id });
      return token;
    },
  });
};
