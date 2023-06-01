import {
  getAudioStream,
  getVideoStream,
  SfuModels,
} from '@stream-io/video-client';
import { useCall, useLocalParticipant } from '@stream-io/video-react-bindings';
import { useCallback } from 'react';
import {
  useStreamVideoStoreSetState,
  useStreamVideoStoreValue,
} from '../contexts';
import { useAppStateListener } from '../utils/hooks/useAppStateListener';

/**
 * A helper hook which exposes audio, video mute and camera facing mode and
 * their respective functions to toggle state
 *
 * @category Device Management
 */
export const useCallControls = () => {
  const localParticipant = useLocalParticipant();
  const call = useCall();
  const setState = useStreamVideoStoreSetState();
  const isCameraOnFrontFacingMode = useStreamVideoStoreValue(
    (store) => store.isCameraOnFrontFacingMode,
  );
  const currentAudioDevice = useStreamVideoStoreValue(
    (store) => store.currentAudioDevice,
  );
  const videoDevices = useStreamVideoStoreValue((store) => store.videoDevices);
  const currentVideoDevice = useStreamVideoStoreValue(
    (store) => store.currentVideoDevice,
  );

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
      if (currentAudioDevice) {
        const audioStream = await getAudioStream(currentAudioDevice.deviceId);
        if (call) await call.publishAudioStream(audioStream);
      }
    } catch (e) {
      console.log('Failed to publish audio stream', e);
    }
  }, [currentAudioDevice, call]);

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

  /* Attempt to republish video stream when app comes back to foreground */
  useAppStateListener(publishVideoStream);

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
    setState((prevState) => ({
      currentVideoDevice: videoDevice,
      isCameraOnFrontFacingMode: !prevState.isCameraOnFrontFacingMode,
    }));
  }, [isCameraOnFrontFacingMode, videoDevices, setState]);

  return {
    isAudioMuted,
    isVideoMuted,
    isCameraOnFrontFacingMode,
    toggleAudioMuted,
    toggleVideoMuted,
    toggleCameraFacingMode,
  };
};
