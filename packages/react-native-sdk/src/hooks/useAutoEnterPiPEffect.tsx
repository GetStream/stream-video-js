import { CallingState } from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

export function useAutoEnterPiPEffect(
  disablePictureInPicture: boolean | undefined
) {
  const { useCallCallingState } = useCallStateHooks();

  const callingState = useCallCallingState();

  // if we need to enable, only enable in joined state
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    if (!disablePictureInPicture && callingState === CallingState.JOINED) {
      NativeModules.StreamVideoReactNative.canAutoEnterPipMode(
        !disablePictureInPicture
      );
    }
  }, [callingState, disablePictureInPicture]);

  // on unmount always disable PiP mode
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    return () => {
      NativeModules.StreamVideoReactNative.canAutoEnterPipMode(false);
    };
  }, [disablePictureInPicture]);

  // if disable prop was sent, immediately disable PiP mode
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    if (disablePictureInPicture) {
      NativeModules.StreamVideoReactNative.canAutoEnterPipMode(false);
    }
  }, [disablePictureInPicture]);
}
