import {
  CompositeButton,
  Icon,
  useNoiseCancellation,
} from '@stream-io/video-react-sdk';

export const ToggleNoiseCancellationButton = () => {
  const { isEnabled, setEnabled } = useNoiseCancellation();
  return (
    <CompositeButton
      active={isEnabled}
      onClick={() => setEnabled((v) => !v)}
      variant="primary"
      title={`Noise cancellation is ${isEnabled ? 'active' : 'inactive'}`}
    >
      <Icon icon="anc" />
    </CompositeButton>
  );
};
