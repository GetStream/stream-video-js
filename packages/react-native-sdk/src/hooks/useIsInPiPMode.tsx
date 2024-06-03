import { useEffect, useState } from 'react';
import {
  AppState,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';

const PIP_CHANGE_EVENT = 'StreamVideoReactNative_PIP_CHANGE_EVENT';

export function useIsInPiPMode() {
  const [isInPiPMode, setIsInPiPMode] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const eventEmitter = new NativeEventEmitter(
      NativeModules.StreamVideoReactNative
    );

    const subscriptionPiPChange = eventEmitter.addListener(
      PIP_CHANGE_EVENT,
      setIsInPiPMode
    );

    const subscriptionAppState = AppState.addEventListener(
      'change',
      (nextAppState) => {
        if (nextAppState === 'background') {
          setIsInPiPMode(true); // set with an assumption that its enabled so that UI disabling happens faster
          // if PiP was not enabled anyway, then in the next code we ll set it to false and UI wont be shown anyway
        }
        // attempt to take the value as soon as app state is changed
        // this can be faster than
        NativeModules?.StreamVideoReactNative?.isInPiPMode().then(
          (isInPiPNativeMethod: boolean | null | undefined) => {
            setIsInPiPMode(!!isInPiPNativeMethod);
          }
        );
      }
    );

    return () => {
      subscriptionPiPChange.remove();
      subscriptionAppState.remove();
    };
  }, []);

  return isInPiPMode;
}
