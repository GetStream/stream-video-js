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
  const { microphone, audioBitrateType } = useMicrophoneState();
  const hiFiEnabled =
    audioBitrateType === SfuModels.AudioBitrateType.MUSIC_HIGH_QUALITY;

  const handleToggle = async () => {
    if (!microphone) return;

    try {
      if (hiFiEnabled) {
        await microphone.setAudioBitrateType(
          SfuModels.AudioBitrateType.VOICE_STANDARD_UNSPECIFIED,
        );
      } else {
        await microphone.setAudioBitrateType(
          SfuModels.AudioBitrateType.MUSIC_HIGH_QUALITY,
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
