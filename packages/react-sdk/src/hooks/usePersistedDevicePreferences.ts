import { useEffect } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

export type LocalDevicePreference = {
  selectedDeviceId: string;
  muted: boolean;
};

export type LocalDevicePreferences = {
  [type in 'mic' | 'camera' | 'speaker']: LocalDevicePreference;
};

/**
 * This hook will persist the device settings to local storage.
 *
 * @param key the key to use for local storage.
 */
const usePersistDevicePreferences = (key: string) => {
  const {
    useMicrophoneState,
    useCameraState,
    useSpeakerState,
    useCallSettings,
  } = useCallStateHooks();
  const mic = useMicrophoneState();
  const camera = useCameraState();
  const speaker = useSpeakerState();
  const settings = useCallSettings();
  useEffect(() => {
    if (!settings) return;
    try {
      const hasPreferences = !!window.localStorage.getItem(key);
      const { audio, video } = settings;
      const defaultDevice = 'default';
      const preferences: LocalDevicePreferences = {
        mic: {
          selectedDeviceId: mic.selectedDevice || defaultDevice,
          muted: hasPreferences ? mic.isMute : !audio.mic_default_on,
        },
        camera: {
          selectedDeviceId: camera.selectedDevice || defaultDevice,
          muted: hasPreferences ? camera.isMute : !video.camera_default_on,
        },
        speaker: {
          selectedDeviceId: speaker.selectedDevice || defaultDevice,
          muted: false,
        },
      };
      window.localStorage.setItem(key, JSON.stringify(preferences));
    } catch (err) {
      console.warn('Failed to save device preferences', err);
    }
  }, [
    camera.isMute,
    camera.selectedDevice,
    key,
    mic.isMute,
    mic.selectedDevice,
    settings,
    speaker.selectedDevice,
  ]);
};

/**
 * This hook will apply the device settings from local storage.
 *
 * @param key the key to use for local storage.
 */
const useApplyDevicePreferences = (key: string) => {
  const call = useCall();
  const { useCallSettings } = useCallStateHooks();
  const settings = useCallSettings();
  useEffect(() => {
    if (!call || !settings) return;

    const apply = async () => {
      const initMic = async (setting: LocalDevicePreference) => {
        await call.microphone.select(setting.selectedDeviceId);
        if (setting.muted) {
          await call.microphone.disable();
        } else {
          await call.microphone.enable();
        }
      };

      const initCamera = async (setting: LocalDevicePreference) => {
        await call.camera.select(setting.selectedDeviceId);
        if (setting.muted) {
          await call.camera.disable();
        } else {
          await call.camera.enable();
        }
      };

      const initSpeaker = (setting: LocalDevicePreference) => {
        call.speaker.select(setting.selectedDeviceId);
      };

      let preferences: LocalDevicePreferences | null = null;
      try {
        preferences = JSON.parse(
          window.localStorage.getItem(key)!,
        ) as LocalDevicePreferences;
      } catch (err) {
        console.warn('Failed to load device preferences', err);
      }
      if (preferences) {
        await initMic(preferences.mic);
        await initCamera(preferences.camera);
        initSpeaker(preferences.speaker);
      } else {
        const { audio, video } = settings;
        if (audio.mic_default_on) await call.microphone.enable();
        if (video.camera_default_on) await call.camera.enable();
      }
    };

    apply().catch((err) => {
      console.warn('Failed to apply device preferences', err);
    });
  }, [call, key, settings]);
};

/**
 * This hook will apply and persist the device preferences from local storage.
 *
 * @param key the key to use for local storage.
 */
export const usePersistedDevicePreferences = (
  key: string = '@stream-io/device-preferences',
) => {
  useApplyDevicePreferences(key);
  usePersistDevicePreferences(key);
};
