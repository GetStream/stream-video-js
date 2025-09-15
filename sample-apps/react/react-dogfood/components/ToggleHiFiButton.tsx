import {
  CompositeButton,
  Icon,
  SfuModels,
  useCallStateHooks,
  useI18n,
  WithTooltip,
} from '@stream-io/video-react-sdk';

export const ToggleHiFiButton = () => {
  const { t } = useI18n();
  const { useMicrophoneState } = useCallStateHooks();
  const { microphone, audioBitrateProfile } = useMicrophoneState();
  const hiFiEnabled =
    audioBitrateProfile === SfuModels.AudioBitrateProfile.MUSIC_HIGH_QUALITY;

  const handleToggle = async () => {
    if (!microphone) return;

    try {
      if (hiFiEnabled) {
        await microphone.setAudioBitrateProfile(
          SfuModels.AudioBitrateProfile.VOICE_STANDARD_UNSPECIFIED,
          false,
        );
      } else {
        await microphone.setAudioBitrateProfile(
          SfuModels.AudioBitrateProfile.MUSIC_HIGH_QUALITY,
          true,
        );
      }
    } catch (error) {
      console.error('Failed to toggle Hi-Fi audio:', error);
    }
  };

  return (
    <WithTooltip
      title={t(hiFiEnabled ? 'Disable Hi-Fi Audio' : 'Enable Hi-Fi Audio')}
    >
      <CompositeButton
        active={hiFiEnabled}
        variant="primary"
        onClick={handleToggle}
      >
        <Icon icon="speaker" />
      </CompositeButton>
    </WithTooltip>
  );
};
