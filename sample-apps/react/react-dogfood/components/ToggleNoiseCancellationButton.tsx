import {
  CompositeButton,
  Icon,
  LoadingIndicator,
  useI18n,
  WithTooltip,
  useNoiseCancellation,
} from '@stream-io/video-react-sdk';

export const ToggleNoiseCancellationButton = () => {
  const { isSupported, isEnabled, isReady, setEnabled } =
    useNoiseCancellation();
  const { t } = useI18n();

  if (!isSupported) return null;

  const title = !isReady
    ? t('Noise cancellation is loading')
    : isEnabled
      ? t('Noise cancellation is active')
      : t('Noise cancellation is inactive');

  return (
    <WithTooltip title={title}>
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
