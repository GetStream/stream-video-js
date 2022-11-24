import React, { useRef } from 'react';
import ButtonContainer from './ButtonContainer';
import PhoneDown from '../../icons/PhoneDown';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { useStore } from '../../hooks/useStore';
import { useObservableValue } from '../../hooks/useObservable';
import { useRingCall } from '../../hooks/useRingCall';
import { useCallKeep } from '../../hooks/useCallKeep';

const PhoneButton = () => {
  const username = useAppGlobalStoreValue((store) => store.username);
  const setState = useAppGlobalStoreSetState();
  const { activeRingCallMeta$ } = useStore();
  const activeRingCallMeta = useObservableValue(activeRingCallMeta$);
  const { cancelCall } = useRingCall();
  const { endCall } = useCallKeep();

  const resetCallState = useRef(() => {
    setState((prevState) => {
      const newState: Partial<typeof prevState> = {};
      const { localMediaStream, cameraBackFacingMode } = prevState;
      if (localMediaStream && cameraBackFacingMode) {
        const [primaryVideoTrack] = localMediaStream.getVideoTracks();
        primaryVideoTrack._switchCamera();
        newState.cameraBackFacingMode = !cameraBackFacingMode;
      }
      newState.isAudioMuted = false;
      newState.isVideoMuted = false;
      return newState;
    });
  }).current;

  const hangup = async () => {
    try {
      endCall();
      if (
        activeRingCallMeta &&
        activeRingCallMeta.createdByUserId === username
      ) {
        cancelCall();
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
