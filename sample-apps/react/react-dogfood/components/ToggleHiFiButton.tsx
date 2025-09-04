import {
  CompositeButton,
  Icon,
  WithTooltip,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-sdk';

export const ToggleHiFiButton = () => {
  const { t } = useI18n();
  const { useMicrophoneState } = useCallStateHooks();
  const { microphone, hiFiEnabled } = useMicrophoneState();

  const handleToggle = async () => {
    if (!microphone) return;

    try {
      if (hiFiEnabled) {
        await microphone.disableHiFi();
      } else {
        await microphone.enableHiFi();
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
