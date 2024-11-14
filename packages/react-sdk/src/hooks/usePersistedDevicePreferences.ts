import { type MutableRefObject, useEffect, useRef } from 'react';
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
const usePersistDevicePreferences = (
  key: string,
  shouldPersistRef: MutableRefObject<boolean>,
) => {
  const { useMicrophoneState, useCameraState, useSpeakerState } =
    useCallStateHooks();
  const call = useCall();
  const mic = useMicrophoneState();
  const camera = useCameraState();
  const speaker = useSpeakerState();
  useEffect(() => {
    if (!shouldPersistRef.current) return;
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
    shouldPersistRef,
  ]);
};

/**
 * This hook will apply the device settings from local storage.
 *
 * @param key the key to use for local storage.
 */
const useApplyDevicePreferences = (key: string, onApplied: () => void) => {
  const call = useCall();
  const onAppliedRef = useRef(onApplied);
  onAppliedRef.current = onApplied;
  useEffect(() => {
    if (!call) return;
    if (call.state.callingState === CallingState.LEFT) return;

    let cancel = false;

    const apply = async () => {
      const initMic = async (setting: LocalDevicePreference) => {
        if (cancel) return;
        await call.microphone.select(parseDeviceId(setting.selectedDeviceId));
        if (cancel) return;
        if (setting.muted) {
          await call.microphone.disable();
        } else {
          await call.microphone.enable();
        }
      };

      const initCamera = async (setting: LocalDevicePreference) => {
        if (cancel) return;
        await call.camera.select(parseDeviceId(setting.selectedDeviceId));
        if (cancel) return;
        if (setting.muted) {
          await call.camera.disable();
        } else {
          await call.camera.enable();
        }
      };

      const initSpeaker = (setting: LocalDevicePreference) => {
        if (cancel) return;
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

    apply()
      .then(() => onAppliedRef.current())
      .catch((err) => {
        console.warn('Failed to apply device preferences', err);
      });

    return () => {
      cancel = true;
    };
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
  const shouldPersistRef = useRef(false);
  useApplyDevicePreferences(key, () => (shouldPersistRef.current = true));
  usePersistDevicePreferences(key, shouldPersistRef);
};

const parseDeviceId = (deviceId: string) =>
  deviceId !== defaultDevice ? deviceId : undefined;
