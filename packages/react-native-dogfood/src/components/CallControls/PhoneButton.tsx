import React, { useRef } from 'react';
import ButtonContainer from './ButtonContainer';
import PhoneDown from '../../icons/PhoneDown';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import { useRingCall } from '../../hooks/useRingCall';
import { useCallKeep } from '../../hooks/useCallKeep';
import {
  useActiveRingCall,
  useStreamVideoStoreSetState,
} from '@stream-io/video-react-native-sdk';

const PhoneButton = () => {
  const username = useAppGlobalStoreValue((store) => store.username);
  const streamVideoSetState = useStreamVideoStoreSetState();
  const activeRingCallMeta = useActiveRingCall();
  const { cancelCall } = useRingCall();
  const { endCall } = useCallKeep();

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

  const hangup = async () => {
    try {
      await endCall();
      if (
        activeRingCallMeta &&
        activeRingCallMeta.createdByUserId === username
      ) {
        await cancelCall();
      }
      resetCallState();
    } catch (err) {
      console.warn('failed to leave call', err);
    }
  };

  return (
    <ButtonContainer onPress={hangup} colorKey={'cancel'}>
      <PhoneDown color="#fff" />
    </ButtonContainer>
  );
};

export default PhoneButton;
