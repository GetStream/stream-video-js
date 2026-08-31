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
import {
  endKeepCallAliveHeadlessTask,
  keepCallAliveCallRef,
} from '../utils/keepCallAliveHeadlessTask';
import { getCallingxLibIfAvailable } from '../utils/push/libs';

async function stopForegroundServiceNoThrow() {
  const logger = videoLoggerSystem.getLogger('stopForegroundServiceNoThrow');
  try {
    await NativeModules.StreamVideoReactNative.stopKeepCallAliveService();
  } catch (e) {
    logger.warn('Failed to stop keep-call-alive foreground service', e);
  }
}

/**
 * @returns true when the native foreground service was asked to start.
 */
async function startForegroundService(call_cid: string): Promise<boolean> {
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
    logger.warn(
      'KeepCallAlive is not configured, the call will not survive the app going to the ' +
        'background: audio publishing stops and the user is eventually dropped from the call. ' +
        'Declare android.permission.FOREGROUND_SERVICE and ' +
        'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK in the app manifest (see logcat, ' +
        'tag StreamVideoReactNative, for the exact list of missing permissions).',
    );
    return false;
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
    return false;
  }
  const videoConfig = StreamVideoRN.getConfig();
  const foregroundServiceConfig = videoConfig.foregroundService;
  const notificationTexts = foregroundServiceConfig.android.notificationTexts;
  const channel = foregroundServiceConfig.android.channel;
  const smallIconName = videoConfig.push?.android?.smallIcon;

  // NOTE: we use requestAnimationFrame to ensure that the foreground service is started after all the current UI operations are done
  // this is a workaround for the crash - android.app.RemoteServiceException$ForegroundServiceDidNotStartInTimeException: Context.startForegroundService() did not then call Service.startForeground()
  // this crash was reproducible only in some android devices
  return new Promise<boolean>((resolve) => {
    requestAnimationFrame(async () => {
      // The service declares the camera/microphone foreground service types, which are
      // while-in-use permissions: Android requires startForegroundService() to be called while the
      // app has a visible activity, otherwise the start is rejected. The frame we deferred to can
      // land after the app left the foreground, so re-check before calling native.
      if (AppState.currentState !== 'active') {
        logger.info(
          'App is no longer in the foreground, not starting the keep-call-alive foreground service',
        );
        resolve(false);
        return;
      }
      try {
        await NativeModules.StreamVideoReactNative.startKeepCallAliveService(
          call_cid,
          channel.id,
          channel.name,
          notificationTexts.title,
          notificationTexts.body,
          smallIconName ?? null,
        );
        resolve(true);
      } catch (e) {
        logger.warn('Failed to start keep-call-alive foreground service', e);
        resolve(false);
      }
    });
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
  const callingxKeepAliveOwnerRef = useRef<string | undefined>(undefined);

  const call = useCall();
  keepCallAliveCallRef.current = call;
  const activeCallCid = call?.cid;
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const isCallJoined = callingState === CallingState.JOINED;
  const isRingingCall = call?.ringing;

  const shouldStartForegroundService =
    !foregroundServiceStartedRef.current && isCallJoined;

  useEffect((): (() => void) | undefined => {
    if (Platform.OS === 'ios' || !activeCallCid) {
      return undefined;
    }

    const callingx = getCallingxLibIfAvailable();
    const isCallingxManaged =
      !!callingx?.isSetup &&
      (isRingingCall || (!isRingingCall && callingx?.isOngoingCallsEnabled));

    const isCallEnded =
      callingState === CallingState.IDLE || callingState === CallingState.LEFT;

    // Release the callingx keep-alive task when the call ends.
    if (callingxKeepAliveOwnerRef.current && isCallEnded) {
      const currentOwner = callingxKeepAliveOwnerRef.current;
      callingxKeepAliveOwnerRef.current = undefined;
      callingx?.releaseBackgroundTask(currentOwner).catch(() => {});
      return undefined;
    }

    if (isCallingxManaged && callingx) {
      // Mutual exclusion: never acquire the callingx task while the SDK's own keep-alive FGS is
      // running — only one keep-alive mechanism should be active per call.
      if (
        !callingxKeepAliveOwnerRef.current &&
        !isCallEnded &&
        !foregroundServiceStartedRef.current
      ) {
        const owner = `keepalive:${activeCallCid}`;
        callingxKeepAliveOwnerRef.current = owner;
        callingx.acquireBackgroundTask(owner).catch((e) => {
          if (callingxKeepAliveOwnerRef.current === owner) {
            callingxKeepAliveOwnerRef.current = undefined;
          }
          videoLoggerSystem
            .getLogger('useAndroidKeepCallAliveEffect')
            .warn('Failed to acquire callingx keep-alive background task', e);
        });
      }
      return undefined;
    }

    // Start keep-alive FGS as soon as the call is joined — but only if the callingx
    // keep-alive task isn't already holding the call alive.
    if (shouldStartForegroundService && !callingxKeepAliveOwnerRef.current) {
      const run = async () => {
        if (foregroundServiceStartedRef.current) {
          return;
        }

        // only mark as started when native actually accepted the start, so that a later render
        // while still joined can retry.
        foregroundServiceStartedRef.current =
          await startForegroundService(activeCallCid);
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
    } else if (isCallEnded) {
      if (foregroundServiceStartedRef.current) {
        keepCallAliveCallRef.current = undefined;
        // let the headless task resolve so RN unwinds it, then stop the foreground service
        endKeepCallAliveHeadlessTask();
        // stop foreground service when the call is not active
        stopForegroundServiceNoThrow();
        foregroundServiceStartedRef.current = false;
      }
    }
    return undefined;
  }, [
    activeCallCid,
    callingState,
    shouldStartForegroundService,
    isRingingCall,
  ]);

  useEffect(() => {
    return () => {
      // stop foreground service when this effect is unmounted
      if (foregroundServiceStartedRef.current) {
        keepCallAliveCallRef.current = undefined;
        endKeepCallAliveHeadlessTask();
        stopForegroundServiceNoThrow();
        foregroundServiceStartedRef.current = false;
      }
      // release the callingx keep-alive task if still held
      if (callingxKeepAliveOwnerRef.current) {
        const owner = callingxKeepAliveOwnerRef.current;
        callingxKeepAliveOwnerRef.current = undefined;
        getCallingxLibIfAvailable()
          ?.releaseBackgroundTask(owner)
          .catch(() => {
            videoLoggerSystem
              .getLogger('useAndroidKeepCallAliveEffect')
              .warn(
                'Failed to release callingx keep-alive background task',
                owner,
              );
          });
      }
    };
  }, []);
};
