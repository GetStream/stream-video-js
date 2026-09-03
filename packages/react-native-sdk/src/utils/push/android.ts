import { StreamVideoClient, videoLoggerSystem } from '@stream-io/video-client';
import { Platform } from 'react-native';
import type { StreamVideoConfig } from '../StreamVideoRN/types';
import { getFirebaseMessagingLib } from './libs';
import { setPushLogoutCallback } from '../internal/pushLogoutCallback';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

let lastFirebaseToken = { token: '', userId: '' };

/** Send token to stream  */
export async function initAndroidPushToken(
  client: StreamVideoClient,
  pushConfig: PushConfig,
  setUnsubscribeListener: (unsubscribe: () => void) => void,
) {
  if (Platform.OS !== 'android' || !pushConfig.android?.pushProviderName) {
    return;
  }
  const logger = videoLoggerSystem.getLogger('initAndroidPushToken');
  const setDeviceToken = async (token: string) => {
    const userId = client.streamClient._user?.id ?? '';
    if (client.streamClient.anonymous) {
      logger.debug('Skipped sending firebase token for anonymous user');
      return;
    }
    if (
      lastFirebaseToken.token === token &&
      lastFirebaseToken.userId === userId
    ) {
      logger.debug(
        `Skipping setting the same token again for userId: ${userId} and token: ${token}`,
      );
      return;
    }
    lastFirebaseToken = { token, userId };
    setPushLogoutCallback(async () => {
      lastFirebaseToken = { token: '', userId: '' };
      try {
        logger.debug(`Logout removeDeviceToken: ${token}`);
        await client.removeDevice(token);
      } catch (err) {
        logger.warn('Failed to remove firebase token from stream', err);
      }
    });
    const push_provider_name = pushConfig.android?.pushProviderName;
    logger.debug(`sending firebase token: ${token} for userId: ${userId}`);
    await client.addDevice(token, 'firebase', push_provider_name);
  };

  const messaging = getFirebaseMessagingLib();
  logger.debug(`setting firebase token listeners`);
  const unsubscribe = messaging().onTokenRefresh((refreshedToken) =>
    setDeviceToken(refreshedToken),
  );
  setUnsubscribeListener(unsubscribe);
  const token = await messaging().getToken();
  await setDeviceToken(token);
}

let firebaseDataHandlerDeprecationLogged = false;
/**
 * @deprecated Ring notifications are now handled by the SDK internally. This method is a no-op;
 * you can safely remove `firebaseDataHandler(...)` wiring from your Firebase messaging handlers.
 */
export const firebaseDataHandler = async (data?: any) => {
  void data;
  if (!firebaseDataHandlerDeprecationLogged) {
    firebaseDataHandlerDeprecationLogged = true;
    console.warn(
      '[@stream-io/video-react-native-sdk] `firebaseDataHandler` is deprecated. Ring notifications are now handled by the SDK internally — you can remove calls to it from your Firebase messaging handlers.',
    );
  }
};
