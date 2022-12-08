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
import { useMediaDevices } from '../contexts/MediaDevicesContext';

export const useCallControls = () => {
  const localParticipant = useLocalParticipant();
  const call = useActiveCall();
  const setState = useStreamVideoStoreSetState();

  const cameraBackFacingMode = useStreamVideoStoreValue(
    (store) => store.cameraBackFacingMode,
  );
  const {
    audioDevice,
    currentVideoDevice,
    videoDevices,
    setCurrentVideoDevice,
  } = useMediaDevices();

  const isAudioMuted = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoMuted = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  const publishAudioStream = useCallback(async () => {
    try {
      // Client picks up the default audio stream. For mobile devices there will always be one audio input
      if (audioDevice) {
        const audioStream = await getAudioStream(audioDevice.deviceId);
        if (call) await call.publishAudioStream(audioStream);
      }
    } catch (e) {
      console.log('Failed to publish audio stream', e);
    }
  }, [audioDevice, call]);

  const publishVideoStream = useCallback(async () => {
    try {
      if (currentVideoDevice) {
        const videoStream = await getVideoStream(currentVideoDevice.deviceId);
        if (call) await call.publishVideoStream(videoStream);
      }
    } catch (e) {
      console.log('Failed to publish video stream', e);
    }
  }, [call, currentVideoDevice]);

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
    const videoDevice = videoDevices.find(
      (videoDevice) =>
        videoDevice.kind === 'videoinput' &&
        (cameraBackFacingMode
          ? videoDevice.facing === 'front'
          : videoDevice.facing === 'environment'),
    );
    setCurrentVideoDevice(videoDevice);
    setState((prevState) => ({
      cameraBackFacingMode: !prevState.cameraBackFacingMode,
    }));
  }, [cameraBackFacingMode, setCurrentVideoDevice, videoDevices, setState]);

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
