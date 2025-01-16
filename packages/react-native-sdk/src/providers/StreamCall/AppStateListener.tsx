import { useCall } from '@stream-io/video-react-bindings';
import { useEffect, useRef } from 'react';
import {
  AppState,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import { shouldDisableIOSLocalVideoOnBackgroundRef } from '../../utils/internal/shouldDisableIOSLocalVideoOnBackground';
import {
  disablePiPMode$,
  isInPiPModeAndroid$,
} from '../../utils/internal/rxSubjects';
import { RxUtils } from '@stream-io/video-client';

const PIP_CHANGE_EVENT = 'StreamVideoReactNative_PIP_CHANGE_EVENT';

const isAndroid8OrAbove = Platform.OS === 'android' && Platform.Version >= 26;

// Does 2 functionalities:
// 1. Resume/Disable video stream tracks when app goes to background/foreground - To save on CPU resources
// 2. Handle PiP mode in Android
export const AppStateListener = () => {
  const call = useCall();
  const appState = useRef(AppState.currentState);
  const cameraDisabledByAppState = useRef<boolean>(false);

  // on mount: set initial PiP mode and listen to PiP events
  useEffect(() => {
    if (!isAndroid8OrAbove) {
      return;
    }

    const disablePiP = RxUtils.getCurrentValue(disablePiPMode$);
    isInPiPModeAndroid$.next(
      !disablePiP && AppState.currentState === 'background'
    );

    const eventEmitter = new NativeEventEmitter(
      NativeModules.StreamVideoReactNative
    );

    const subscriptionPiPChange = eventEmitter.addListener(
      PIP_CHANGE_EVENT,
      (isInPiPMode: boolean) => {
        isInPiPModeAndroid$.next(isInPiPMode);
      }
    );

    return () => {
      subscriptionPiPChange.remove();
    };
  }, []);

  useEffect(() => {
    // due to strange behavior in iOS when app goes to "inactive" state
    // we dont check for inactive states
    // ref: https://www.reddit.com/r/reactnative/comments/15kib42/appstate_behavior_in_ios_when_swiping_down_to/
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/background/) && nextAppState === 'active') {
        if (
          call?.camera?.state.status === 'enabled' &&
          Platform.OS === 'android'
        ) {
          // when device is locked and resumed, the status isnt made disabled but stays enabled
          // as a workaround we stop the track and enable again if its already in enabled state
          call?.camera?.disable(true).then(() => {
            call?.camera?.enable();
          });
        } else {
          if (cameraDisabledByAppState.current) {
            call?.camera?.resume();
            cameraDisabledByAppState.current = false;
          }
        }
        appState.current = nextAppState;
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/background/)
      ) {
        if (Platform.OS === 'android') {
          // in Android, we need to check if we are in PiP mode
          // in PiP mode, we don't want to disable the camera
          const disableCameraIfNeeded = () => {
            if (call?.camera?.state.status === 'enabled') {
              cameraDisabledByAppState.current = true;
              call?.camera?.disable();
            }
          };
          if (isAndroid8OrAbove) {
            // set with an assumption that its enabled so that UI disabling happens faster
            const disablePiP = RxUtils.getCurrentValue(disablePiPMode$);
            isInPiPModeAndroid$.next(!disablePiP);
            // if PiP was not enabled anyway, then in the next code we ll set it to false and UI wont be shown anyway
            NativeModules?.StreamVideoReactNative?.isInPiPMode().then(
              (isInPiP: boolean | null | undefined) => {
                isInPiPModeAndroid$.next(!!isInPiP);
                if (!isInPiP) {
                  if (AppState.currentState === 'active') {
                    // this is to handle the case that the app became active as soon as it went to background
                    // in this case, we dont want to disable the camera
                    // this happens on foreground push notifications
                    return;
                  }
                  disableCameraIfNeeded();
                }
              }
            );
          } else {
            disableCameraIfNeeded();
          }
        } else {
          // shouldDisableIOSLocalVideoOnBackgroundRef is false, if local video is enabled on PiP
          if (shouldDisableIOSLocalVideoOnBackgroundRef.current) {
            if (call?.camera?.state.status === 'enabled') {
              cameraDisabledByAppState.current = true;
              call?.camera?.disable();
            }
          }
        }
        appState.current = nextAppState;
      }
    });

    return () => {
      subscription.remove();
    };
  }, [call]);

  return null;
};
