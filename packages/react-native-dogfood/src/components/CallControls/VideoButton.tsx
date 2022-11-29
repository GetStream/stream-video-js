import React, { useEffect } from 'react';
import ButtonContainer from './ButtonContainer';
import VideoSlash from '../../icons/VideoSlash';
import Video from '../../icons/Video';
import {
  useActiveCall,
  useLocalParticipant,
  useStreamVideoStoreValue,
} from '@stream-io/video-react-native-sdk';

const VideoButton = () => {
  const localParticipant = useLocalParticipant();
  const videoMuted = useStreamVideoStoreValue((store) => store.isVideoMuted);
  const isVideoMuted = !localParticipant?.video;
  const call = useActiveCall();

  useEffect(() => {
    call?.updateMuteState('video', videoMuted);
  }, [call, videoMuted]);

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
