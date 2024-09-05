import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

export function useAutoEnterPiPEffect(
  disablePictureInPicture: boolean | undefined
) {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    NativeModules.StreamVideoReactNative.canAutoEnterPipMode(
      !disablePictureInPicture
    );

    return () => {
      NativeModules.StreamVideoReactNative.canAutoEnterPipMode(false);
    };
  }, [disablePictureInPicture]);
}
