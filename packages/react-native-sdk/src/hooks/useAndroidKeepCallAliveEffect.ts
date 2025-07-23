import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect, useRef } from 'react';
import { StreamVideoRN } from '../utils';
import {
  AppState,
  type AppStateStatus,
  NativeModules,
  Platform,
} from 'react-native';
import { Call, CallingState, getLogger } from '@stream-io/video-client';
import {
  getKeepCallAliveForegroundServiceTypes,
  getNotifeeLibNoThrowForKeepCallAlive,
} from '../utils/push/libs/notifee';

const notifeeLib = getNotifeeLibNoThrowForKeepCallAlive();
const callToPassToForegroundService: { current: Call | undefined } = {
  current: undefined,
};

function setForegroundService() {
  if (Platform.OS === 'ios' || !notifeeLib) return;
  NativeModules.StreamVideoReactNative.isCallAliveConfigured().then(
    (isConfigured: boolean) => {
      if (!isConfigured) {
        const logger = getLogger(['setForegroundService method']);
        logger(
          'info',
          'KeepCallAlive is not configured. Skipping foreground service setup.',
        );
        return;
      }
      notifeeLib.default.registerForegroundService(() => {
        const task = new Promise((resolve) => {
          const logger = getLogger(['setForegroundService method']);
          logger('info', 'Foreground service running for call in progress');
          // any task to run from SDK in the foreground service must be added
          resolve(true);
        });
        const videoConfig = StreamVideoRN.getConfig();
        const foregroundServiceConfig = videoConfig.foregroundService;
        const { taskToRun } = foregroundServiceConfig.android;
        const call = callToPassToForegroundService.current;
        if (!call) {
          const logger = getLogger(['setForegroundService method']);
          logger('warn', 'No call to pass to foreground service');
          return task.then(() => new Promise(() => {}));
        }
        callToPassToForegroundService.current = undefined;
        return task.then(() => taskToRun(call));
      });
    },
  );
}

async function startForegroundService(call_cid: string) {
  const isCallAliveConfigured =
    await NativeModules.StreamVideoReactNative.isCallAliveConfigured();
  if (!isCallAliveConfigured) {
    const logger = getLogger(['startForegroundService']);
    logger(
      'info',
      'KeepCallAlive is not configured. Skipping foreground service setup.',
    );
    return;
  }
  // check for notification permission and then start the foreground service
  if (!notifeeLib) return;
  const settings = await notifeeLib.default.getNotificationSettings();
  if (
    settings.authorizationStatus !== notifeeLib.AuthorizationStatus.AUTHORIZED
  ) {
    const logger = getLogger(['startForegroundService']);
    logger(
      'info',
      'Notification permission not granted, can not start foreground service to keep the call alive',
    );
    return;
  }
  const videoConfig = StreamVideoRN.getConfig();
  const foregroundServiceConfig = videoConfig.foregroundService;
  const notificationTexts = foregroundServiceConfig.android.notificationTexts;
  const channelId = foregroundServiceConfig.android.channel.id;
  await notifeeLib.default.createChannel(
    foregroundServiceConfig.android.channel,
  );
  const foregroundServiceTypes = await getKeepCallAliveForegroundServiceTypes();
  // NOTE: we use requestAnimationFrame to ensure that the foreground service is started after all the current UI operations are done
  // this is a workaround for the crash - android.app.RemoteServiceException$ForegroundServiceDidNotStartInTimeException: Context.startForegroundService() did not then call Service.startForeground()
  // this crash was reproducible only in some android devices
  requestAnimationFrame(() => {
    notifeeLib.default.displayNotification({
      id: call_cid,
      title: notificationTexts.title,
      body: notificationTexts.body,
      android: {
        channelId,
        smallIcon: videoConfig.push?.android.smallIcon,
        foregroundServiceTypes,
        asForegroundService: true,
        ongoing: true, // user cannot dismiss the notification
        colorized: true,
        pressAction: {
          id: 'default',
          launchActivity: 'default', // open the app when the notification is pressed
        },
      },
    });
  });
}

