import React from 'react';
import ButtonContainer from './ButtonContainer';
import VideoSlash from '../../icons/VideoSlash';
import Video from '../../icons/Video';
import {
  useActiveCall,
  useLocalParticipant,
} from '@stream-io/video-react-native-sdk';

const VideoButton = () => {
  const localParticipant = useLocalParticipant();
  const isVideoMuted = !localParticipant?.video;
  const call = useActiveCall();

  const toggleVideoState = async () => {
    call?.updateMuteState('video', !isVideoMuted);
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
