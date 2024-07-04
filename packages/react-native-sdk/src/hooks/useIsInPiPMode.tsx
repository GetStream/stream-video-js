import { useEffect, useState } from 'react';
import {
  AppState,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';

const PIP_CHANGE_EVENT = 'StreamVideoReactNative_PIP_CHANGE_EVENT';

const isAndroid8OrAbove = Platform.OS === 'android' && Platform.Version >= 26;

export function useIsInPiPMode() {
  const [isInPiPMode, setIsInPiPMode] = useState(
    isAndroid8OrAbove && AppState.currentState === 'background'
  );

  useEffect(() => {
    if (!isAndroid8OrAbove) {
      return;
    }

    const eventEmitter = new NativeEventEmitter(
      NativeModules.StreamVideoReactNative
    );

    const subscriptionPiPChange = eventEmitter.addListener(
      PIP_CHANGE_EVENT,
      setIsInPiPMode
    );

    const setFromNativeMethod = async () => {
      const isInPiPNativeMethod: boolean | null | undefined =
        await NativeModules?.StreamVideoReactNative?.isInPiPMode();
      setIsInPiPMode(!!isInPiPNativeMethod);
    };

    const subscriptionAppState = AppState.addEventListener(
      'change',
      (nextAppState) => {
        if (nextAppState === 'background') {
          setIsInPiPMode(true); // set with an assumption that its enabled so that UI disabling happens faster
          // if PiP was not enabled anyway, then in the next code we ll set it to false and UI wont be shown anyway
        }
        setFromNativeMethod();
      }
    );

    setFromNativeMethod();

    return () => {
      subscriptionPiPChange.remove();
      subscriptionAppState.remove();
    };
  }, []);

  return isInPiPMode;
}
