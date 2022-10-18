import React from 'react';
import Mic from '../../icons/Mic';
import MicOff from '../../icons/MicOff';
import ButtonContainer from './ButtonContainer';
import {useAppValueContext} from '../../contexts/AppContext';

const MicButton = () => {
  const {isAudioMuted, sfuClient, localMediaStream} = useAppValueContext();
  const toggleAudioState = async () => {
    if (localMediaStream && sfuClient) {
      localMediaStream.getAudioTracks().forEach(track => {
        track.enabled = isAudioMuted;
        track.muted = isAudioMuted;
      });
      await sfuClient.updateAudioMuteState(!isAudioMuted);
    }
  };

  return (
    <ButtonContainer
      onPress={toggleAudioState}
      colorKey={isAudioMuted ? 'deactivated' : 'activated'}>
      {isAudioMuted ? <MicOff color="#fff" /> : <Mic color="#080707" />}
    </ButtonContainer>
  );
};

export default MicButton;
