import {
  CompositeButton,
  Icon,
  WithTooltip,
  useNoiseCancellation,
} from '@stream-io/video-react-sdk';

export const ToggleNoiseCancellationButton = () => {
  const { isSupported, isEnabled, setEnabled } = useNoiseCancellation();
  if (!isSupported) return null;
  return (
    <WithTooltip
      title={`Noise cancellation is ${isEnabled ? 'active' : 'inactive'}`}
    >
      <CompositeButton onClick={() => setEnabled((v) => !v)} variant="primary">
        <Icon icon={isEnabled ? 'anc' : 'anc-off'} />
      </CompositeButton>
    </WithTooltip>
  );
};
