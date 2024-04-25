import {
  CompositeButton,
  Icon,
  useNoiseCancellation,
} from '@stream-io/video-react-sdk';

export const ToggleNoiseCancellationButton = () => {
  const { isSupported, isEnabled, setEnabled } = useNoiseCancellation();
  if (!isSupported) return null;
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
