import { useEffect, useState } from 'react';
import {
  CallingState,
  CancelCallConfirmButton,
  Icon,
  LoadingIndicator,
  Notification,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';

import { differenceInSeconds } from 'date-fns';

import { CallHeaderTitle } from './CallHeaderTitle';
import { ToggleSettingsTabModal } from './Settings/SettingsTabModal';
import { ToggleDocumentationButton } from './ToggleDocumentationButton';

import { LayoutSelectorProps } from './LayoutSelector';

import { useIsDemoEnvironment } from '../context/AppEnvironmentContext';

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
      {latency} ms
    </div>
  );
};

export const Elapsed = ({
  startedAt,
}: {
  className?: string;
  startedAt: string | undefined;
}) => {
  const [elapsed, setElapsed] = useState<string>();

  useEffect(() => {
    const startedAtDate = startedAt ? new Date(startedAt) : new Date();
    const interval = setInterval(() => {
      const elapsedSeconds = differenceInSeconds(Date.now(), startedAtDate);

      const date = new Date(0);
      date.setSeconds(elapsedSeconds);
      const format = date.toISOString().substring(14, 19);

      setElapsed(format);
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <div className="rd__header__elapsed">
      <Icon className="rd__header__elapsed-icon" icon="verified" />
      <div className="rd__header__elapsed-time">{elapsed}</div>
    </div>
  );
};

export const ActiveCallHeader = ({
  onLeave,
  selectedLayout,
  onMenuItemClick,
}: { onLeave: () => void } & LayoutSelectorProps) => {
  const { useCallCallingState, useCallSession } = useCallStateHooks();
  const callingState = useCallCallingState();
  const session = useCallSession();
  const isOffline = callingState === CallingState.OFFLINE;
  const isMigrating = callingState === CallingState.MIGRATING;
  const isJoining = callingState === CallingState.JOINING;
  const isReconnecting = callingState === CallingState.RECONNECTING;
  const hasFailedToRecover = callingState === CallingState.RECONNECTING_FAILED;

  const { t } = useI18n();

  const isDemo = useIsDemoEnvironment();

  return (
    <>
      <div className="rd__call-header rd__call-header--active">
        <div className="rd__call-header__title">
          <CallHeaderTitle
            title={isDemo ? t('Stream Video Calling') : undefined}
          />

          <ToggleDocumentationButton />
        </div>

        <div className="rd__call-header__settings">
          <ToggleSettingsTabModal
            layoutProps={{
              selectedLayout: selectedLayout,
              onMenuItemClick: onMenuItemClick,
            }}
            tabModalProps={{
              inMeeting: true,
            }}
          />
        </div>

        <div className="rd__call-header__controls-group">
          <Elapsed startedAt={session?.started_at} />
          <LatencyIndicator />
        </div>
        <div className="rd__call-header__leave">
          <CancelCallConfirmButton onLeave={onLeave} />
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
