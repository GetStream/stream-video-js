import React, { PropsWithChildren, useEffect, useState } from 'react';
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
    useState<MediaDevicesInitialState>({
      initialAudioEnabled: undefined,
      initialVideoEnabled: undefined,
    });

  const settings = useCallSettings();

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

      return {
        initialAudioEnabled: initAudio,
        initialVideoEnabled: initVideo,
      };
    });
  }, [propInitialAudioEnabled, propInitialVideoEnabled]);

  // Use backend settings to set initial audio/video enabled state
  // ONLY if the prop was undefined -- meaning user did not provide any value
  useEffect(() => {
    if (!settings) {
      return;
    }

    const { audio, video } = settings;
    setInitialDeviceState((prev) => {
      let initAudio = prev.initialAudioEnabled;
      if (typeof propInitialAudioEnabled === 'undefined') {
        initAudio = audio.mic_default_on;
      }
      let initVideo = prev.initialVideoEnabled;
      if (typeof propInitialVideoEnabled === 'undefined') {
        initVideo = video.camera_default_on;
      }
      return { initialAudioEnabled: initAudio, initialVideoEnabled: initVideo };
    });
  }, [propInitialAudioEnabled, propInitialVideoEnabled, settings]);

  // The main logic
  // Enable or Disable the audio/video stream based on the initial state
  useEffect(() => {
    if (initialAudioEnabled === undefined) {
      return;
    }
    if (initialVideoEnabled === undefined) {
      return;
    }
    if (initialAudioEnabled) {
      call?.microphone.enable();
    } else {
      call?.microphone.disable();
    }

    if (initialVideoEnabled) {
      call?.camera.enable();
    } else {
      call?.camera.disable();
    }
  }, [call, initialAudioEnabled, initialVideoEnabled]);

  return <>{children}</>;
};
