import {
  CompositeButton,
  Icon,
  SfuModels,
  useCallStateHooks,
  WithTooltip,
} from '@stream-io/video-react-sdk';
import { useCallback } from 'react';
import { useAppI18n } from '../hooks/useAppI18n';

export const ToggleHiFiButton = () => {
  const { t } = useAppI18n();
  const { useMicrophoneState, useCallSettings } = useCallStateHooks();

  const settings = useCallSettings();
  const allowHiFi = settings?.audio.hifi_audio_enabled ?? false;

  const { microphone, audioBitrateProfile } = useMicrophoneState();
  const isHiFiEnabled =
    audioBitrateProfile === SfuModels.AudioBitrateProfile.MUSIC_HIGH_QUALITY;

  const toggleHiFi = useCallback(async () => {
    try {
      await microphone.setAudioBitrateProfile(
        isHiFiEnabled
          ? SfuModels.AudioBitrateProfile.VOICE_STANDARD_UNSPECIFIED
          : SfuModels.AudioBitrateProfile.MUSIC_HIGH_QUALITY,
      );
    } catch (error) {
      console.error('Failed to toggle Hi-Fi audio:', error);
    }
  }, [isHiFiEnabled, microphone]);

  if (!allowHiFi) return null;

  return (
    <WithTooltip
      title={
        isHiFiEnabled
          ? t('callControls.hiFiButton.disable.title', 'Disable Hi-Fi Audio')
          : t('callControls.hiFiButton.enable.title', 'Enable Hi-Fi Audio')
      }
    >
      <CompositeButton
        active={isHiFiEnabled}
        disabled={!allowHiFi}
        onClick={toggleHiFi}
      >
        <Icon icon="speaker" />
      </CompositeButton>
    </WithTooltip>
  );
};
