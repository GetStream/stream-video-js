import { useEffect } from 'react';
import { SfuModels, useCallStateHooks } from '@stream-io/video-react-sdk';

export type LocalDeviceSettings = {
  selectedVideoDeviceId: string;
  selectedAudioInputDeviceId: string;
  selectedAudioOutputDeviceId: string;
  isAudioMute: boolean;
  isVideoMute: boolean;
};

const SETTINGS_KEY = '@pronto/device-settings';

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

export const DeviceSettingsCaptor = () => {
  // FIXME OL: rework this

  const {
    selectedAudioOutputDeviceId = 'default',
    selectedAudioInputDeviceId = 'default',
    selectedVideoDeviceId = 'default',
    initialAudioEnabled = true,
    initialVideoState = { enabled: true },
  } = {};

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
