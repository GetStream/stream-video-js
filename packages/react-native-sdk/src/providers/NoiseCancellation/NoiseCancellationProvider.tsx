import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  getLogger,
  NoiseCancellationSettingsModeEnum,
  OwnCapability,
} from '@stream-io/video-client';

import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import {
  getNoiseCancellationLibThrowIfNotInstalled,
  NoiseCancellationWrapper,
} from './lib';

/**
 * The Noise Cancellation API.
 */
export type NoiseCancellationAPI = {
  /**
   * A boolean providing information whether the device supports advanced audio processing recommended for noise cancellation.
   * This boolean returns `true` if the iOS device supports Apple's Neural Engine or if an Android device has the FEATURE_AUDIO_PROCESSING feature enabled.
   * Devices with this capability are better suited for handling noise cancellation efficiently.
   */
  deviceSupportsAdvancedAudioProcessing: boolean | undefined;
  /**
   * A boolean providing information whether Noise Cancelling functionalities
   * are supported for the current user in call settings.
   */
  isSupported: boolean | undefined;
  /**
   * Provides information whether Noise Cancellation is active or not.
   */
  isEnabled: boolean;
  /**
   * Allows you to enable or disable the Noise Cancellation audio filter.
   *
   * @param enabled a boolean or a setter.
   */
  setEnabled: (enabled: boolean | ((value: boolean) => boolean)) => void;
};

const NoiseCancellationContext = createContext<NoiseCancellationAPI | null>(
  null,
);

/**
 * Exposes the NoiseCancellation API.
 * Throws an error if used outside <NoiseCancellationProvider />.
 */
export const useNoiseCancellation = (): NoiseCancellationAPI => {
  const context = useContext(NoiseCancellationContext);
  if (!context) {
    throw new Error(
      'useNoiseCancellation must be used within a NoiseCancellationProvider',
    );
  }
  return context;
};

export const NoiseCancellationProvider = (props: PropsWithChildren<{}>) => {
  const call = useCall();
  const [
    deviceSupportsAdvancedAudioProcessing,
    setDeviceSupportsAdvancedAudioProcessing,
  ] = useState<boolean>();
  const { useCallSettings, useHasPermissions } = useCallStateHooks();
  const settings = useCallSettings();
  const noiseCancellationAllowed = !!(
    settings &&
    settings.audio.noise_cancellation &&
    settings.audio.noise_cancellation.mode !==
      NoiseCancellationSettingsModeEnum.DISABLED
  );

  const hasCapability = useHasPermissions(
    OwnCapability.ENABLE_NOISE_CANCELLATION,
  );
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const noiseCancellationNativeLib =
      getNoiseCancellationLibThrowIfNotInstalled();
    noiseCancellationNativeLib
      .deviceSupportsAdvancedAudioProcessing()
      .then((result) => setDeviceSupportsAdvancedAudioProcessing(result));
    noiseCancellationNativeLib.isEnabled().then((e) => setIsEnabled(e));
  }, []);

  const isSupported = hasCapability && noiseCancellationAllowed;

  useEffect(() => {
    if (!call || !isSupported) return;
    const ncInstance = NoiseCancellationWrapper.getInstance();
    const unsubscribe = ncInstance.on('change', (v) => setIsEnabled(v));
    call.microphone
      .enableNoiseCancellation(ncInstance)
      .catch((err) =>
        getLogger(['NoiseCancellationProvider'])(
          'error',
          `Can't initialize noise suppression`,
          err,
        ),
      );

    return () => {
      call.microphone
        .disableNoiseCancellation()
        .catch((err) =>
          getLogger(['NoiseCancellationProvider'])(
            'error',
            `Can't disable noise suppression`,
            err,
          ),
        );
      unsubscribe();
    };
  }, [call, isSupported]);

  return (
    <NoiseCancellationContext.Provider
      value={{
        deviceSupportsAdvancedAudioProcessing,
        isSupported,
        isEnabled,
        setEnabled: (enabledOrSetter) => {
          const ncInstance = NoiseCancellationWrapper.getInstance();
          const enable =
            typeof enabledOrSetter === 'function'
              ? enabledOrSetter(isEnabled)
              : enabledOrSetter;
          if (enable) {
            ncInstance.enable();
          } else {
            ncInstance.disable();
          }
        },
      }}
    >
      {props.children}
    </NoiseCancellationContext.Provider>
  );
};
