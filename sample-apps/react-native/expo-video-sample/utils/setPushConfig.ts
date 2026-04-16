import {
  StreamVideoClient,
  StreamVideoRN,
} from '@stream-io/video-react-native-sdk';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createToken } from './createToken';
import { setNotificationListeners } from './setNotificationListeners';
import { registerNonRingingNotificationHandler } from './registerNonRingingNotifications';

export function setPushConfig() {
  StreamVideoRN.setPushConfig({
    isExpo: true,
    ios: {
      pushProviderName: 'rn-expo-apn-video',
    },
    android: {
      pushProviderName: 'expo-fcm-video',
    },
    createStreamVideoClient,
  });

  setNotificationListeners();
  registerNonRingingNotificationHandler();

  if (Platform.OS === 'ios') {
    // show notification on foreground
    // https://docs.expo.dev/push-notifications/receiving-notifications/#foreground-notification-behavior
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // Suppress native banner for Stream non-ringing notifications
        // (aps.alert is empty — we display via notifee instead)
        const stream = notification.request.content.data?.stream as
          | Record<string, string>
          | undefined;
        if (stream?.sender === 'stream.video' && stream?.type !== 'call.ring') {
          return {
            shouldShowBanner: false,
            shouldShowList: false,
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
          };
        }
        return {
          shouldShowBanner: true,
          shouldShowList: false,
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        };
      },
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
  const { apiKey, token } = await fetchAuthDetails();
  const tokenProvider = () => fetchAuthDetails().then((auth) => auth.token);
  return StreamVideoClient.getOrCreateInstance({
    apiKey,
    user,
    token,
    tokenProvider,
    options: { logLevel: 'warn' },
  });
};
