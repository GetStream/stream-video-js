import {
  CompositeButton,
  Icon,
  LoadingIndicator,
  WithTooltip,
  useNoiseCancellation,
} from '@stream-io/video-react-sdk';
import { useAppI18n } from '../hooks/useAppI18n';

export const ToggleNoiseCancellationButton = () => {
  const { isSupported, isEnabled, isReady, status, setEnabled } =
    useNoiseCancellation();
  const { t } = useAppI18n();

  if (!isSupported) return null;

  const isOverloaded = status === 'suspended' || status === 'overloaded';
  const title = !isReady
    ? t(
        'callControls.noiseCancellation.loading.title',
        'Noise cancellation is loading',
      )
    : status === 'suspended'
      ? t(
          'callControls.noiseCancellation.suspended.title',
          'Noise cancellation is paused because your device is overloaded. It will resume shortly.',
        )
      : status === 'overloaded'
        ? t(
            'callControls.noiseCancellation.overloaded.title',
            'Noise cancellation was turned off because your device is overloaded',
          )
        : isEnabled
          ? t(
              'callControls.noiseCancellation.active.title',
              'Noise cancellation is active',
            )
          : t(
              'callControls.noiseCancellation.inactive.title',
              'Noise cancellation is inactive',
            );

  return (
    <WithTooltip title={title}>
      <CompositeButton
        disabled={!isReady}
        variant={isOverloaded ? 'destructive' : undefined}
        onClick={() => setEnabled((v) => !v)}
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
