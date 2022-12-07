import {
  getAudioStream,
  getVideoStream,
  SfuModels,
} from '@stream-io/video-client';
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

  const audioDeviceId = localParticipant?.audioDeviceId;
  const videoDeviceId = localParticipant?.videoDeviceId;

  const publishAudioStream = useCallback(async () => {
    try {
      const audioStream = await getAudioStream(audioDeviceId);
      if (call) await call.publishAudioStream(audioStream);
    } catch (e) {
      console.log('Failed to publish audio stream', e);
    }
  }, [audioDeviceId, call]);

  const publishVideoStream = useCallback(async () => {
    try {
      const videoStream = await getVideoStream(videoDeviceId);
      if (call) await call.publishVideoStream(videoStream);
    } catch (e) {
      console.log('Failed to publish video stream', e);
    }
  }, [call, videoDeviceId]);

  // Handler to toggle the video mute state
  const toggleVideoState = useCallback(async () => {
    if (isVideoMuted) {
      publishVideoStream();
    } else {
      await call?.stopPublish(SfuModels.TrackType.VIDEO);
    }
  }, [call, isVideoMuted, publishVideoStream]);

  // Handler to toggle the audio mute state
  const toggleAudioState = useCallback(async () => {
    if (isAudioMuted) {
      publishAudioStream();
    } else {
      await call?.stopPublish(SfuModels.TrackType.AUDIO);
    }
  }, [call, isAudioMuted, publishAudioStream]);

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
