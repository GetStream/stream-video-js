import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect, useRef } from 'react';
import { StreamVideoRN } from '../utils';
import { Platform } from 'react-native';
import { CallingState, getLogger } from '@stream-io/video-client';
import { getNotifeeLibNoThrowForKeepCallAlive } from '../utils/push/libs/notifee';

const isAndroid7OrBelow = Platform.OS === 'android' && Platform.Version < 26;

const notifeeLib = getNotifeeLibNoThrowForKeepCallAlive();

function setForegroundService() {
  if (!isAndroid7OrBelow) return;
  notifeeLib?.default.registerForegroundService(() => {
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
  if (!notifeeLib) return;
  const settings = await notifeeLib.default.getNotificationSettings();
  if (
    settings.authorizationStatus !== notifeeLib.AuthorizationStatus.AUTHORIZED
  ) {
    const logger = getLogger(['startForegroundService']);
    logger(
      'info',
      'Notification permission not granted, can not start foreground service to keep the call alive'
    );
    return;
  }
  // channel id is not required for notifee as its only used on android 7 and below here
  await notifeeLib.default.displayNotification({
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
    if (!notifeeLib) return;
    if (Platform.OS === 'ios' || !activeCallCid) {
      return;
    }

    // start foreground service as soon as the call is joined
    if (callingState === CallingState.JOINED) {
      const run = async () => {
        if (foregroundServiceStartedRef.current) {
          return;
        }
        const notifee = notifeeLib.default;
        notifee.getDisplayedNotifications().then((displayedNotifications) => {
          const activeCallNotification = displayedNotifications.find(
            (notification) => notification.id === activeCallCid
          );
          if (activeCallNotification) {
            // this means that we have a incoming call notification shown as foreground service and we must stop it
            notifee.stopForegroundService();
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
        notifeeLib.default.cancelDisplayedNotification(activeCallCid);
      };
    } else if (
      callingState === CallingState.IDLE ||
      callingState === CallingState.LEFT
    ) {
      if (foregroundServiceStartedRef.current) {
        // stop foreground service when the call is not active
        notifeeLib.default.stopForegroundService();
        foregroundServiceStartedRef.current = false;
      } else {
        notifeeLib.default
          .getDisplayedNotifications()
          .then((displayedNotifications) => {
            const activeCallNotification = displayedNotifications.find(
              (notification) => notification.id === activeCallCid
            );
            if (activeCallNotification) {
              // this means that we have a incoming call notification shown as foreground service and we must stop it
              notifeeLib.default.stopForegroundService();
            }
          });
      }
    }
  }, [activeCallCid, callingState]);

  useEffect(() => {
    return () => {
      // stop foreground service when this effect is unmounted
      if (foregroundServiceStartedRef.current) {
        if (!notifeeLib) return;
        notifeeLib.default.stopForegroundService();
        foregroundServiceStartedRef.current = false;
      }
    };
  }, []);
};
