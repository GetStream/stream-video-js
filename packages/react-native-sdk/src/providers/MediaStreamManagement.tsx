import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import {
  isCameraPermissionGranted$,
  isMicPermissionGranted$,
} from '../utils/StreamVideoRN/permissions';
import { Alert } from 'react-native';
import { useAppStateListener } from '../utils/hooks';

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
  const { t } = useI18n();

  // Resume/Disable video stream tracks when app goes to background/foreground
  // To save on CPU resources
  useAppStateListener(
    () => {
      call?.camera?.resume();
    },
    () => {
      call?.camera?.disable();
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
  }, [call, initialAudioEnabled, initialVideoEnabled]);

  const toggleInitialAudioMuteState = useCallback(() => {
    if (
      !isMicPermissionGranted$.getValue() &&
      call?.microphone.state.status === 'disabled'
    ) {
      Alert.alert(t('Microphone Permission Required To Enable Audio'));
      return false;
    }

    call?.microphone.state.status === 'disabled'
      ? call?.microphone.enable()
      : call?.microphone.disable();
  }, [call, t]);

  const toggleInitialVideoMuteState = useCallback(() => {
    if (
      !isCameraPermissionGranted$.getValue() &&
      call?.camera.state.status === 'disabled'
    ) {
      Alert.alert(t('Camera Permission Required To Enable Video'));
      return false;
    }

    call?.camera.state.status === 'disabled'
      ? call?.camera.enable()
      : call?.camera.disable();
  }, [call, t]);

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
