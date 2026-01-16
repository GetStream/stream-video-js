import { useCall } from '@stream-io/video-react-bindings';
import { useEffect, useRef } from 'react';
import {
  AppState,
  type AppStateStatus,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import { shouldDisableIOSLocalVideoOnBackgroundRef } from '../../utils/internal/shouldDisableIOSLocalVideoOnBackground';
import { disablePiPMode$, isInPiPMode$ } from '../../utils/internal/rxSubjects';
import { RxUtils, videoLoggerSystem } from '@stream-io/video-client';

const PIP_CHANGE_EVENT = 'StreamVideoReactNative_PIP_CHANGE_EVENT';
const ANDROID_APP_STATE_CHANGED_EVENT =
  'StreamVideoAppLifecycle_APP_STATE_CHANGED';

const isAndroid8OrAbove = Platform.OS === 'android' && Platform.Version >= 26;

// Does 2 functionalities:
// 1. Resume/Disable video stream tracks when app goes to background/foreground - To save on CPU resources
// 2. Handle PiP mode in Android
export const AppStateListener = () => {
  const call = useCall();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const cameraDisabledByAppState = useRef<boolean>(false);

  // on mount: set initial PiP mode and listen to PiP events
  useEffect(() => {
    if (!isAndroid8OrAbove) {
      return;
    }

    const disablePiP = RxUtils.getCurrentValue(disablePiPMode$);
    const logger = videoLoggerSystem.getLogger('AppStateListener');
    const initialPipMode =
      !disablePiP && AppState.currentState === 'background';
    isInPiPMode$.next(initialPipMode);
    logger.debug('Initial PiP mode on mount set to ', initialPipMode);

    NativeModules?.StreamVideoReactNative?.isInPiPMode().then(
      (isInPiP: boolean | null | undefined) => {
        isInPiPMode$.next(!!isInPiP);
        logger.debug(
          'Initial PiP mode on mount (after asking native module) set to ',
          !!isInPiP,
        );
      },
    );

    const eventEmitter = new NativeEventEmitter(
      NativeModules.StreamVideoReactNative,
    );

    const subscriptionPiPChange = eventEmitter.addListener(
      PIP_CHANGE_EVENT,
      (isInPiPMode: boolean) => {
        isInPiPMode$.next(isInPiPMode);
      },
    );

    return () => {
      subscriptionPiPChange.remove();
    };
  }, []);

  useEffect(() => {
    const logger = videoLoggerSystem.getLogger('AppStateListener');

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      logger.debug(
        'AppState changed to ',
        nextAppState,
        ' from ',
        appState.current,
      );

      // due to strange behavior in iOS when app goes to "inactive" state
      // we dont check for inactive states
      // ref: https://www.reddit.com/r/reactnative/comments/15kib42/appstate_behavior_in_ios_when_swiping_down_to/
      if (appState.current.match(/background/) && nextAppState === 'active') {
        if (call?.camera?.state.status === 'enabled') {
          // Android: when device is locked and resumed, the status isnt made disabled but stays enabled
          // iOS PiP: when local track was replaced by remote track, the local track shown is blank
          // as a workaround we stop the track and enable again if its already in enabled state
          const renableCamera = () =>
            call?.camera?.disable(true).then(() => {
              call?.camera?.enable();
            });
          if (Platform.OS === 'android') {
            NativeModules.StreamVideoReactNative.isCallAliveConfigured().then(
              (isCallAliveConfigured: boolean) => {
                if (!isCallAliveConfigured) {
                  renableCamera();
                }
              },
            );
          } else {
            renableCamera();
          }
          logger.debug('Disable and reenable camera as app came to foreground');
        } else {
          if (cameraDisabledByAppState.current) {
            call?.camera?.resume();
            cameraDisabledByAppState.current = false;
            logger.debug('Resume camera as app came to foreground');
          }
        }
        appState.current = nextAppState;
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/background/)
      ) {
        const disableCameraIfNeeded = () => {
          // check if keep call alive is configured
          // if not, then disable the camera as we are not able to keep the call alive in the background
          NativeModules.StreamVideoReactNative.isCallAliveConfigured().then(
            (isCallAliveConfigured: boolean) => {
              if (!isCallAliveConfigured) {
                if (call?.camera?.state.status === 'enabled') {
                  cameraDisabledByAppState.current = true;
                  call?.camera?.disable();
                  logger.debug('Camera disabled by app going to background');
                }
              }
            },
          );
        };
        if (Platform.OS === 'android') {
          // in Android, we need to check if we are in PiP mode
          // in PiP mode, we don't want to disable the camera
          if (isAndroid8OrAbove) {
            // set with an assumption that its enabled so that UI disabling happens faster
            const disablePiP = RxUtils.getCurrentValue(disablePiPMode$);
            isInPiPMode$.next(!disablePiP);
            // if PiP was not enabled anyway, then in the next code we ll set it to false and UI wont be shown anyway
            NativeModules?.StreamVideoReactNative?.isInPiPMode().then(
              (isInPiP: boolean | null | undefined) => {
                isInPiPMode$.next(!!isInPiP);
                if (!isInPiP) {
                  if (AppState.currentState === 'active') {
                    // this is to handle the case that the app became active as soon as it went to background
                    // in this case, we dont want to disable the camera
                    // this happens on foreground push notifications
                    return;
                  }
                  disableCameraIfNeeded();
                }
              },
            );
          } else {
            disableCameraIfNeeded();
          }
        } else {
          // shouldDisableIOSLocalVideoOnBackgroundRef is false, if local video is enabled on PiP
          if (shouldDisableIOSLocalVideoOnBackgroundRef.current) {
            disableCameraIfNeeded();
          }
        }
        appState.current = nextAppState;
      }
    };

    // for Android use our custom native module to listen to app state changes
    // because the default react-native AppState listener works for activity and ours works for application process
    if (Platform.OS === 'android') {
      const nativeModule = NativeModules.StreamVideoAppLifecycle;
      const eventEmitter = new NativeEventEmitter(nativeModule);
      let cancelled = false;

      nativeModule
        .getCurrentAppState()
        .then((initialState: AppStateStatus | null | undefined) => {
          if (cancelled) return;
          if (initialState === 'active' || initialState === 'background') {
            appState.current = initialState;
          }
        })
        .catch(() => {});

      const subscription = eventEmitter.addListener(
        ANDROID_APP_STATE_CHANGED_EVENT,
        (nextAppState: AppStateStatus) => {
          if (nextAppState === 'active' || nextAppState === 'background') {
            handleAppStateChange(nextAppState);
          }
        },
      );

      return () => {
        cancelled = true;
        subscription.remove();
      };
    }

    // for iOS use the default react-native AppState listener
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      handleAppStateChange(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [call]);

  return null;
};
