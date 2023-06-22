import {
  StreamVideoClient,
  StreamVideoRN,
} from '@stream-io/video-react-native-sdk';
import { AndroidImportance } from '@notifee/react-native';
import { STREAM_API_KEY } from 'react-native-dotenv';
import { StaticNavigationService } from './staticNavigationUtils';
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
      },
      incomingCallNotificationTextGetters: {
        getTitle: (createdUserName: string) =>
          `Incoming call from ${createdUserName}`,
        getBody: (_createdUserName: string) => 'Tap to answer the call',
      },
    },
    createStreamVideoClient,
    navigateAcceptCall: () => {
      StaticNavigationService.navigate('Call');
    },
    navigateToIncomingCall: () => {
      StaticNavigationService.navigate('Call');
    },
  });
}

/**
 * Create a StreamVideoClient instance with the user details from mmkvStorage.
 * This is used to create a video client for incoming calls in the background on a push notification.
 */
const createStreamVideoClient = async () => {
  const userName = mmkvStorage.getString('username');
  const userImageUrl = mmkvStorage.getString('userImageUrl');
  if (!userName || !userImageUrl) {
    return undefined;
  }
  const user = {
    id: userName,
    name: userImageUrl,
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
