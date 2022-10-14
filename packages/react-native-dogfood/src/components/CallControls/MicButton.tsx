import React from 'react';
import Mic from '../../icons/Mic';
import MicOff from '../../icons/MicOff';
import ButtonContainer from './ButtonContainer';
import {MediaStream} from 'react-native-webrtc';
import {Client} from '../../modules/Client';

type Props = {
  isAudioMuted: boolean;
  client: Client;
  localMediaStream?: MediaStream;
};

const MicButton = ({isAudioMuted, client, localMediaStream}: Props) => {
  const toggleAudioState = async () => {
    if (localMediaStream) {
      localMediaStream.getAudioTracks().forEach(track => {
        track.enabled = isAudioMuted;
        track.muted = isAudioMuted;
      });
    }
    await client.updateAudioMuteState(!isAudioMuted);
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
