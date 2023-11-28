import {
  StreamVideoClient,
  StreamVideoRN,
} from '@stream-io/video-react-native-sdk';
import { AndroidImportance } from '@notifee/react-native';
import { staticNavigate } from './staticNavigationUtils';
import { mmkvStorage } from '../contexts/createStoreContext';
import { createToken } from '../modules/helpers/createToken';
import { prontoCallId$ } from '../hooks/useProntoLinkEffect';

export function setPushConfig() {
  StreamVideoRN.setPushConfig({
    ios: {
      pushProviderName: 'rn-apn-video',
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
        id: 'stream_incoming_call',
        name: 'Incoming call notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
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
      staticNavigate({ name: 'Call', params: undefined });
    },
    navigateToIncomingCall: () => {
      staticNavigate({ name: 'Call', params: undefined });
    },
    onTapNonRingingCallNotification: (call_cid) => {
      const [callType, callId] = call_cid.split(':');
      if (callType === 'default') {
        prontoCallId$.next(callId); // reusing the deeplink logic for non ringing calls s
        staticNavigate({ name: 'Meeting', params: undefined });
      } else {
        console.error(
          `call type: ${callType}, not supported yet in this app!!`,
        );
      }
    },
  });
}

/**
 * Create a StreamVideoClient instance with the user details from mmkvStorage.
 * This is used to create a video client for incoming calls in the background on a push notification.
 */
const createStreamVideoClient = async () => {
  const userId = JSON.parse(mmkvStorage.getString('userId') ?? '');
  const userName = JSON.parse(mmkvStorage.getString('userName') ?? '');
  const userImageUrl = JSON.parse(mmkvStorage.getString('userImageUrl') ?? '');
  if (!userId || !userImageUrl) {
    return undefined;
  }
  const user = {
    id: userId,
    name: userName,
    imageUrl: userImageUrl,
  };
  const { token, apiKey } = await createToken({ user_id: user.id });
  const client = new StreamVideoClient({
    apiKey,
    user,
    token,
  });
  return client;
};
