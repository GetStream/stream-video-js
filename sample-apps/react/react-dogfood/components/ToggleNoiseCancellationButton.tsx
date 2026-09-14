import {
  CompositeButton,
  Icon,
  LoadingIndicator,
  WithTooltip,
  useNoiseCancellation,
} from '@stream-io/video-react-sdk';
import { useAppI18n } from '../hooks/useAppI18n';

export const ToggleNoiseCancellationButton = () => {
  const { isSupported, isEnabled, isReady, setEnabled } =
    useNoiseCancellation();
  const { t } = useAppI18n();

  if (!isSupported) return null;

  const title = !isReady
    ? t(
        'callControls.noiseCancellation.loading.title',
        'Noise cancellation is loading',
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
