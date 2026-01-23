import { useEffect, useState } from 'react';
import {
  CallingState,
  Icon,
  LoadingIndicator,
  Notification,
  useCallStateHooks,
  useConnectedUser,
} from '@stream-io/video-react-sdk';

const RecordingIndicator = () => {
  return <div className="rd__header__recording-indicator">Recording...</div>;
};

const LatencyIndicator = () => {
  const { useCallStatsReport } = useCallStateHooks();
  const statsReport = useCallStatsReport();
  const latency = statsReport?.publisherStats?.averageRoundTripTimeInMs ?? 0;

  const getLatencyClass = () => {
    if (latency <= 100) return 'rd__header__latency-indicator--good';
    if (latency < 400) return 'rd__header__latency-indicator--ok';
    return 'rd__header__latency-indicator--bad';
  };

  return (
    <div className="rd__header__latency">
      <div className={`rd__header__latency-indicator ${getLatencyClass()}`} />
      {latency} ms
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

const ParticipantCountIndicator = () => {
  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();

  return (
    <div className="rd__header__participant-count">
      <Icon icon="participants" />
      {participantCount}
    </div>
  );
};

export const CallHeader = () => {
  const user = useConnectedUser();
  const { useCallSession, useCallCallingState, useIsCallRecordingInProgress } =
    useCallStateHooks();
  const session = useCallSession();
  const isRecordingInProgress = useIsCallRecordingInProgress();
  const callingState = useCallCallingState();

  const isOffline = callingState === CallingState.OFFLINE;
  const isMigrating = callingState === CallingState.MIGRATING;
  const isJoining = callingState === CallingState.JOINING;
  const isReconnecting = callingState === CallingState.RECONNECTING;
  const hasFailedToRecover = callingState === CallingState.RECONNECTING_FAILED;

  return (
    <>
      <div className="rd__call-header">
        <div className="rd__call-header__title">
          <span className="rd__call-header__user-name">
            {user?.name || user?.id}
          </span>
        </div>

        <div className="rd__call-header__controls-group">
          {isRecordingInProgress && <RecordingIndicator />}
          <ParticipantCountIndicator />
          <Elapsed startedAt={session?.started_at} />
          <LatencyIndicator />
        </div>
      </div>
      <div className="rd__call-header__notifications">
        {(() => {
          if (isOffline || hasFailedToRecover) {
            return (
              <Notification
                isVisible
                placement="bottom"
                message={
                  isOffline
                    ? 'You are offline. Check your internet connection and try again later.'
                    : 'Failed to restore connection. Check your internet connection and try again later.'
                }
              >
                <span />
              </Notification>
            );
          }

          return (
            <Notification
              isVisible={isJoining || isReconnecting || isMigrating}
              iconClassName={null}
              placement="bottom"
              message={
                <LoadingIndicator
                  text={
                    isMigrating
                      ? 'Migrating...'
                      : isJoining
                        ? 'Joining...'
                        : 'Reconnecting...'
                  }
                />
              }
            >
              <span />
            </Notification>
          );
        })()}
      </div>
    </>
  );
};

export default CallHeader;
