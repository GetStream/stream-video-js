import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect, useRef } from 'react';
import { StreamVideoRN } from '../utils';
import {
  AppState,
  type AppStateStatus,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { CallingState, videoLoggerSystem } from '@stream-io/video-client';
import { keepCallAliveCallRef } from '../utils/keepCallAliveHeadlessTask';
import { getNotifeeLibNoThrowForKeepCallAlive } from '../utils/push/libs/notifee';
import { getCallingxLibIfAvailable } from '../utils/push/libs';

const notifeeLib = getNotifeeLibNoThrowForKeepCallAlive();

async function stopForegroundServiceNoThrow() {
  const logger = videoLoggerSystem.getLogger('stopForegroundServiceNoThrow');
  try {
    await NativeModules.StreamVideoReactNative.stopKeepCallAliveService();
  } catch (e) {
    logger.warn('Failed to stop keep-call-alive foreground service', e);
  }
}

async function startForegroundService(call_cid: string) {
  const logger = videoLoggerSystem.getLogger('startForegroundService');
  const isCallAliveConfigured = await (async () => {
    try {
      return await NativeModules.StreamVideoReactNative.isCallAliveConfigured();
    } catch (e) {
      logger.warn('Failed to check whether KeepCallAlive is configured', e);
      return false;
    }
  })();
  if (!isCallAliveConfigured) {
    logger.info(
      'KeepCallAlive is not configured. Skipping foreground service setup.',
    );
    return;
  }
  // Check for notification permission (Android 13+) before starting the service.
  const hasPostNotificationsPermission =
    Number(Platform.Version) < 33 ||
    (await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    ));
  if (!hasPostNotificationsPermission) {
    logger.info(
      'Notification permission not granted, can not start foreground service to keep the call alive',
    );
    return;
  }
  const videoConfig = StreamVideoRN.getConfig();
  const foregroundServiceConfig = videoConfig.foregroundService;
  const notificationTexts = foregroundServiceConfig.android.notificationTexts;
  const channel = foregroundServiceConfig.android.channel;
  const smallIconName = videoConfig.push?.android.smallIcon;

  // NOTE: we use requestAnimationFrame to ensure that the foreground service is started after all the current UI operations are done
  // this is a workaround for the crash - android.app.RemoteServiceException$ForegroundServiceDidNotStartInTimeException: Context.startForegroundService() did not then call Service.startForeground()
  // this crash was reproducible only in some android devices
  requestAnimationFrame(async () => {
    try {
      await NativeModules.StreamVideoReactNative.startKeepCallAliveService(
        call_cid,
        channel.id,
        channel.name,
        notificationTexts.title,
        notificationTexts.body,
        smallIconName ?? null,
      );
    } catch (e) {
      logger.warn('Failed to start keep-call-alive foreground service', e);
    }
  });
}

/**
 * This hook is used to keep the call alive in the background for Android.
 * It starts a foreground service to keep the call alive as soon as the call is joined
 * and stops the foreground Service when the call is left.
 * Additionally: also responsible for cancelling any notifee displayed notification when the call has transitioned out of ringing
 */
export const useAndroidKeepCallAliveEffect = () => {
  const foregroundServiceStartedRef = useRef(false);

  const call = useCall();
  keepCallAliveCallRef.current = call;
  const activeCallCid = call?.cid;
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const isOutgoingCall =
    callingState === CallingState.RINGING && call?.isCreatedByMe;
  const isCallJoined = callingState === CallingState.JOINED;
  const isNonRingingCall = !call?.ringing;

  const shouldStartForegroundService =
    !foregroundServiceStartedRef.current && (isOutgoingCall || isCallJoined);

  useEffect((): (() => void) | undefined => {
    if (Platform.OS === 'ios' || !activeCallCid) {
      return undefined;
    }

    const callingx = getCallingxLibIfAvailable();
    if (
      callingx?.isSetup &&
      isNonRingingCall &&
      callingx?.isOngoingCallsEnabled
    ) {
      return undefined;
    }

    // start foreground service as soon as the call is joined
    if (shouldStartForegroundService) {
      const run = async () => {
        if (foregroundServiceStartedRef.current) {
          return;
        }
        // Optional compatibility cleanup: if the app uses Notifee for ringing push,
        // we might have an incoming call notification running as a foreground service.
        if (notifeeLib) {
          const notifee = notifeeLib.default;
          const displayedNotifications =
            await notifee.getDisplayedNotifications();
          const activeCallNotification = displayedNotifications.find(
            (notification) => notification.id === activeCallCid,
          );
          if (activeCallNotification) {
            // this means that we have a incoming call notification shown as foreground service and we must stop it
            notifee.stopForegroundService();
            notifee.cancelDisplayedNotification(activeCallCid);
          }
        }

        await startForegroundService(activeCallCid);
        foregroundServiceStartedRef.current = true;
      };

      // ensure that app is active before running the function
      if (AppState.currentState === 'active') {
        run();
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
        if (notifeeLib) {
          notifeeLib.default.cancelDisplayedNotification(activeCallCid);
        }
      };
    } else if (
      callingState === CallingState.IDLE ||
      callingState === CallingState.LEFT
    ) {
      if (foregroundServiceStartedRef.current) {
        keepCallAliveCallRef.current = undefined;
        // stop foreground service when the call is not active
        stopForegroundServiceNoThrow();
        foregroundServiceStartedRef.current = false;
      } else {
        if (notifeeLib) {
          notifeeLib.default
            .getDisplayedNotifications()
            .then((displayedNotifications) => {
              const activeCallNotification = displayedNotifications.find(
                (notification) => notification.id === activeCallCid,
              );
              if (activeCallNotification) {
                // this means that we have a incoming call notification shown as foreground service and we must stop it
                notifeeLib.default.stopForegroundService();
              }
            });
        }
      }
    }
    return undefined;
  }, [
    activeCallCid,
    callingState,
    shouldStartForegroundService,
    isNonRingingCall,
  ]);

  useEffect(() => {
    return () => {
      // stop foreground service when this effect is unmounted
      if (foregroundServiceStartedRef.current) {
        keepCallAliveCallRef.current = undefined;
        stopForegroundServiceNoThrow();
        foregroundServiceStartedRef.current = false;
      }
    };
  }, []);
};
