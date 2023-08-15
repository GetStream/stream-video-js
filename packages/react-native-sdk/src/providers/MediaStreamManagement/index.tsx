import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { useCall } from '@stream-io/video-react-bindings';
import {
  isCameraPermissionGranted$,
  isMicPermissionGranted$,
} from '../../utils/StreamVideoRN/permissions';
import { Alert } from 'react-native';
import { useAppStateListener } from '../../utils/hooks';
import { MediaStream } from 'react-native-webrtc';

export type MediaDevicesInitialState = {
  /**
   * Provides external control over the initial audio input (microphone) enablement. Overrides the default false.
   */
  initialAudioEnabled?: boolean;
  /**
   * Provides external control over the initial video input (camera) enablement. Overrides the default false.
   */
  initialVideoEnabled?: boolean;
};

/**
 * API to control device enablement, device selection and media stream access for a call.
 * @category Device Management
 */
export type MediaStreamManagementContextAPI = {
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
};

const MediaStreamContext =
  createContext<MediaStreamManagementContextAPI | null>(null);

/**
 *
 * Provides `MediaStreamManagementContextAPI` that allow the integrators to handle:
 * 1. the initial device state enablement (for example in a custom lobby component)
 * 2. media stream publishing
 * @param params
 * @returns
 *
 * @category Device Management
 */
export const MediaStreamManagement = ({
  initialAudioEnabled,
  initialVideoEnabled,
  children,
}: PropsWithChildren<MediaDevicesInitialState>) => {
  const call = useCall();

  // Pause/Resume video stream tracks when app goes to background/foreground
  // To save on CPU resources
  useAppStateListener(
    () => {
      const stream = call?.camera?.state.mediaStream as MediaStream | undefined;
      stream?.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });
    },
    () => {
      const stream = call?.camera?.state.mediaStream as MediaStream | undefined;
      stream?.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
    },
  );

  useEffect(() => {
    if (
      typeof initialAudioEnabled !== 'undefined' &&
      isMicPermissionGranted$.getValue()
    ) {
      if (initialAudioEnabled && call?.microphone.state.status === 'disabled') {
        call?.microphone.enable();
      } else {
        call?.microphone.disable();
      }
    }
    if (
      typeof initialVideoEnabled !== 'undefined' &&
      isCameraPermissionGranted$.getValue()
    ) {
      if (initialVideoEnabled && call?.camera.state.status === 'disabled') {
        call?.camera.enable();
      } else {
        call?.camera.disable();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAudioEnabled, initialVideoEnabled]);

  const toggleInitialAudioMuteState = useCallback(() => {
    if (
      !isMicPermissionGranted$.getValue() &&
      call?.microphone.state.status === 'disabled'
    ) {
      Alert.alert('Microphone permission not granted, can not enable audio');
      return false;
    }

    call?.microphone.state.status === 'disabled'
      ? call?.microphone.enable()
      : call?.microphone.disable();
  }, [call]);

  const toggleInitialVideoMuteState = useCallback(() => {
    if (
      !isCameraPermissionGranted$.getValue() &&
      call?.camera.state.status === 'disabled'
    ) {
      Alert.alert('Camera permission not granted, can not enable video');
      return false;
    }

    call?.camera.state.status === 'disabled'
      ? call?.camera.enable()
      : call?.camera.disable();
  }, [call]);

  const contextValue = useMemo(() => {
    return {
      toggleInitialAudioMuteState,
      toggleInitialVideoMuteState,
    };
  }, [toggleInitialAudioMuteState, toggleInitialVideoMuteState]);
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
