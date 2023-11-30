import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useAppStateListener } from '../utils/hooks';
import { NativeModules, Platform } from 'react-native';
import type { TargetResolution } from '@stream-io/video-client';

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
 * Provides `MediaStreamManagement` wrapper that allow the integrators to handle:
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
  const settings = useCallSettings();

  // Get the target resolution from the settings and memoize it
  // Memoization is needed to avoid unnecessary useEffect triggers
  const targetResolutionSetting = useMemo<TargetResolution | undefined>(() => {
    if (
      settings?.video.target_resolution?.width === undefined ||
      settings?.video.target_resolution?.height === undefined ||
      settings?.video.target_resolution?.bitrate === undefined
    ) {
      return undefined;
    }
    return {
      width: settings?.video.target_resolution.width,
      height: settings?.video.target_resolution.height,
      bitrate: settings?.video.target_resolution.bitrate,
    };
  }, [
    settings?.video.target_resolution.width,
    settings?.video.target_resolution.height,
    settings?.video.target_resolution.bitrate,
  ]);

  // Get the target resolution from the default device settings and memoize it
  // Memoization is needed to avoid unnecessary useEffect triggers
  const defaultOnSetting = useMemo(() => {
    if (
      settings?.audio.mic_default_on === undefined ||
      settings?.video.camera_default_on === undefined
    ) {
      return undefined;
    } else {
      return {
        mic_default_on: settings?.audio.mic_default_on,
        camera_default_on: settings?.video.camera_default_on,
      };
    }
  }, [settings?.audio.mic_default_on, settings?.video.camera_default_on]);

  // Resume/Disable video stream tracks when app goes to background/foreground
  // To save on CPU resources
  useAppStateListener(
    () => {
      call?.camera?.resume();
    },
    () => {
      if (Platform.OS === 'android') {
        // in Android, we need to check if we are in PiP mode
        // in PiP mode, we don't want to disable the camera
        NativeModules?.StreamVideoReactNative?.isInPiPMode().then(
          (isInPiP: boolean) => {
            if (!isInPiP) {
              call?.camera?.disable();
            }
          },
        );
      } else {
        call?.camera?.disable();
      }
    },
  );

  const [{ initialAudioEnabled, initialVideoEnabled }, setInitialDeviceState] =
    useState<MediaDevicesInitialState>({
      initialAudioEnabled: undefined,
      initialVideoEnabled: undefined,
    });

  // Use backend settings to set initial audio/video enabled state
  // It is applied only if the prop was undefined -- meaning user did not provide any value
  useEffect(() => {
    if (!defaultOnSetting) {
      return;
    }

    const { mic_default_on, camera_default_on } = defaultOnSetting;
    setInitialDeviceState((prev) => {
      let initAudio = prev.initialAudioEnabled;
      if (typeof propInitialAudioEnabled === 'undefined') {
        initAudio = mic_default_on;
      }
      let initVideo = prev.initialVideoEnabled;
      if (typeof propInitialVideoEnabled === 'undefined') {
        initVideo = camera_default_on;
      }
      return { initialAudioEnabled: initAudio, initialVideoEnabled: initVideo };
    });
  }, [propInitialAudioEnabled, propInitialVideoEnabled, defaultOnSetting]);

  // Apply SDK settings to set the initial audio/video enabled state
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

  // The main logic
  // Enable or Disable the audio/video stream based on the initial state
  useEffect(() => {
    if (initialAudioEnabled === undefined) {
      return;
    }
    if (initialVideoEnabled === undefined) {
      return;
    }
    // we wait until we receive the resolution settings from the backend
    if (!call || !targetResolutionSetting) {
      return;
    }

    if (initialAudioEnabled) {
      call.microphone.enable();
    } else {
      call.microphone.disable();
    }

    call.camera.selectTargetResolution(targetResolutionSetting);
    if (initialVideoEnabled) {
      call.camera.enable();
    } else {
      call.camera.disable();
    }
  }, [call, initialAudioEnabled, initialVideoEnabled, targetResolutionSetting]);

  return <>{children}</>;
};
