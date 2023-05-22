import {
  AxiosError,
  getAudioStream,
  getVideoStream,
  OwnCapability,
  SfuModels,
} from '@stream-io/video-client';
import {
  useCall,
  useHasPermissions,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';
import { useCallback, useState } from 'react';
import {
  useStreamVideoStoreSetState,
  useStreamVideoStoreValue,
} from '../contexts/StreamVideoContext';
import { useMediaDevices } from '../contexts/MediaDevicesContext';
import { useAppStateListener } from '../utils/hooks/useAppStateListener';
import { Alert } from 'react-native';

/**
 * A helper hook which exposes audio, video mute and camera facing mode and
 * their respective functions to toggle state
 *
 * @category Device Management
 */
export const useCallControls = () => {
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);
  const localParticipant = useLocalParticipant();
  const call = useCall();
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
  const userHasSendAudioCapability = useHasPermissions(
    OwnCapability.SEND_AUDIO,
  );
  const userHasSendVideoCapability = useHasPermissions(
    OwnCapability.SEND_VIDEO,
  );

  const handleRequestPermission = useCallback(
    async (permission: OwnCapability) => {
      if (call?.permissionsContext.canRequest(permission)) {
        setIsAwaitingApproval(true);
        try {
          await call.requestPermissions({ permissions: [permission] });
        } catch (error) {
          if (error instanceof AxiosError) {
            console.log(
              'RequestPermissions failed',
              error.response?.data.message,
            );
          }
        }
      }
    },
    [call],
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

  /* Attempt to republish video stream when app comes back to foreground */
  useAppStateListener(publishVideoStream);

  const toggleVideoMuted = useCallback(async () => {
    if (!userHasSendVideoCapability) {
      if (!isAwaitingApproval) {
        handleRequestPermission(OwnCapability.SEND_VIDEO);
      } else {
        Alert.alert('Awaiting for an approval to share your video.');
      }
      return;
    }
    if (isVideoMuted) {
      publishVideoStream();
    } else {
      await call?.stopPublish(SfuModels.TrackType.VIDEO);
    }
  }, [
    call,
    isVideoMuted,
    publishVideoStream,
    userHasSendVideoCapability,
    isAwaitingApproval,
    handleRequestPermission,
  ]);

  const toggleAudioMuted = useCallback(async () => {
    if (!userHasSendAudioCapability) {
      if (!isAwaitingApproval) {
        handleRequestPermission(OwnCapability.SEND_AUDIO);
      } else {
        Alert.alert('Awaiting for an approval to speak.');
      }
      return;
    }
    if (isAudioMuted) {
      publishAudioStream();
    } else {
      await call?.stopPublish(SfuModels.TrackType.AUDIO);
    }
  }, [
    call,
    isAudioMuted,
    publishAudioStream,
    userHasSendAudioCapability,
    isAwaitingApproval,
    handleRequestPermission,
  ]);

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
