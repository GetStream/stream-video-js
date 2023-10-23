import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

export function useAutoEnterPiPEffect() {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    NativeModules.StreamVideoReactNative.canAutoEnterPipMode(true);

    return () => {
      NativeModules.StreamVideoReactNative.canAutoEnterPipMode(false);
    };
  }, []);
}
