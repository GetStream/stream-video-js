import {
  useActiveCall,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';
import {
  useStreamVideoStoreSetState,
  useStreamVideoStoreValue,
} from '../contexts';

export const useCallControls = () => {
  const localParticipant = useLocalParticipant();
  const call = useActiveCall();
  const setState = useStreamVideoStoreSetState();
  const localMediaStream = useStreamVideoStoreValue(
    (store) => store.localMediaStream,
  );
  const cameraBackFacingMode = useStreamVideoStoreValue(
    (store) => store.cameraBackFacingMode,
  );

  const isAudioMuted = !localParticipant?.audio;
  const isVideoMuted = !localParticipant?.video;

  // Handler to toggle the video mute state
  const toggleVideoState = async () => {
    await call?.updateMuteState('video', !isVideoMuted);
  };

  // Handler to toggle the audio mute state
  const toggleAudioState = async () => {
    await call?.updateMuteState('audio', !isAudioMuted);
  };

  // Handler to toggle the camera front and back facing mode
  const toggleCamera = () => {
    if (localMediaStream) {
      const [primaryVideoTrack] = localMediaStream.getVideoTracks();
      primaryVideoTrack._switchCamera();
      setState((prevState) => ({
        cameraBackFacingMode: !prevState.cameraBackFacingMode,
      }));
    }
  };

  // Handler to open/close the Chat window
  const toggleChat = () => {};

  return {
    isAudioMuted,
    isVideoMuted,
    cameraBackFacingMode,
    toggleAudioState,
    toggleVideoState,
    toggleCamera,
    toggleChat,
  };
};
