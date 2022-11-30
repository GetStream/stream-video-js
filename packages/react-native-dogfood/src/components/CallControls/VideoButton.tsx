import React, { useEffect } from 'react';
import ButtonContainer from './ButtonContainer';
import VideoSlash from '../../icons/VideoSlash';
import Video from '../../icons/Video';
import {
  useActiveCall,
  useLocalParticipant,
  useStreamVideoStoreSetState,
  useStreamVideoStoreValue,
} from '@stream-io/video-react-native-sdk';

const VideoButton = () => {
  const localParticipant = useLocalParticipant();
  const videoMuted = useStreamVideoStoreValue((store) => store.isVideoMuted);
  const streamSetState = useStreamVideoStoreSetState();
  const isVideoMuted = !localParticipant?.video || videoMuted;
  const call = useActiveCall();

  useEffect(() => {
    if (videoMuted) {
      call?.updateMuteState('video', videoMuted);
    }
  }, [call, videoMuted]);

  const toggleVideoState = async () => {
    call?.updateMuteState('video', !isVideoMuted);
    streamSetState({ isVideoMuted: false });
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
