import React from 'react';
import ButtonContainer from './ButtonContainer';
import {MediaStream} from 'react-native-webrtc';
import {Client} from '../../modules/Client';
import VideoSlash from '../../icons/VideoSlash';
import Video from '../../icons/Video';

type Props = {
  isVideoMuted: boolean;
  client: Client;
  localMediaStream?: MediaStream;
};

const VideoButton = ({isVideoMuted, client, localMediaStream}: Props) => {
  const toggleVideoState = async () => {
    if (localMediaStream) {
      localMediaStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoMuted;
        track.muted = isVideoMuted;
      });
      await client.updateVideoMuteState(!isVideoMuted);
    }
  };
  return (
    <ButtonContainer
      onPress={toggleVideoState}
      colorKey={isVideoMuted ? 'deactivated' : 'activated'}>
      {isVideoMuted ? <VideoSlash color="#fff" /> : <Video color="#121416" />}
    </ButtonContainer>
  );
};

export default VideoButton;
