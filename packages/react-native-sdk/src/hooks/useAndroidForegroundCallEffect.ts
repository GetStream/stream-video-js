import { useCall } from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import notifee from '@notifee/react-native';
import { StreamVideoRN } from '../utils';

async function setForegroundService() {
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
      ongoing: true,
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
    },
  });
}

async function stopForegroundService() {
  await notifee.stopForegroundService();
}

// flag to check if setForegroundService has already been run once
let isSetForegroundServiceRan = false;

/**
 * This hook is used to keep the call alive in the background for Android.
 */
export const useAndroidForegroundCallEffect = () => {
  if (!isSetForegroundServiceRan) {
    isSetForegroundServiceRan = true;
    setForegroundService().catch((err) =>
      console.error('setForegroundService error:', err),
    );
  }
  const activeCall = useCall();
  useEffect(() => {
    if (!activeCall) {
      return;
    }
    startForegroundService();
    return () => {
      stopForegroundService();
    };
  }, [activeCall]);
};
