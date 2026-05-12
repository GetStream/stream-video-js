import {
  CompositeButton,
  Icon,
  LoadingIndicator,
  WithTooltip,
  useNoiseCancellation,
} from '@stream-io/video-react-sdk';

export const ToggleNoiseCancellationButton = () => {
  const { isSupported, isEnabled, isReady, setEnabled } =
    useNoiseCancellation();

  if (!isSupported) return null;

  return (
    <WithTooltip
      title={`Noise cancellation is ${!isReady ? 'loading' : isEnabled ? 'active' : 'inactive'}`}
    >
      <CompositeButton
        disabled={!isReady}
        onClick={() => setEnabled((v) => !v)}
        variant="primary"
      >
        {!isReady ? (
          <LoadingIndicator />
        ) : (
          <Icon icon={isEnabled ? 'anc' : 'anc-off'} />
        )}
      </CompositeButton>
    </WithTooltip>
  );
};
