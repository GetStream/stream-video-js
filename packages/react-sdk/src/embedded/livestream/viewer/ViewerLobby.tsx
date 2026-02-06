import { useCallback, useEffect, useState } from 'react';
import { humanize } from '@stream-io/video-client';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';

export type ViewerLobbyProps = {
  onJoin: () => void;
  isLive: boolean;
};

export const ViewerLobby = ({ onJoin, isLive }: ViewerLobbyProps) => {
  const { t } = useI18n();
  const { useCallStartsAt, useParticipantCount } = useCallStateHooks();
  const startsAt = useCallStartsAt();
  const participantCount = useParticipantCount();
  const [autoJoin, setAutoJoin] = useState(false);

  const handleJoin = useCallback(() => {
    onJoin?.();
  }, [onJoin]);

  useEffect(() => {
    if (isLive && autoJoin) {
      handleJoin();
    }
  }, [isLive, autoJoin, handleJoin]);

  const getStartsAtMessage = () => {
    if (!startsAt) return null;
    if (startsAt.getTime() < Date.now()) {
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
          {isLive ? <PlayIcon /> : <ClockIcon />}
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
          <p className="str-video__embedded-viewer-lobby__participant-count">
            {t('{{ count }} waiting', { count: humanize(participantCount) })}
          </p>
        )}

        <div className="str-video__embedded-viewer-lobby__actions">
          {isLive ? (
            <button
              className="str-video__embedded-button str-video__embedded-button--primary str-video__embedded-button--large str-video__embedded-viewer-lobby__join-button"
              onClick={handleJoin}
            >
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

const ClockIcon = () => (
  <svg
    width="56"
    height="56"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M12 6v6l4 2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const PlayIcon = () => (
  <svg
    width="56"
    height="56"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
  </svg>
);
