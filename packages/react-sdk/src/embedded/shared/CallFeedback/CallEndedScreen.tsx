import { useCallback, useState } from 'react';
import { useI18n } from '@stream-io/video-react-bindings';
import { Icon } from '../../../components';
import { useEmbeddedConfiguration } from '../../context';

interface CallEndedScreenProps {
  onJoin?: () => Promise<void>;
  onFeedback: () => void;
}

export const CallEndedScreen = ({
  onJoin,
  onFeedback,
}: CallEndedScreenProps) => {
  const { t } = useI18n();

  const [error, setError] = useState(false);
  const { onError } = useEmbeddedConfiguration();

  const handleRejoin = useCallback(async () => {
    if (!onJoin) return;

    try {
      await onJoin();
    } catch (err) {
      onError?.(err);
      setError(true);
    }
  }, [onJoin, onError]);

  return (
    <div className="str-video__embedded-call-feedback__container">
      <h2 className="str-video__embedded-call-feedback__title">
        {t('Call ended')}
      </h2>
      <p
        className="str-video__embedded-call-feedback__rejoin-error"
        role="status"
        aria-live="polite"
        data-visible={error}
      >
        {t('Failed to rejoin. Please try again.')}
      </p>
      <div className="str-video__embedded-call-feedback__ended-actions">
        {onJoin && (
          <>
            <div className="str-video__embedded-call-feedback__ended-column">
              <p className="str-video__embedded-call-feedback__ended-label">
                {t('Left by mistake?')}
              </p>
              <button
                type="button"
                className="str-video__embedded-call-feedback__ended-button"
                onClick={handleRejoin}
              >
                <Icon icon="login" />
                {t('Rejoin call')}
              </button>
            </div>
            <div className="str-video__embedded-call-feedback__ended-divider" />
          </>
        )}
        <div className="str-video__embedded-call-feedback__ended-column">
          <p className="str-video__embedded-call-feedback__ended-label">
            {t('Help us improve')}
          </p>
          <button
            type="button"
            className="str-video__embedded-call-feedback__ended-button"
            onClick={onFeedback}
          >
            <Icon icon="feedback" />
            {t('Leave feedback')}
          </button>
        </div>
      </div>
    </div>
  );
};
