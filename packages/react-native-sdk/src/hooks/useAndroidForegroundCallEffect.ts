import { useCall } from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import notifee, { AndroidImportance } from '@notifee/react-native';

const FOREGROUND_SERVICE_CHANNEL_ID = 'stream_call_foreground_service';

async function setForegroundService() {
  await notifee.createChannel({
    id: FOREGROUND_SERVICE_CHANNEL_ID,
    name: 'Service to keep call alive', // TODO: allow user to customise this
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
  });
  notifee.registerForegroundService(() => {
    return new Promise(() => {
      console.log('Foreground service running for call in progress');
    });
  });
}

async function startForegroundService() {
  // TODO: allow user to customise this
  await notifee.displayNotification({
    title: 'Call in progress',
    body: 'Tap to return to the call',
    android: {
      channelId: FOREGROUND_SERVICE_CHANNEL_ID,
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
