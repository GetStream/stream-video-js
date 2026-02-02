import { useEffect, useState } from 'react';
import { CallingState } from '@stream-io/video-client';
import {
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-bindings';
import { Icon, LoadingIndicator, Notification } from '../../../../components';

const RecordingIndicator = () => {
  const { t } = useI18n();
  return (
    <div className="str-video__embedded-header__recording-indicator">
      {t('Recording...')}
    </div>
  );
};

const LatencyIndicator = () => {
  const { useCallStatsReport } = useCallStateHooks();
  const statsReport = useCallStatsReport();
  const latency = statsReport?.publisherStats?.averageRoundTripTimeInMs ?? 0;

  const getLatencyClass = () => {
    if (latency <= 100)
      return 'str-video__embedded-header__latency-indicator--good';
    if (latency < 400)
      return 'str-video__embedded-header__latency-indicator--ok';
    return 'str-video__embedded-header__latency-indicator--bad';
  };

  return (
    <div className="str-video__embedded-header__latency">
      <div
        className={`str-video__embedded-header__latency-indicator ${getLatencyClass()}`}
      />
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
    <div className="str-video__embedded-header__elapsed">
      <Icon
        className="str-video__embedded-header__elapsed-icon"
        icon="verified"
      />
      <div className="str-video__embedded-header__elapsed-time">{elapsed}</div>
    </div>
  );
};

const ParticipantCountIndicator = () => {
  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();

  return (
    <div className="str-video__embedded-header__participant-count">
      <Icon icon="participants" />
      {participantCount}
    </div>
  );
};

export const CallHeader = () => {
  const { t } = useI18n();
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
      <div className="str-video__embedded-call-header">
        <div className="str-video__embedded-call-header__title">
          <span className="str-video__embedded-call-header__user-name">
            {user?.name || user?.id}
          </span>
        </div>

        <div className="str-video__embedded-call-header__controls-group">
          {isRecordingInProgress && <RecordingIndicator />}
          <ParticipantCountIndicator />
          <Elapsed startedAt={session?.started_at} />
          <LatencyIndicator />
        </div>
      </div>
      <div className="str-video__embedded-call-header__notifications">
        {(() => {
          if (isOffline || hasFailedToRecover) {
            return (
              <Notification
                isVisible
                placement="bottom"
                message={
                  isOffline
                    ? t(
                        'You are offline. Check your internet connection and try again later.',
                      )
                    : t(
                        'Failed to restore connection. Check your internet connection and try again later.',
                      )
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
                      ? t('Migrating...')
                      : isJoining
                        ? t('Joining')
                        : t('Reconnecting...')
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
