import React from 'react';
import Mic from '../../icons/Mic';
import MicOff from '../../icons/MicOff';
import ButtonContainer from './ButtonContainer';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import { useActiveCall } from '@stream-io/video-react-native-sdk';

const MicButton = () => {
  const isAudioMuted = useAppGlobalStoreValue((store) => store.isAudioMuted);
  const call = useActiveCall();
  const toggleAudioState = async () => {
    call?.updateMuteState('audio', !isAudioMuted);
  };

  return (
    <ButtonContainer
      onPress={toggleAudioState}
      colorKey={isAudioMuted ? 'deactivated' : 'activated'}
    >
      {isAudioMuted ? <MicOff color="#fff" /> : <Mic color="#080707" />}
    </ButtonContainer>
  );
};

export default MicButton;
