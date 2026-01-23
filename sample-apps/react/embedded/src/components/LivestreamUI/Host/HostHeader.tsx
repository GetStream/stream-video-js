import { useEffect, useState } from 'react';
import { Icon, useCallStateHooks } from '@stream-io/video-react-sdk';

export const HostHeader = () => {
  const {
    useCallCustomData,
    useIsCallLive,
    useParticipantCount,
    useCallSession,
  } = useCallStateHooks();
  const customData = useCallCustomData();
  const isLive = useIsCallLive();
  const participantCount = useParticipantCount();
  const session = useCallSession();

  return (
    <div className="rd__call-header">
      <div className="rd__call-header__title">
        <span className="rd__call-header__user-name">
          {(customData?.title as string) || 'Livestream'}
        </span>
      </div>

      <div className="rd__call-header__controls-group">
        {isLive && <LiveBadge />}
        <ParticipantCount count={participantCount} />
        <Elapsed startedAt={session?.live_started_at || session?.started_at} />
      </div>
    </div>
  );
};

const LiveBadge = () => {
  return <div className="rd__header__live-indicator">Live</div>;
};

const ParticipantCount = ({ count }: { count: number }) => {
  return (
    <div className="rd__header__participant-count rd__header__participant-count--visible">
      <Icon icon="participants" />
      {count}
    </div>
  );
};

const Elapsed = ({ startedAt }: { startedAt: string | undefined }) => {
  const [elapsed, setElapsed] = useState<string>('00:00');
  const [startedAtDate] = useState(() => {
    return startedAt ? new Date(startedAt).getTime() : Date.now();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startedAtDate) / 1000;
      const date = new Date(0);
      date.setSeconds(elapsedSeconds);
      const format = date.toISOString();
      const hours = format.substring(11, 13);
      const minutes = format.substring(14, 16);
      const seconds = format.substring(17, 19);
      const time = `${hours !== '00' ? hours + ':' : ''}${minutes}:${seconds}`;
      setElapsed(time);
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAtDate]);

  return (
    <div className="rd__header__elapsed">
      <Icon className="rd__header__elapsed-icon" icon="verified" />
      <div className="rd__header__elapsed-time">{elapsed}</div>
    </div>
  );
};
