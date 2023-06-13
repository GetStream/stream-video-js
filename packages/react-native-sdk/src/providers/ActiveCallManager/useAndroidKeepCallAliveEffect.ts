import { useCall } from '@stream-io/video-react-bindings';
import { useRef, useEffect } from 'react';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { StreamVideoRN } from '../../utils';
import { Platform } from 'react-native';
import { CallingState } from '@stream-io/video-client';

async function setForegroundService() {
  if (Platform.OS !== 'android') {
    return;
  }
  await notifee.createChannel(
    StreamVideoRN.getConfig().android_foregroundServiceChannel,
  );
  notifee.registerForegroundService(() => {
    return new Promise(() => {
      console.log('Foreground service running for call in progress');
    });
  });
}

async function startForegroundService() {
  if (Platform.OS !== 'android') {
    return;
  }
  const { title, body } =
    StreamVideoRN.getConfig().android_foregroundServiceNotificationTexts;
  const channelId =
    StreamVideoRN.getConfig().android_foregroundServiceChannel.id;
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      asForegroundService: true,
      ongoing: true, // user cannot dismiss the notification
      pressAction: {
        id: 'default',
        launchActivity: 'default', // open the app when the notification is pressed
      },
    },
  });
}

async function stopForegroundService() {
  if (Platform.OS !== 'android') {
    return;
  }
  await notifee.stopForegroundService();
}

// flag to check if setForegroundService has already been run once
let isSetForegroundServiceRan = false;

/**
 * This hook is used to keep the call alive in the background for Android.
 * It starts a foreground service to keep the call alive as soon as the call is joined
 * and stops the foreground Service when the call is left.
 */
export const useAndroidKeepCallAliveEffect = () => {
  if (!isSetForegroundServiceRan && Platform.OS === 'android') {
    isSetForegroundServiceRan = true;
    setForegroundService().catch((err) =>
      console.error('setForegroundService error:', err),
    );
  }
  const foregroundServiceStartedRef = useRef(false);
  const call = useCall();
  const callingState$ = call?.state.callingState$;

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    if (!callingState$ && foregroundServiceStartedRef.current) {
      // there is no call object so stop the foreground service if present
      stopForegroundService();
      foregroundServiceStartedRef.current = false;
      return;
    }
    const subscription = callingState$?.subscribe(
      (callingState: CallingState) => {
        // start foreground service as soon as the call is joined
        if (callingState === CallingState.JOINED) {
          const run = async () => {
            if (foregroundServiceStartedRef.current) {
              return;
            }
            // request for notification permission and then start the foreground service
            const settings = await notifee.requestPermission();
            if (
              settings.authorizationStatus === AuthorizationStatus.AUTHORIZED
            ) {
              await startForegroundService();
              foregroundServiceStartedRef.current = true;
            }
          };
          run();
        } else {
          if (!foregroundServiceStartedRef.current) {
            return;
          }
          // stop foreground service when the call is not active
          stopForegroundService();
          foregroundServiceStartedRef.current = false;
          return;
        }
      },
    );
    return () => {
      subscription?.unsubscribe();
    };
  }, [callingState$]);
};
