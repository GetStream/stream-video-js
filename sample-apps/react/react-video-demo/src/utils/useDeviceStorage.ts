import { useEffect } from 'react';
import {
  MediaDevicesContextAPI,
  SfuModels,
  useLocalParticipant,
  useMediaDevices,
} from '@stream-io/video-react-sdk';

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
  const settings = window.localStorage.getItem(SETTINGS_KEY);
  if (settings) {
    try {
      return JSON.parse(settings) as LocalDeviceSettings;
    } catch (e) {
      console.log('Error parsing device settings', e);
    }
  }
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

  const localParticipant = useLocalParticipant();
  if (localParticipant) {
    const publishedTracks = localParticipant.publishedTracks || [];
    isAudioMute = !publishedTracks.includes(SfuModels.TrackType.AUDIO);
    isVideoMute = !publishedTracks.includes(SfuModels.TrackType.VIDEO);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
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
  }, [
    isAudioMute,
    isVideoMute,
    selectedAudioInputDeviceId,
    selectedAudioOutputDeviceId,
    selectedVideoDeviceId,
  ]);
  return null;
};
