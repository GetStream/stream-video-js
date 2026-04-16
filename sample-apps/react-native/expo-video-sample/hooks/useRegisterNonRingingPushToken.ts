import { useEffect, useRef } from 'react';
import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';
import * as Notifications from 'expo-notifications';

const PUSH_PROVIDER_NAME = 'rn-expo-apn-video';

/**
 * Registers the APN device token with the Stream backend so that
 * non-ringing push notifications (call.live_started, call.notification, call.missed)
 * are delivered to this device.
 *
 * On Android this is a no-op (.android.ts) — the SDK handles Firebase token registration.
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

    const setup = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn(
          '[useRegisterNonRingingPushToken] Notification permission denied',
        );
        return;
      }

      // Get the native APN device token
      const devicePushToken = await Notifications.getDevicePushTokenAsync();
      if (devicePushToken?.data) {
        await registerToken(devicePushToken.data as string);
      }
    };

    setup();

    // Listen for token refresh
    const subscription = Notifications.addPushTokenListener(
      (devicePushToken) => {
        registerToken(devicePushToken.data as string);
      },
    );

    return () => {
      subscription.remove();

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
