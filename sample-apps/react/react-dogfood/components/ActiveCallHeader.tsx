import { useEffect, useState } from 'react';
import {
  CallingState,
  CancelCallButton,
  LoadingIndicator,
  Notification,
  useCallStateHooks,
  Icon,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';

import { differenceInSeconds } from 'date-fns';

import { CallHeaderTitle } from './CallHeaderTitle';

import { LayoutSelectorProps } from './LayoutSelector';

export const LatencyIndicator = () => {
  const { useCallStatsReport } = useCallStateHooks();
  const statsReport = useCallStatsReport();
  const latency = statsReport?.publisherStats?.averageRoundTripTimeInMs ?? 0;

  return (
    <div className="rd__header__latency">
      <div
        className={clsx('rd__header__latency-indicator', {
          'rd__header__latency-indicator--good': latency && latency <= 100,
          'rd__header__latency-indicator--ok':
            latency && latency > 100 && latency < 150,
          'rd__header__latency-indicator--bad': latency && latency > 150,
        })}
      ></div>
      {latency} mps
    </div>
  );
};

export const Elapsed = ({
  joinedAt,
}: {
  className?: string;
  joinedAt: number;
}) => {
  const [elapsed, setElapsed] = useState<string>();

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedSeconds = differenceInSeconds(
        Date.now(),
        new Date(joinedAt * 1000),
      );

      const date = new Date(0);
      date.setSeconds(elapsedSeconds);
      const format = date.toISOString().substring(14, 19);

      setElapsed(format);
    }, 1000);
    return () => clearInterval(interval);
  }, [joinedAt]);

  return (
    <div className="rd__header__elapsed">
      <Icon className="rd__header__elapsed-icon" icon="verified" />
      <div className="rd__header__elapsed-time">{elapsed}</div>
    </div>
  );
};

export const ActiveCallHeader = ({
  onLeave,
}: { onLeave: () => void } & LayoutSelectorProps) => {
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const isOffline = callingState === CallingState.OFFLINE;
  const isMigrating = callingState === CallingState.MIGRATING;
  const isJoining = callingState === CallingState.JOINING;
  const isReconnecting = callingState === CallingState.RECONNECTING;
  const hasFailedToRecover = callingState === CallingState.RECONNECTING_FAILED;

  const participants = useParticipants();
  const me = participants?.find((p) => p.isLocalParticipant);

  return (
    <>
      <div className="rd__call-header">
        <CallHeaderTitle />
        <div className="rd__call-header__controls-group">
          <Elapsed joinedAt={Number(me?.joinedAt?.seconds) || Date.now()} />
          <LatencyIndicator />
          <CancelCallButton onLeave={onLeave} />
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
