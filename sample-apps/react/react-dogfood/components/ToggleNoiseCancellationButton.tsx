import {
  CompositeButton,
  Icon,
  LoadingIndicator,
  useI18n,
  WithTooltip,
  useNoiseCancellation,
} from '@stream-io/video-react-sdk';

export const ToggleNoiseCancellationButton = () => {
  const { isSupported, isEnabled, isReady, status, setEnabled } =
    useNoiseCancellation();
  const { t } = useI18n();

  if (!isSupported) return null;

  const title = !isReady
    ? t('Noise cancellation is loading')
    : status === 'suspended'
      ? t(
          'Noise cancellation is paused because your device is overloaded. It will resume shortly.',
        )
      : status === 'overloaded'
        ? t(
            'Noise cancellation was turned off because your device is overloaded',
          )
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
