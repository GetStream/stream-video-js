import React from 'react';
import Mic from '../../icons/Mic';
import MicOff from '../../icons/MicOff';
import ButtonContainer from './ButtonContainer';
import {useAppGlobalStore} from '../../contexts/AppContext';

const MicButton = () => {
  const [{isAudioMuted, sfuClient, localMediaStream}] = useAppGlobalStore(
    store => ({
      isAudioMuted: store.isAudioMuted,
      sfuClient: store.sfuClient,
      localMediaStream: store.localMediaStream,
    }),
  );
  const toggleAudioState = async () => {
    if (localMediaStream && sfuClient) {
      localMediaStream.getAudioTracks().forEach(track => {
        track.enabled = isAudioMuted;
        // @ts-ignore
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
