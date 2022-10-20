import React, {useRef} from 'react';
import InCallManager from 'react-native-incall-manager';
import ButtonContainer from './ButtonContainer';
import PhoneDown from '../../icons/PhoneDown';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {useAppGlobalStore} from '../../contexts/AppContext';
import {RootStackParamList} from '../../../types';

const PhoneButton = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [{call}, setState] = useAppGlobalStore(store => ({
    call: store.call,
  }));
  const resetCallState = useRef(() => {
    setState(prevState => {
      const newState: Partial<typeof prevState> = {};
      const {localMediaStream, cameraBackFacingMode} = prevState;
      if (localMediaStream && cameraBackFacingMode) {
        const [primaryVideoTrack] = localMediaStream.getVideoTracks();
        primaryVideoTrack._switchCamera();
        newState.cameraBackFacingMode = !cameraBackFacingMode;
      }
      newState.callState = undefined;
      newState.isAudioMuted = false;
      newState.isVideoMuted = false;
      newState.participants = [];
      return newState;
    });
  }).current;

  const hangup = async () => {
    if (!call) {
      return;
    }
    try {
      resetCallState();
      InCallManager.stop();
      navigation.navigate('Home');
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