// flag to check if setForegroundService has already been run once
let isSetForegroundServiceRan = false;

/**
 * This hook is used to keep the call alive in the background for Android.
 * It starts a foreground service to keep the call alive as soon as the call is joined
 * and stops the foreground Service when the call is left.
 * Additionally: also responsible for cancelling any notifee displayed notification when the call has transitioned out of ringing
 */
export const useAndroidKeepCallAliveEffect = () => {
  const foregroundServiceStartedRef = useRef(false);

  const call = useCall();
  callToPassToForegroundService.current = call;
  const activeCallCid = call?.cid;
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const isOutgoingCall =
    callingState === CallingState.RINGING && call?.isCreatedByMe;
  const isCallJoined = callingState === CallingState.JOINED;

  const shouldStartForegroundService =
    !foregroundServiceStartedRef.current && (isOutgoingCall || isCallJoined);

  useEffect((): (() => void) | undefined => {
    if (Platform.OS === 'ios' || !activeCallCid) {
      return undefined;
    }
    if (!notifeeLib) return undefined;

    // start foreground service as soon as the call is joined
    if (shouldStartForegroundService) {
      const run = async () => {
        if (foregroundServiceStartedRef.current) {
          return;
        }
        if (!isSetForegroundServiceRan) {
          isSetForegroundServiceRan = true;
          setForegroundService();
        }
        const notifee = notifeeLib.default;
        const displayedNotifications =
          await notifee.getDisplayedNotifications();
        const activeCallNotification = displayedNotifications.find(
          (notification) => notification.id === activeCallCid,
        );
        if (activeCallNotification) {
          callToPassToForegroundService.current = undefined;
          // this means that we have a incoming call notification shown as foreground service and we must stop it
          notifee.stopForegroundService();
          notifee.cancelDisplayedNotification(activeCallCid);
        }
        // check for notification permission and then start the foreground service

        await startForegroundService(activeCallCid);
        foregroundServiceStartedRef.current = true;
      };

      // ensure that app is active before running the function
      if (AppState.currentState === 'active') {
        run();
        return undefined;
      }
      const sub = AppState.addEventListener(
        'change',
        (nextAppState: AppStateStatus) => {
          if (nextAppState === 'active') {
            run();
            sub.remove();
          }
        },
      );
      return () => {
        sub.remove();
      };
    } else if (callingState === CallingState.RINGING) {
      return () => {
        // cancel any notifee displayed notification when the call has transitioned out of ringing
        // NOTE: cancels only the non fg service notifications
        notifeeLib.default.cancelDisplayedNotification(activeCallCid);
      };
    } else if (
      callingState === CallingState.IDLE ||
      callingState === CallingState.LEFT
    ) {
      if (foregroundServiceStartedRef.current) {
        callToPassToForegroundService.current = undefined;
        // stop foreground service when the call is not active
        notifeeLib.default.stopForegroundService();
        foregroundServiceStartedRef.current = false;
      } else {
        notifeeLib.default
          .getDisplayedNotifications()
          .then((displayedNotifications) => {
            const activeCallNotification = displayedNotifications.find(
              (notification) => notification.id === activeCallCid,
            );
            if (activeCallNotification) {
              callToPassToForegroundService.current = undefined;
              // this means that we have a incoming call notification shown as foreground service and we must stop it
              notifeeLib.default.stopForegroundService();
            }
          });
      }
    }
    return undefined;
  }, [activeCallCid, callingState, shouldStartForegroundService]);

  useEffect(() => {
    return () => {
      // stop foreground service when this effect is unmounted
      if (foregroundServiceStartedRef.current) {
        if (!notifeeLib) return;
        callToPassToForegroundService.current = undefined;
        notifeeLib.default.stopForegroundService();
        foregroundServiceStartedRef.current = false;
      }
    };
  }, []);
};
