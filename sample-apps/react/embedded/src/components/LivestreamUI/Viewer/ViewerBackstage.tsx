import { useEffect, useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';

/**
 * Custom backstage layout for viewers waiting for the livestream to start.
 * Displays countdown timer and participant count.
 */
export const ViewerBackstage = () => {
  const { useParticipantCount, useCallStartsAt } = useCallStateHooks();
  const participantCount = useParticipantCount();
  const startsAt = useCallStartsAt();
  const countdown = useCountdown(startsAt);

  const getParticipantMessage = () => {
    if (participantCount === 1) return '1 viewer waiting';
    return `${participantCount} viewers waiting`;
  };

  return (
    <div className="rd__viewer-backstage">
      <div className="rd__viewer-backstage__content">
        <span className="rd__viewer-backstage__title">
          Livestream starts soon
        </span>
        {countdown && (
          <span className="rd__viewer-backstage__countdown">{countdown}</span>
        )}
        <span className="rd__viewer-backstage__viewers">
          {getParticipantMessage()}
        </span>
      </div>
    </div>
  );
};

const useCountdown = (startsAt: Date | undefined) => {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(startsAt));

  useEffect(() => {
    if (!startsAt) return;

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(startsAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [startsAt]);

  return timeLeft;
};

const getTimeLeft = (startsAt: Date | undefined): string | null => {
  if (!startsAt) return null;

  const diff = startsAt.getTime() - Date.now();
  if (diff <= 0) return null;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
};

const pad = (n: number) => n.toString().padStart(2, '0');
