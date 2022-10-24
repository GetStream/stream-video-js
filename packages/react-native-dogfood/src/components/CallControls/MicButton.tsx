import React from 'react';
import Mic from '../../icons/Mic';
import MicOff from '../../icons/MicOff';
import ButtonContainer from './ButtonContainer';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';

const MicButton = () => {
  const isAudioMuted = useAppGlobalStoreValue((store) => store.isAudioMuted);
  const sfuClient = useAppGlobalStoreValue((store) => store.sfuClient);
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const toggleAudioState = async () => {
    if (localMediaStream && sfuClient) {
      localMediaStream.getAudioTracks().forEach((track) => {
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
      colorKey={isAudioMuted ? 'deactivated' : 'activated'}
    >
      {isAudioMuted ? <MicOff color="#fff" /> : <Mic color="#080707" />}
    </ButtonContainer>
  );
};

export default MicButton;
