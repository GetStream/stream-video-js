import {
  StreamVideoClient,
  StreamVideoRN,
  onAndroidNotifeeEvent,
  isNotifeeStreamVideoEvent,
  oniOSNotifeeEvent,
} from '@stream-io/video-react-native-sdk';
import { AndroidImportance } from '@notifee/react-native';
import { staticNavigate } from './staticNavigationUtils';
import { mmkvStorage } from '../contexts/createStoreContext';
import { createToken } from '../modules/helpers/createToken';
import { deeplinkCallId$ } from '../hooks/useDeepLinkEffect';
import { Platform } from 'react-native';
import notifee from '@notifee/react-native';
import { setFirebaseListeners } from './setFirebaseListeners';

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
        id: 'stream_incoming_call_channel_update2',
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
          } else if (type === 'call.missed') {
            return `Missed call from ${createdUserName}`;
          } else {
            return `${createdUserName} is notifying you about a call`;
          }
        },
        getBody(type, _createdUserName) {
          if (type === 'call.missed') {
            return 'Missed call!';
          } else {
            return 'Tap to open the call';
          }
        },
      },
    },
    createStreamVideoClient,
    onTapNonRingingCallNotification: (call_cid) => {
      const [callType, callId] = call_cid.split(':');
      if (callType === 'default') {
        deeplinkCallId$.next(callId); // reusing the deeplink logic for non ringing calls s
        staticNavigate({ name: 'Meeting', params: undefined });
      } else {
        console.error(
          `call type: ${callType}, not supported yet in this app!!`,
        );
      }
    },
  });

  setFirebaseListeners();
  if (Platform.OS === 'android') {
    // on press handlers of background notifications
    notifee.onBackgroundEvent(async (event) => {
      if (isNotifeeStreamVideoEvent(event)) {
        await onAndroidNotifeeEvent({ event, isBackground: true });
      }
    });
    // on press handlers of foreground notifications
    notifee.onForegroundEvent((event) => {
      if (isNotifeeStreamVideoEvent(event)) {
        onAndroidNotifeeEvent({ event, isBackground: false });
      }
    });
  }
  if (Platform.OS === 'ios') {
    // on press handlers of foreground notifications for iOS
    // note: used only for non-ringing notifications
    notifee.onForegroundEvent((event) => {
      if (isNotifeeStreamVideoEvent(event)) {
        oniOSNotifeeEvent({ event, isBackground: false });
      }
    });
  }
}

/**
 * Create a StreamVideoClient instance with the user details from mmkvStorage.
 * This is used to create a video client for incoming calls in the background on a push notification.
 */
const createStreamVideoClient = async () => {
  const userId = JSON.parse(mmkvStorage.getString('userId') ?? '');
  const userName = JSON.parse(mmkvStorage.getString('userName') ?? '');
  const userImageUrl = JSON.parse(mmkvStorage.getString('userImageUrl') ?? '');
  let appEnvironment = JSON.parse(
    mmkvStorage.getString('appEnvironment') ?? '',
  );
  if (appEnvironment !== 'pronto' || appEnvironment !== 'demo') {
    appEnvironment = 'pronto';
  }
  if (!userId || !userImageUrl) {
    return undefined;
  }
  const user = {
    id: userId,
    name: userName,
    imageUrl: userImageUrl,
  };
  const fetchAuthDetails = async () => {
    return await createToken({ user_id: user.id }, appEnvironment);
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
