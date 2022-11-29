import React from 'react';
import Mic from '../../icons/Mic';
import MicOff from '../../icons/MicOff';
import ButtonContainer from './ButtonContainer';
import {
  useActiveCall,
  useLocalParticipant,
} from '@stream-io/video-react-native-sdk';

const MicButton = () => {
  const localParticipant = useLocalParticipant();
  const isAudioMuted = !localParticipant?.audio;
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
