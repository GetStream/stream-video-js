import React from 'react';
import ButtonContainer from './ButtonContainer';
import VideoSlash from '../../icons/VideoSlash';
import Video from '../../icons/Video';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';

const VideoButton = () => {
  const isVideoMuted = useAppGlobalStoreValue((store) => store.isVideoMuted);
  const sfuClient = useAppGlobalStoreValue((store) => store.sfuClient);
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const toggleVideoState = async () => {
    if (localMediaStream && sfuClient) {
      localMediaStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoMuted;
        // @ts-ignore
        track.muted = isVideoMuted;
      });
      await sfuClient.updateVideoMuteState(!isVideoMuted);
    }
  };
  return (
    <ButtonContainer
      onPress={toggleVideoState}
      colorKey={isVideoMuted ? 'deactivated' : 'activated'}
    >
      {isVideoMuted ? <VideoSlash color="#fff" /> : <Video color="#121416" />}
    </ButtonContainer>
  );
};

export default VideoButton;
