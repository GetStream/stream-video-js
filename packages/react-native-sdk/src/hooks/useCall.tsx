import { useActiveCall } from '@stream-io/video-react-bindings';
import InCallManager from 'react-native-incall-manager';
import { useCallback, useRef } from 'react';
import { useStreamVideoStoreSetState } from '../contexts';
import { useRingCall } from './useRingCall';

export const useCall = () => {
  const activeCall = useActiveCall();
  const streamVideoSetState = useStreamVideoStoreSetState();
  const { cancelCall } = useRingCall();

  const resetCallState = useRef(() => {
    streamVideoSetState((prevState) => {
      const newState: Partial<typeof prevState> = {};
      const { localMediaStream, cameraBackFacingMode } = prevState;
      if (localMediaStream && cameraBackFacingMode) {
        const [primaryVideoTrack] = localMediaStream.getVideoTracks();
        primaryVideoTrack._switchCamera();
        newState.cameraBackFacingMode = !cameraBackFacingMode;
      }
      return newState;
    });
  }).current;

  const hangupCall = useCallback(async () => {
    if (!activeCall) {
      console.warn('Failed to leave call: call is undefined');
      return;
    }
    try {
      await cancelCall();
      activeCall.leave();
      InCallManager.stop();
      resetCallState();
    } catch (error) {
      console.warn('failed to leave call', error);
    }
  }, [activeCall, cancelCall, resetCallState]);

  return { hangupCall };
};
