import {
  useActiveCall,
  useActiveRingCall,
  useLocalParticipant,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { useCallKeep } from './useCallKeep';
import InCallManager from 'react-native-incall-manager';
import { useRef } from 'react';
import { useStreamVideoStoreSetState } from '../contexts';

export const useCall = () => {
  const activeCall = useActiveCall();
  const activeRingCall = useActiveRingCall();
  const client = useStreamVideoClient();
  const localParticipant = useLocalParticipant();
  const streamVideoSetState = useStreamVideoStoreSetState();

  const { endCall } = useCallKeep();

  const isCallCreatedByUserLocalParticipant =
    activeRingCall?.createdByUserId === localParticipant?.user?.id;

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

  const hangupCall = async () => {
    if (!activeCall) {
      console.warn('Failed to leave call: call is undefined');
      return;
    }
    try {
      await endCall();
      if (activeRingCall && isCallCreatedByUserLocalParticipant) {
        await client?.cancelCall(activeRingCall.callCid);
      }
      activeCall.leave();
      InCallManager.stop();
      resetCallState();
    } catch (error) {
      console.warn('failed to leave call', error);
    }
  };

  return { hangupCall };
};
