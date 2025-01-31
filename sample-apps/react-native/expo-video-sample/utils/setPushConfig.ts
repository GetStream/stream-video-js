import {
  StreamVideoClient,
  StreamVideoRN,
  oniOSNotifeeEvent,
  isNotifeeStreamVideoEvent,
  onAndroidNotifeeEvent,
} from '@stream-io/video-react-native-sdk';
import { Platform } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { staticNavigateToNonRingingCall } from './staticNavigationUtils';
import { createToken } from './createToken';
import { setFirebaseListeners } from './setFirebaseListeners';

export function setPushConfig() {
  StreamVideoRN.setPushConfig({
    isExpo: true,
    ios: {
      pushProviderName: 'rn-expo-apn-video',
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
    onTapNonRingingCallNotification: (_cid, _type) => {
      staticNavigateToNonRingingCall();
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
    // show notification on foreground
    // https://docs.expo.dev/push-notifications/receiving-notifications/#foreground-notification-behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

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
