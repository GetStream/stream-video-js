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
} from '../contexts/StreamVideoContext';
import { useMediaDevices } from '../contexts/MediaDevicesContext';

/**
 * A helper hook which exposes audio, video mute and camera facing mode and
 * their respective functions to toggle state
 */
export const useCallControls = () => {
  const localParticipant = useLocalParticipant();
  const call = useActiveCall();
  const setState = useStreamVideoStoreSetState();

  const isCameraOnFrontFacingMode = useStreamVideoStoreValue(
    (store) => store.isCameraOnFrontFacingMode,
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
      // Client picks up the default audio stream.
      // For mobile devices there will always be one audio input
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

  const toggleVideoMuted = useCallback(async () => {
    if (isVideoMuted) {
      publishVideoStream();
    } else {
      await call?.stopPublish(SfuModels.TrackType.VIDEO);
    }
  }, [call, isVideoMuted, publishVideoStream]);

  const toggleAudioMuted = useCallback(async () => {
    if (isAudioMuted) {
      publishAudioStream();
    } else {
      await call?.stopPublish(SfuModels.TrackType.AUDIO);
    }
  }, [call, isAudioMuted, publishAudioStream]);

  const toggleCameraFacingMode = useCallback(() => {
    const videoDevice = videoDevices.find(
      (device) =>
        device.kind === 'videoinput' &&
        (!isCameraOnFrontFacingMode
          ? device.facing === 'front'
          : device.facing === 'environment'),
    );
    setCurrentVideoDevice(videoDevice);
    setState((prevState) => ({
      isCameraOnFrontFacingMode: !prevState.isCameraOnFrontFacingMode,
    }));
  }, [
    isCameraOnFrontFacingMode,
    setCurrentVideoDevice,
    videoDevices,
    setState,
  ]);

  return {
    isAudioMuted,
    isVideoMuted,
    isCameraOnFrontFacingMode,
    toggleAudioMuted,
    toggleVideoMuted,
    toggleCameraFacingMode,
  };
};
