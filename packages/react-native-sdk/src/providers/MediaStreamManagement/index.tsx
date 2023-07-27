import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  CallingState,
  OwnCapability,
  SfuModels,
} from '@stream-io/video-client';
import {
  useCall,
  useCallCallingState,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';
import {
  isMicPermissionGranted$,
  isCameraPermissionGranted$,
} from '../../utils/StreamVideoRN/permissions';
import { useAudioPublisher } from './useAudioPublisher';
import { useVideoPublisher } from './useVideoPublisher';
import { Alert } from 'react-native';
import { useStreamVideoStoreValue } from '../../contexts';

/**
 * API to control device enablement, device selection and media stream access for a call.
 * @category Device Management
 */
export type MediaStreamManagementContextAPI = {
  /**
   * Publishes audio stream for currently selected audio input (microphone) device to other call participants.
   */
  publishAudioStream: () => Promise<void>;
  /**
   * Publishes video stream for currently selected video input (camera) device to other call participants.
   */
  publishVideoStream: () => Promise<void>;
  /**
   * Signals whether audio stream will be published when the call is joined.
   */
  initialAudioEnabled: boolean;
  /**
   * Signals whether audio stream will be published when the call is joined.
   */
  initialVideoEnabled: boolean;
  /**
   * Signals whether the camera is on front facing mode.
   */
  isCameraOnFrontFacingMode: boolean;
  /**
   * Toggles the initialAudioEnabled boolean flag.
   * The latest value set will be used to decide, whether audio stream will be published when joining a call.
   */
  toggleInitialAudioMuteState: () => void;
  /**
   * Toggles the initialAudioEnabled boolean flag.
   * The latest value set will be used to decide, whether audio stream will be published when joining a call.
   */
  toggleInitialVideoMuteState: () => void;
  /**
   * Toggles the camera facing mode between front and back camera.
   */
  toggleCameraFacingMode: () => void;
  /**
   * Stops publishing audio stream for currently selected audio input (microphone) device to other call participants.
   */
  stopPublishingAudio: () => void;
  /**
   * Stops publishing video stream for currently selected video input (camera) device to other call participants.
   */
  stopPublishingVideo: () => void;
};

const MediaStreamContext =
  createContext<MediaStreamManagementContextAPI | null>(null);

/**
 *
 * Provides `MediaStreamManagementContextAPI` that allow the integrators to handle:
 * 1. the initial device state enablement (for example in a custom lobby view)
 * 2. media stream publishing
 * @param params
 * @returns
 *
 * @category Device Management
 */
export const MediaStreamManagement = ({ children }: PropsWithChildren<{}>) => {
  const call = useCall();
  const callingState = useCallCallingState();
  const videoDevices = useStreamVideoStoreValue((store) => store.videoDevices);
  const localVideoStream = useLocalParticipant()?.videoStream;

  const [isCameraOnFrontFacingMode, setIsCameraOnFrontFacingMode] =
    useState(true);

  const [initAudioEnabled, setInitialAudioEnabled] = useState<boolean>(() => {
    const hasNativePermission = isMicPermissionGranted$.getValue();
    const hasUserPermission = !!call?.permissionsContext?.hasPermission(
      OwnCapability.SEND_AUDIO,
    );
    const metaDataSettings = call?.data?.settings?.audio.mic_default_on;
    if (metaDataSettings !== undefined) {
      return hasNativePermission && hasUserPermission && metaDataSettings;
    }
    return hasNativePermission && hasUserPermission;
  });

  const [initVideoEnabled, setInitialVideoEnabled] = useState<boolean>(() => {
    if (call?.type === 'audio_room') {
      return false;
    }
    const hasNativePermission = isCameraPermissionGranted$.getValue();
    const hasUserPermission = !!call?.permissionsContext?.hasPermission(
      OwnCapability.SEND_VIDEO,
    );
    const metaDataSettings = call?.data?.settings?.video.camera_default_on;
    if (metaDataSettings !== undefined) {
      return hasNativePermission && hasUserPermission && metaDataSettings;
    }
    return hasNativePermission && hasUserPermission;
  });

  const publishVideoStream = useVideoPublisher({
    initialVideoMuted: !initVideoEnabled,
  });
  const publishAudioStream = useAudioPublisher({
    initialAudioMuted: !initAudioEnabled,
  });

  const stopPublishingAudio = useCallback(() => {
    if (
      callingState === CallingState.IDLE ||
      callingState === CallingState.RINGING
    ) {
      setInitialAudioEnabled(false);
    } else {
      call?.stopPublish(SfuModels.TrackType.AUDIO);
    }
  }, [call, callingState]);

  const stopPublishingVideo = useCallback(() => {
    if (
      callingState === CallingState.IDLE ||
      callingState === CallingState.RINGING
    ) {
      setInitialVideoEnabled(false);
    } else {
      call?.stopPublish(SfuModels.TrackType.VIDEO);
    }
  }, [call, callingState]);

  const toggleInitialAudioMuteState = useCallback(
    () =>
      setInitialAudioEnabled((prev) => {
        if (!isMicPermissionGranted$.getValue() && !prev) {
          Alert.alert(
            'Microphone permission not granted, can not enable audio',
          );
          return false;
        }
        return !prev;
      }),
    [],
  );
  const toggleInitialVideoMuteState = useCallback(
    () =>
      setInitialVideoEnabled((prev) => {
        if (!isCameraPermissionGranted$.getValue() && !prev) {
          Alert.alert('Camera permission not granted, can not enable video');
          return false;
        }
        return !prev;
      }),
    [],
  );

  const toggleCameraFacingMode = useCallback(() => {
    const canSwitchCamera = videoDevices.length > 1;
    if (canSwitchCamera && localVideoStream) {
      const tracks = localVideoStream.getVideoTracks();
      const videoTrack = tracks[0];
      if (videoTrack) {
        videoTrack._switchCamera();
        setIsCameraOnFrontFacingMode((prev) => !prev);
      }
    }
  }, [localVideoStream, videoDevices.length]);

  const contextValue = useMemo(() => {
    return {
      initialAudioEnabled: initAudioEnabled,
      initialVideoEnabled: initVideoEnabled,
      isCameraOnFrontFacingMode,
      toggleInitialAudioMuteState,
      toggleInitialVideoMuteState,
      toggleCameraFacingMode,
      publishAudioStream,
      publishVideoStream,
      stopPublishingAudio,
      stopPublishingVideo,
    };
  }, [
    initAudioEnabled,
    initVideoEnabled,
    isCameraOnFrontFacingMode,
    toggleInitialAudioMuteState,
    toggleInitialVideoMuteState,
    toggleCameraFacingMode,
    publishAudioStream,
    publishVideoStream,
    stopPublishingAudio,
    stopPublishingVideo,
  ]);

  return (
    <MediaStreamContext.Provider value={contextValue}>
      {children}
    </MediaStreamContext.Provider>
  );
};

/**
 * Context consumer retrieving MediaStreamManagementContextAPI.
 * @returns
 *
 * @category Device Management
 */
export const useMediaStreamManagement = () => {
  const value = useContext(MediaStreamContext);
  if (!value) {
    console.warn('Null MediaDevicesContext');
  }
  return value as MediaStreamManagementContextAPI;
};
