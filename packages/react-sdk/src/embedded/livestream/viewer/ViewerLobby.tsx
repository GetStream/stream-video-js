import { useCallback, useEffect, useState } from 'react';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { Icon } from '../../../components';
import { ViewersCount } from '../../shared';

export type ViewerLobbyProps = {
  onJoin: () => Promise<void>;
  canJoin: boolean;
  isLive: boolean;
};

export const ViewerLobby = ({ onJoin, canJoin, isLive }: ViewerLobbyProps) => {
  const { t } = useI18n();
  const { useCallStartsAt, useParticipantCount } = useCallStateHooks();
  const startsAt = useCallStartsAt();
  const participantCount = useParticipantCount();
  const [autoJoin, setAutoJoin] = useState(false);
  const [startsAtPassed, setStartsAtPassed] = useState(
    () => !!startsAt && startsAt.getTime() < Date.now(),
  );
  const [showError, setShowError] = useState<boolean>(false);

  const handleJoin = useCallback(async () => {
    try {
      await onJoin?.();
    } catch {
      setShowError(true);
    }
  }, [onJoin]);

  useEffect(() => {
    if (canJoin && autoJoin) {
      handleJoin();
    }
  }, [canJoin, autoJoin, handleJoin]);

  useEffect(() => {
    if (!startsAt || startsAtPassed) return;

    const check = () => {
      if (startsAt.getTime() < Date.now()) {
        setStartsAtPassed(true);
      }
    };

    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [startsAt, startsAtPassed]);

  const getStartsAtMessage = () => {
    if (!startsAt) return null;

    if (startsAtPassed) {
      return t('Livestream starts soon');
    }

    return t('Livestream starts at {{ time }}', {
      time: startsAt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  };

  return (
    <div className="str-video__embedded-viewer-lobby">
      <div className="str-video__embedded-viewer-lobby__content">
        <div className="str-video__embedded-viewer-lobby__icon">
          <Icon icon="streaming" />
        </div>

        <h2 className="str-video__embedded-viewer-lobby__title">
          {isLive
            ? t('Stream is ready!')
            : t('Waiting for the livestream to start')}
        </h2>

        {!isLive && getStartsAtMessage() && (
          <p className="str-video__embedded-viewer-lobby__starts-at">
            {getStartsAtMessage()}
          </p>
        )}

        {participantCount > 0 && <ViewersCount count={participantCount} />}

        <div className="str-video__embedded-viewer-lobby__actions">
          {canJoin ? (
            <button className="str-video__button" onClick={handleJoin}>
              {t('Join Stream')}
            </button>
          ) : (
            <label className="str-video__embedded-viewer-lobby__auto-join">
              <input
                type="checkbox"
                checked={autoJoin}
                onChange={(e) => setAutoJoin(e.target.checked)}
              />
              <span>{t('Join automatically when stream starts')}</span>
            </label>
          )}
        </div>
        <p
          className="str-video__embedded-viewer-lobby__join-error"
          role="status"
          aria-live="polite"
          data-visible={showError}
        >
          {t('Failed to join. Please try again.')}
        </p>
      </div>
    </div>
  );
};
