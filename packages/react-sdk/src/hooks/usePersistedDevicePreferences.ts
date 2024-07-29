import { useEffect } from 'react';
import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

export type LocalDevicePreference = {
  selectedDeviceId: string;
  muted: boolean;
};

export type LocalDevicePreferences = {
  [type in 'mic' | 'camera' | 'speaker']: LocalDevicePreference;
};

const defaultDevice = 'default';

/**
 * This hook will persist the device settings to local storage.
 *
 * @param key the key to use for local storage.
 */
const usePersistDevicePreferences = (key: string) => {
  const { useMicrophoneState, useCameraState, useSpeakerState } =
    useCallStateHooks();
  const call = useCall();
  const mic = useMicrophoneState();
  const camera = useCameraState();
  const speaker = useSpeakerState();
  useEffect(() => {
    if (!call) return;
    if (call.state.callingState === CallingState.LEFT) return;
    try {
      const preferences: LocalDevicePreferences = {
        mic: {
          selectedDeviceId: mic.selectedDevice || defaultDevice,
          muted: mic.isMute,
        },
        camera: {
          selectedDeviceId: camera.selectedDevice || defaultDevice,
          muted: camera.isMute,
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
    call,
    camera.isMute,
    camera.selectedDevice,
    key,
    mic.isMute,
    mic.selectedDevice,
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
  useEffect(() => {
    if (!call) return;
    if (call.state.callingState === CallingState.LEFT) return;

    const apply = async () => {
      const initMic = async (setting: LocalDevicePreference) => {
        await call.microphone.select(parseDeviceId(setting.selectedDeviceId));
        if (setting.muted) {
          await call.microphone.disable();
        } else {
          await call.microphone.enable();
        }
      };

      const initCamera = async (setting: LocalDevicePreference) => {
        await call.camera.select(parseDeviceId(setting.selectedDeviceId));
        if (setting.muted) {
          await call.camera.disable();
        } else {
          await call.camera.enable();
        }
      };

      const initSpeaker = (setting: LocalDevicePreference) => {
        call.speaker.select(parseDeviceId(setting.selectedDeviceId) ?? '');
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
      }
    };

    apply().catch((err) => {
      console.warn('Failed to apply device preferences', err);
    });
  }, [call, key]);
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

const parseDeviceId = (deviceId: string) =>
  deviceId !== defaultDevice ? deviceId : undefined;
