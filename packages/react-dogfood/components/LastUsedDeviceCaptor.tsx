import { useEffect } from 'react';
import {
  MediaDevicesContextAPI,
  useMediaDevices,
} from '@stream-io/video-react-sdk';

export type LocalDeviceSettings = Pick<
  MediaDevicesContextAPI,
  | 'selectedVideoDeviceId'
  | 'selectedAudioInputDeviceId'
  | 'selectedAudioOutputDeviceId'
>;

const SETTINGS_KEY = '@pronto/preferred-devices';

export const getDeviceSettings = () => {
  if (typeof window === 'undefined') return;
  const settings = window.localStorage.getItem(SETTINGS_KEY);
  if (settings) {
    try {
      return JSON.parse(settings) as LocalDeviceSettings;
    } catch (e) {
      console.log('Error parsing device settings', e);
    }
  }
};

export const LastUsedDeviceCaptor = () => {
  const {
    selectedAudioOutputDeviceId,
    selectedAudioInputDeviceId,
    selectedVideoDeviceId,
  } = useMediaDevices();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        selectedAudioOutputDeviceId,
        selectedAudioInputDeviceId,
        selectedVideoDeviceId,
      }),
    );
  }, [
    selectedAudioInputDeviceId,
    selectedAudioOutputDeviceId,
    selectedVideoDeviceId,
  ]);
  return null;
};
