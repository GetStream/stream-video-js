import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect, useRef } from 'react';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { StreamVideoRN } from '../utils';
import { Platform } from 'react-native';
import { CallingState, getLogger } from '@stream-io/video-client';

const isAndroid7OrBelow = Platform.OS === 'android' && Platform.Version < 26;

function setForegroundService() {
  if (!isAndroid7OrBelow) return;
  notifee.registerForegroundService(() => {
    return new Promise(() => {
      const logger = getLogger(['setForegroundService method']);
      logger('info', 'Foreground service running for call in progress');
    });
  });
}

async function startForegroundService(call_cid: string) {
  if (!isAndroid7OrBelow) return;
  const foregroundServiceConfig = StreamVideoRN.getConfig().foregroundService;
  const { title, body } = foregroundServiceConfig.android.notificationTexts;

  // request for notification permission and then start the foreground service
  const settings = await notifee.getNotificationSettings();
  if (settings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
    const logger = getLogger(['startForegroundService']);
    logger(
      'info',
      'Notification permission not granted, can not start foreground service to keep the call alive'
    );
    return;
  }
  await notifee.displayNotification({
    id: call_cid,
    title,
    body,
    android: {
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
  if (!isAndroid7OrBelow) return;
  await notifee.stopForegroundService();
}

// flag to check if setForegroundService has already been run once
let isSetForegroundServiceRan = false;

/**
 * This hook is used to keep the call alive in the background for Android.
 * It starts a foreground service to keep the call alive as soon as the call is joined
 * and stops the foreground Service when the call is left.
 * Additonally: also responsible for cancelling any notifee displayed notification when the call has transitioned out of ringing
 */
export const useAndroidKeepCallAliveEffect = () => {
  if (!isSetForegroundServiceRan && isAndroid7OrBelow) {
    isSetForegroundServiceRan = true;
    setForegroundService();
  }
  const foregroundServiceStartedRef = useRef(false);

  const activeCallCid = useCall()?.cid;
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  useEffect((): (() => void) | undefined => {
    if (Platform.OS === 'ios' || !activeCallCid) {
      return;
    }

    // start foreground service as soon as the call is joined
    if (callingState === CallingState.JOINED) {
      const run = async () => {
        if (foregroundServiceStartedRef.current) {
          return;
        }
        notifee.getDisplayedNotifications().then((displayedNotifications) => {
          const activeCallNotification = displayedNotifications.find(
            (notification) => notification.id === activeCallCid
          );
          if (activeCallNotification) {
            // this means that we have a incoming call notification shown as foreground service and we must stop it
            if (isAndroid7OrBelow) {
              notifee.stopForegroundService();
            }
            notifee.cancelDisplayedNotification(activeCallCid);
          }
          // request for notification permission and then start the foreground service
          startForegroundService(activeCallCid).then(() => {
            foregroundServiceStartedRef.current = true;
          });
        });
      };
      run();
    } else if (callingState === CallingState.RINGING) {
      // cancel any notifee displayed notification when the call has transitioned out of ringing
      return () => {
        // cancels the non fg service notifications
        notifee.cancelDisplayedNotification(activeCallCid);
      };
    } else if (
      callingState === CallingState.IDLE ||
      callingState === CallingState.LEFT
    ) {
      if (foregroundServiceStartedRef.current) {
        // stop foreground service when the call is not active
        stopForegroundService();
        foregroundServiceStartedRef.current = false;
      } else {
        notifee.getDisplayedNotifications().then((displayedNotifications) => {
          const activeCallNotification = displayedNotifications.find(
            (notification) => notification.id === activeCallCid
          );
          if (activeCallNotification) {
            // this means that we have a incoming call notification shown as foreground service and we must stop it
            notifee.stopForegroundService();
          }
        });
      }
    }
  }, [activeCallCid, callingState]);

  useEffect(() => {
    return () => {
      // stop foreground service when this effect is unmounted
      if (foregroundServiceStartedRef.current) {
        stopForegroundService();
        foregroundServiceStartedRef.current = false;
      }
    };
  }, []);
};
