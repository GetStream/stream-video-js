import { useEffect, useRef } from 'react';
import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';
// eslint-disable-next-line import/no-extraneous-dependencies
import PushNotificationIOS from '@react-native-community/push-notification-ios';

const PUSH_PROVIDER_NAME = 'rn-apn-video';

/**
 * Registers the APN device token with the Stream backend so that
 * non-ringing push notifications (call.live_started, call.notification, call.missed)
 * are delivered to this device.
 *
 * This is the iOS implementation. On Android, the .android.ts no-op is used
 * since the SDK already registers the Firebase token.
 */
export const useRegisterNonRingingPushToken = () => {
  const client = useStreamVideoClient();
  const lastToken = useRef<{ token: string; userId: string }>({
    token: '',
    userId: '',
  });

  useEffect(() => {
    if (!client) {
      return;
    }

    const userId = client.streamClient._user?.id ?? '';

    const registerToken = async (token: string) => {
      if (
        lastToken.current.token === token &&
        lastToken.current.userId === userId
      ) {
        return;
      }
      try {
        await client.addDevice(token, 'apn', PUSH_PROVIDER_NAME);
        lastToken.current = { token, userId };
      } catch (err) {
        console.warn(
          '[useRegisterNonRingingPushToken] Failed to register APN token',
          err,
        );
      }
    };

    // Listen for the APN device token
    PushNotificationIOS.addEventListener('register', (token: string) => {
      registerToken(token);
    });

    // Request permission and register for remote notifications
    PushNotificationIOS.requestPermissions().then((permissions) => {
      if (!permissions.alert && !permissions.badge && !permissions.sound) {
        console.warn(
          '[useRegisterNonRingingPushToken] Notification permission denied',
        );
      }
    });

    return () => {
      PushNotificationIOS.removeEventListener('register');

      // Remove device token from Stream backend on cleanup
      const { token } = lastToken.current;
      if (token) {
        client.removeDevice(token).catch((err: unknown) => {
          console.warn(
            '[useRegisterNonRingingPushToken] Failed to remove APN token',
            err,
          );
        });
        lastToken.current = { token: '', userId: '' };
      }
    };
  }, [client]);
};
