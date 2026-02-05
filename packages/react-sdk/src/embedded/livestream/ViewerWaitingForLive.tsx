import { useEffect, useRef } from 'react';
import { CallingState } from '@stream-io/video-client';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';

export type ViewerWaitingForLiveProps = {
  onJoin: () => void;
  canJoin: boolean;
};

export const ViewerWaitingForLive = ({
  onJoin,
  canJoin,
}: ViewerWaitingForLiveProps) => {
  const { t } = useI18n();
  const { useCallStartsAt, useCallCallingState, useParticipantCount } =
    useCallStateHooks();
  const startsAt = useCallStartsAt();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const hasInitiatedJoin = useRef(false);

  const isJoined = callingState === CallingState.JOINED;

  useEffect(() => {
    if (canJoin && !hasInitiatedJoin.current) {
      hasInitiatedJoin.current = true;
      onJoin();
    }
  }, [canJoin, onJoin]);

  const getMessage = () => {
    if (startsAt) {
      const now = Date.now();
      if (startsAt.getTime() < now) {
        return t('Livestream starts soon');
      }
      return t('Livestream starts at {{time}}', {
        time: startsAt.toLocaleTimeString(),
      });
    }
    return t('Waiting for livestream to start...');
  };

  return (
    <div className="str-video__embedded-viewer-waiting-for-live">
      <div className="str-video__embedded-viewer-waiting-for-live__content">
        <div className="str-video__embedded-viewer-waiting-for-live__icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 6v6l4 2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p className="str-video__embedded-viewer-waiting-for-live__message">
          {getMessage()}
        </p>
        {isJoined && participantCount > 0 && (
          <p className="str-video__embedded-viewer-waiting-for-live__participant-count">
            {t('{{count}} watching', { count: participantCount })}
          </p>
        )}
      </div>
    </div>
  );
};
