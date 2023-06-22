import { useCallCallingState } from '@stream-io/video-react-bindings';
import { useEffect, useRef } from 'react';
import notifee from '@notifee/react-native';
import { StreamVideoRN } from '../utils';
import { Platform } from 'react-native';
import { CallingState } from '@stream-io/video-client';

function setForegroundService() {
  if (Platform.OS !== 'android') {
    return;
  }
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
  const foregroundServiceConfig = StreamVideoRN.getConfig().foregroundService;
  const { title, body } = foregroundServiceConfig.android.notificationTexts;
  const channelId = foregroundServiceConfig.android.channel.id;
  await notifee.createChannel(foregroundServiceConfig.android.channel);
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      asForegroundService: true,
      ongoing: true, // user cannot dismiss the notification
      colorized: true,
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
    setForegroundService();
  }
  const foregroundServiceStartedRef = useRef(false);

  const callingState = useCallCallingState();

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    // start foreground service as soon as the call is joined
    if (callingState === CallingState.JOINED) {
      const run = async () => {
        if (foregroundServiceStartedRef.current) {
          return;
        }
        // request for notification permission and then start the foreground service
        await startForegroundService();
        foregroundServiceStartedRef.current = true;
      };
      run();
      return () => {
        if (!foregroundServiceStartedRef.current) {
          return;
        }
        // stop foreground service when the call is not active
        stopForegroundService();
        foregroundServiceStartedRef.current = false;
      };
    }
  }, [callingState]);
};
