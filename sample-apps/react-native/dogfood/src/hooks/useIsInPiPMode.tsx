import { useEffect, useState } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export default function useIsInPiPMode() {
  const [isInPiPMode, setIsInPiPMode] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const eventEmitter = new NativeEventEmitter(
      NativeModules.StreamVideoReactNative,
    );

    const subscription = eventEmitter.addListener(
      'StreamVideoReactNative_PIP_CHANGE_EVENT',
      (isPiPEnabled: boolean) => {
        setIsInPiPMode(isPiPEnabled);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  console.log({ isInPiPMode });

  return isInPiPMode;
}
