import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
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
  initialAudioEnabled: propInitialAudioEnabled,
  initialVideoEnabled: propInitialVideoEnabled,
  children,
}: PropsWithChildren<MediaDevicesInitialState>) => {
  const call = useCall();
  const { useCallSettings } = useCallStateHooks();

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

  const [{ initialAudioEnabled, initialVideoEnabled }, setInitialDeviceState] =
    useState({
      initialAudioEnabled: !!propInitialAudioEnabled,
      initialVideoEnabled: !!propInitialVideoEnabled,
    });

  const settings = useCallSettings();

  // if prop is set, use that value.. the prop should override the backend settings
  useEffect(() => {
    setInitialDeviceState((prev) => {
      let initAudio = prev.initialAudioEnabled;
      if (typeof propInitialAudioEnabled !== 'undefined') {
        initAudio = propInitialAudioEnabled;
      }
      let initVideo = prev.initialVideoEnabled;
      if (typeof propInitialVideoEnabled !== 'undefined') {
        initVideo = propInitialVideoEnabled;
      }
      return { initialAudioEnabled: initAudio, initialVideoEnabled: initVideo };
    });
  }, [propInitialAudioEnabled, propInitialVideoEnabled]);

  // use backend settings to set initial audio/video enabled state
  // ONLY if the prop was undefined -- meaning user did not provide any value
  useEffect(() => {
    if (!settings) {
      return;
    }

    const { audio, video } = settings;
    setInitialDeviceState((prev) => {
      let initAudio = prev.initialAudioEnabled;
      if (
        typeof propInitialAudioEnabled === 'undefined' &&
        audio.mic_default_on
      ) {
        initAudio = true;
      }
      let initVideo = prev.initialVideoEnabled;
      if (
        typeof propInitialVideoEnabled === 'undefined' &&
        video.camera_default_on
      ) {
        initVideo = true;
      }
      return { initialAudioEnabled: initAudio, initialVideoEnabled: initVideo };
    });
  }, [propInitialAudioEnabled, propInitialVideoEnabled, settings]);

  // The main logic
  // Enable or Disable the audio/video stream based on the initial state
  useEffect(() => {
    if (
      initialAudioEnabled &&
      (call?.microphone.state.status === undefined ||
        call?.microphone.state.status === 'disabled')
    ) {
      call?.microphone.enable();
    } else if (
      !initialAudioEnabled &&
      call?.microphone.state.status === 'enabled'
    ) {
      call?.microphone.disable();
    }

    if (
      initialVideoEnabled &&
      (call?.camera.state.status === undefined ||
        call?.camera.state.status === 'disabled')
    ) {
      call?.camera.enable();
    } else if (
      !initialVideoEnabled &&
      call?.camera.state.status === 'enabled'
    ) {
      call?.camera.disable();
    }
  }, [call, initialAudioEnabled, initialVideoEnabled]);

  const toggleInitialAudioMuteState = useCallback(() => {
    call?.microphone.toggle();
  }, [call]);

  const toggleInitialVideoMuteState = useCallback(() => {
    call?.camera.toggle();
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
