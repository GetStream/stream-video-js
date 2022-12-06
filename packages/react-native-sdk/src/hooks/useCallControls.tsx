import { SfuModels } from '@stream-io/video-client';
import {
  useActiveCall,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';
import { useCallback } from 'react';
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

  const isAudioMuted = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoMuted = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  // Handler to toggle the video mute state
  const toggleVideoState = useCallback(async () => {
    await call?.stopPublish(SfuModels.TrackType.VIDEO);
  }, [call]);

  // Handler to toggle the audio mute state
  const toggleAudioState = useCallback(async () => {
    await call?.stopPublish(SfuModels.TrackType.AUDIO);
  }, [call]);

  // Handler to toggle the camera front and back facing mode
  const toggleCamera = useCallback(() => {
    if (localMediaStream) {
      const [primaryVideoTrack] = localMediaStream.getVideoTracks();
      primaryVideoTrack._switchCamera();
      setState((prevState) => ({
        cameraBackFacingMode: !prevState.cameraBackFacingMode,
      }));
    }
  }, [localMediaStream, setState]);

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
