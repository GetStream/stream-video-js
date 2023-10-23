import { useEffect } from 'react';
import {
  MediaDevicesContextAPI,
  SfuModels,
  useCallStateHooks,
  useMediaDevices,
} from '@stream-io/video-react-sdk';

const initialSettings: LocalDeviceSettings = {
  isAudioMute: true,
  isVideoMute: false,
  selectedAudioOutputDeviceId: 'default',
  selectedAudioInputDeviceId: 'default',
  selectedVideoDeviceId: 'default',
};

export type LocalDeviceSettings = Pick<
  MediaDevicesContextAPI,
  | 'selectedVideoDeviceId'
  | 'selectedAudioInputDeviceId'
  | 'selectedAudioOutputDeviceId'
> & {
  isAudioMute: boolean;
  isVideoMute: boolean;
};

const SETTINGS_KEY = '@react-video-demo/device-settings';

export const getStoredDeviceSettings = () => {
  if (typeof window === 'undefined') return;
  try {
    const settings = window.localStorage.getItem(SETTINGS_KEY);
    if (settings) {
      try {
        return JSON.parse(settings) as LocalDeviceSettings;
      } catch (e) {
        console.log('Error parsing device settings', e);
      }
    } else {
      window.localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ ...initialSettings }),
      );
    }
  } catch (e) {
    console.warn(`Failed to retrieve device settings`, e);
  }
  return {
    ...initialSettings,
  };
};

export const DeviceSettingsCaptor = () => {
  const {
    selectedAudioOutputDeviceId,
    selectedAudioInputDeviceId,
    selectedVideoDeviceId,
    initialAudioEnabled,
    initialVideoState,
  } = useMediaDevices();

  let isAudioMute = !initialAudioEnabled;
  let isVideoMute = !initialVideoState.enabled;

  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  if (localParticipant) {
    const publishedTracks = localParticipant.publishedTracks || [];
    isAudioMute = !publishedTracks.includes(SfuModels.TrackType.AUDIO);
    isVideoMute = !publishedTracks.includes(SfuModels.TrackType.VIDEO);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          isAudioMute,
          isVideoMute,
          selectedAudioOutputDeviceId,
          selectedAudioInputDeviceId,
          selectedVideoDeviceId,
        }),
      );
    } catch (e) {
      console.warn(`Failed to store device settings`, e);
    }
  }, [
    isAudioMute,
    isVideoMute,
    selectedAudioInputDeviceId,
    selectedAudioOutputDeviceId,
    selectedVideoDeviceId,
  ]);
  return null;
};
