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
import { useStreamVideoStoreSetState } from '@stream-io/video-react-native-sdk';

const PhoneButton = () => {
  const username = useAppGlobalStoreValue((store) => store.username);
  const appStoreSetState = useAppGlobalStoreSetState();
  const streamVideoSetState = useStreamVideoStoreSetState();
  const { activeRingCallMeta$ } = useStore();
  const activeRingCallMeta = useObservableValue(activeRingCallMeta$);
  const { cancelCall } = useRingCall();
  const { endCall } = useCallKeep();

  const resetCallState = useRef(() => {
    appStoreSetState((prevState) => {
      const newState: Partial<typeof prevState> = {};
      newState.isAudioMuted = false;
      newState.isVideoMuted = false;
      return newState;
    });
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
