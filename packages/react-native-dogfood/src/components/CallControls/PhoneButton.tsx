import React, { useRef } from 'react';
import InCallManager from 'react-native-incall-manager';
import ButtonContainer from './ButtonContainer';
import PhoneDown from '../../icons/PhoneDown';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { RootStackParamList } from '../../../types';
import { useStore } from '../../hooks/useStore';
import { useObservableValue } from '../../hooks/useObservable';
import { useRingCall } from '../../hooks/useRingCall';

const PhoneButton = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const username = useAppGlobalStoreValue((store) => store.username);
  const setState = useAppGlobalStoreSetState();
  const { activeCall$, activeRingCall$ } = useStore();
  const activeRingCall = useObservableValue(activeRingCall$);
  const call = useObservableValue(activeCall$);
  const { cancelCall } = useRingCall();

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
    if (!call) {
      console.warn('failed to leave call: ', 'call is undefined');
      return;
    }
    try {
      call.leave();
      if (activeRingCall && activeRingCall.createdByUserId === username) {
        cancelCall();
      }
      resetCallState();
      InCallManager.stop();
      navigation.navigate('HomeScreen');
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
