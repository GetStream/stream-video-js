import { CallingState } from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import NativeStreamVideoReactNative from '../native/NativeStreamVideoReactNative';
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
      NativeStreamVideoReactNative.canAutoEnterPipMode(
        !disablePictureInPicture,
      );
    }
  }, [callingState, disablePictureInPicture]);

  useEffect(() => {
    disablePiPMode$.next(disablePictureInPicture === true);

    if (Platform.OS !== 'android') {
      return;
    }

    // if disable prop was sent, immediately disable PiP mode auto enter
    if (disablePictureInPicture) {
      NativeStreamVideoReactNative.canAutoEnterPipMode(false);
    }

    // on unmount always disable PiP mode auto enter
    return () => {
      NativeStreamVideoReactNative.canAutoEnterPipMode(false);
    };
  }, [disablePictureInPicture]);
}
