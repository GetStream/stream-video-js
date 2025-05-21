import { CallingState } from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';
import { disablePiPMode$ } from '../utils/internal/rxSubjects';

export function useAutoEnterPiPEffect(
  disablePictureInPicture: boolean | undefined,
) {
  const { useCallCallingState } = useCallStateHooks();

  const callingState = useCallCallingState();

  // if we need to enable autoEnter, only enable in joined state
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    if (!disablePictureInPicture && callingState === CallingState.JOINED) {
      NativeModules.StreamVideoReactNative.canAutoEnterPipMode(
        !disablePictureInPicture,
      );
    }
  }, [callingState, disablePictureInPicture]);

  useEffect(() => {
    disablePiPMode$.next(disablePictureInPicture === true);

    if (Platform.OS !== 'android') {
      return;
    }

    // on unmount always disable PiP mode auto enter
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
