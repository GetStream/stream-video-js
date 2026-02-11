import { useCallback, useEffect, useState } from 'react';
import { humanize } from '@stream-io/video-client';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { Icon } from '../../../components';

export type ViewerLobbyProps = {
  onJoin: () => void;
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

  const handleJoin = useCallback(() => {
    onJoin?.();
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
          <Icon icon={isLive ? 'play' : 'clock'} />
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

        {participantCount > 0 && (
          <div className="str-video__embedded-livestream-duration__viewers">
            <Icon
              icon="eye"
              className="str-video__embedded-livestream-duration__eye-icon"
            />
            <span className="str-video__embedded-livestream-duration__count">
              {humanize(participantCount)}
            </span>
          </div>
        )}

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
      </div>
    </div>
  );
};
