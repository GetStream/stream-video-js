import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { OwnCapability } from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';
import {
  isMicPermissionGranted$,
  isCameraPermissionGranted$,
} from '../../utils/StreamVideoRN/permissions';
import { Alert } from 'react-native';
import { useAudioPublisher } from './useAudioPublisher';
import { useVideoPublisher } from './useVideoPublisher';

/**
 * API to control device enablement, device selection and media stream access for a call.
 * @category Device Management
 */
export type MediaStreamManagementContextAPI = {
  /**
   * Signals whether audio stream will be published when the call is joined.
   */
  initialAudioEnabled: boolean;
  /**
   * Signals whether audio stream will be published when the call is joined.
   */
  initialVideoEnabled: boolean;
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
export const MediaStreamManagement = ({}: PropsWithChildren<{}>) => {
  const call = useCall();

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

  useAudioPublisher({
    initialAudioMuted: !initAudioEnabled,
  });
  useVideoPublisher({
    initialVideoMuted: !initVideoEnabled,
  });

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

  const contextValue = useMemo(() => {
    return {
      initialAudioEnabled: initAudioEnabled,
      initialVideoEnabled: initVideoEnabled,
      toggleInitialAudioMuteState,
      toggleInitialVideoMuteState,
    };
  }, [
    initAudioEnabled,
    initVideoEnabled,
    toggleInitialAudioMuteState,
    toggleInitialVideoMuteState,
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
