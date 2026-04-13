import {
  StreamVideoClient,
  StreamVideoRN,
  type Call,
} from '@stream-io/video-react-native-sdk';
import { mmkvStorage } from '../contexts/createStoreContext';
import { createToken } from '../modules/helpers/createToken';
import { setFirebaseListeners } from './setFirebaseListeners';

export function setPushConfig() {
  StreamVideoRN.updateConfig({
    foregroundService: {
      android: {
        taskToRun: (call: Call) =>
          new Promise(() => {
            console.log(
              'jumping to foreground service with call-cid',
              call.cid,
            );
          }),
      },
    },
  });

  StreamVideoRN.setPushConfig({
    ios: {
      pushProviderName: 'rn-apn-video',
      callsHistory: true,
    },
    android: {
      pushProviderName: 'rn-fcm-video',
    },
    enableOngoingCalls: true,
    shouldRejectCallWhenBusy: false,
    createStreamVideoClient,
  });

  setFirebaseListeners();
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
  const { apiKey, token } = await fetchAuthDetails();
  const tokenProvider = () => fetchAuthDetails().then((auth) => auth.token);
  return StreamVideoClient.getOrCreateInstance({
    apiKey,
    user,
    token,
    tokenProvider,
    options: { logLevel: 'warn', rejectCallWhenBusy: false },
  });
};
