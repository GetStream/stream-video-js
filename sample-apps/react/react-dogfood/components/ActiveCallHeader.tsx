import { useEffect, useMemo, useState } from 'react';
import {
  AudioHealthDirection,
  AudioHealthReason,
  AudioHealthStatus,
  CallingState,
  CancelCallConfirmButton,
  humanize,
  Icon,
  LoadingIndicator,
  Notification,
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';

import { CallHeaderTitle } from './CallHeaderTitle';
import { ToggleSettingsTabModal } from './Settings/SettingsTabModal';
import { ToggleDocumentationButton } from './ToggleDocumentationButton';
import { LayoutSelectorProps } from './LayoutSelector';
import { useIsDemoEnvironment } from '../context/AppEnvironmentContext';
import { useIsDebugMode } from './Debug/useIsDebugMode';

const LatencyIndicator = () => {
  const { useCallStatsReport } = useCallStateHooks();
  const statsReport = useCallStatsReport();
  const latency = statsReport?.publisherStats?.averageRoundTripTimeInMs ?? 0;

  return (
    <div className="rd__header__latency">
      <div
        className={clsx('rd__header__latency-indicator', {
          'rd__header__latency-indicator--good': latency && latency <= 100,
          'rd__header__latency-indicator--ok':
            latency && latency > 100 && latency < 400,
          'rd__header__latency-indicator--bad': latency && latency > 400,
        })}
      ></div>
      {latency} ms
    </div>
  );
};

const Elapsed = ({ startedAt }: { startedAt: string | undefined }) => {
  const [elapsed, setElapsed] = useState<string>();
  const startedAtDate = useMemo(
    // eslint-disable-next-line react-hooks/purity
    () => (startedAt ? new Date(startedAt).getTime() : Date.now()),
    [startedAt],
  );
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startedAtDate) / 1000;
      const date = new Date(0);
      date.setSeconds(elapsedSeconds);
      const format = date.toISOString(); // '1970-01-01T00:00:35.000Z'
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

const AUDIO_HEALTH_MESSAGE: Partial<Record<AudioHealthReason, string>> = {
  'host-audio-session-interrupted': 'Audio session interrupted by the host.',
  'audio-session-interrupted': 'Audio session interrupted.',
  'audio-context-interrupted': 'Audio context interrupted.',
  'autoplay-blocked':
    'Audio autoplay is blocked. Tap anywhere to enable sound.',
  'remote-tracks-muted': 'Remote audio tracks are muted.',
  'element-paused': 'Audio playback is paused.',
};

const AudioHealthIndicator = () => {
  const { useAudioHealth } = useCallStateHooks();
  const { status, reason, direction } = useAudioHealth();
  const isDebug = useIsDebugMode();
  useEffect(() => {
    console.info('[dogfood] audioHealth →', status, reason, `dir=${direction}`);
  }, [status, reason, direction]);

  const isUnhealthy = status === 'unhealthy';
  const message = AUDIO_HEALTH_MESSAGE[reason] ?? `Audio issue (${reason}).`;

  if (isDebug) {
    return (
      <AudioHealthDebugBadge
        status={status}
        direction={direction}
        reason={reason}
      />
    );
  }

  return (
    <Notification
      isVisible={isUnhealthy}
      message={message}
      placement="bottom"
      iconClassName={null}
    >
      <div
        className={clsx('rd__header__audio-health', {
          'rd__header__audio-health--hidden': !isUnhealthy,
        })}
        aria-live="polite"
        aria-hidden={!isUnhealthy}
        data-testid="audio-health-badge"
      >
        <Icon icon="no-audio" />
      </div>
    </Notification>
  );
};

// Resolves the per-direction status for one side of the audio pipeline.
// Healthy/unknown propagate to both sides; an unhealthy status only flips
// a side red when the failure's `direction` actually implicates that side.
const resolveSideStatus = (
  status: AudioHealthStatus,
  direction: AudioHealthDirection,
  side: 'capture' | 'playback',
): AudioHealthStatus => {
  if (status !== 'unhealthy') return status;
  if (direction === 'both') return 'unhealthy';
  return direction === side ? 'unhealthy' : 'healthy';
};

const AudioHealthDebugBadge = ({
  status,
  direction,
  reason,
}: {
  status: AudioHealthStatus;
  direction: AudioHealthDirection;
  reason: AudioHealthReason;
}) => {
  const micStatus = resolveSideStatus(status, direction, 'capture');
  const speakerStatus = resolveSideStatus(status, direction, 'playback');

  return (
    <div
      className="rd__header__audio-health rd__header__audio-health--debug"
      aria-live="polite"
      data-testid="audio-health-badge"
    >
      <SideIndicator label="mic" status={micStatus} />
      <SideIndicator label="spk" status={speakerStatus} />
      <span className="rd__header__audio-health__reason">({reason})</span>
    </div>
  );
};

const SideIndicator = ({
  label,
  status,
}: {
  label: string;
  status: AudioHealthStatus;
}) => (
  <span className="rd__header__audio-health__side">
    {label}
    <span
      className={clsx(
        'rd__header__audio-health__dot',
        `rd__header__audio-health__dot--${status}`,
      )}
    />
  </span>
);

// Two manual triage buttons used to verify candidate fixes for audio
// recovery issues (e.g. post-CallKit-interruption playback resume on iOS
// WKWebView). Both run inside a real React-dispatched click so any
// gesture-gated browser API gets the gesture credit it needs.
const AudioRecoveryButtons = () => {
  const call = useCall();

  const handleResumeAudio = () => {
    console.info('[dogfood] resumeMedia() (manual click)');
    call?.resumeMedia().catch((err) => {
      console.error('[dogfood] resumeMedia failed', err);
    });
  };

  const handleSetAudioSessionType = () => {
    if (typeof navigator === 'undefined') return;
    const audioSession = (
      navigator as Navigator & { audioSession?: { type: string } }
    ).audioSession;
    if (!audioSession) {
      console.warn('[dogfood] navigator.audioSession unavailable');
      return;
    }
    try {
      audioSession.type = 'play-and-record';
      console.info(
        '[dogfood] navigator.audioSession.type =',
        audioSession.type,
      );
    } catch (err) {
      console.error('[dogfood] audioSession.type write failed', err);
    }
  };

  return (
    <div
      className="rd__header__audio-recovery"
      data-testid="audio-recovery-actions"
    >
      <button
        type="button"
        className="rd__header__audio-recovery__button"
        onClick={handleResumeAudio}
      >
        Resume audio
      </button>
      <button
        type="button"
        className="rd__header__audio-recovery__button"
        onClick={handleSetAudioSessionType}
      >
        audioSession=play-and-record
      </button>
    </div>
  );
};

const RecordingIndicator = () => {
  return <div className="rd__header__recording-indicator">Recording...</div>;
};

const ParticipantCountIndicator = () => {
  const { useParticipants, useParticipantCount } = useCallStateHooks();
  const participants = useParticipants();
  const participantCount = useParticipantCount();
  const count = Math.max(participantCount, participants.length);
  return (
    <div className="rd__header__participant-count" title={`Total: ${count}`}>
      <Icon icon="participants" />
      {humanize(count)}
    </div>
  );
};

export const ActiveCallHeader = ({
  onLeave,
  selectedLayout,
  onMenuItemClick,
}: { onLeave: () => void } & LayoutSelectorProps) => {
  const {
    useCallCallingState,
    useCallSession,
    useIsCallRecordingInProgress,
    useIsCallRawRecordingInProgress,
    useIsCallIndividualRecordingInProgress,
  } = useCallStateHooks();
  const isRecordingInProgress = useIsCallRecordingInProgress();
  const isRawRecordingInProgress = useIsCallRawRecordingInProgress();
  const isIndividualRecordingInProgress =
    useIsCallIndividualRecordingInProgress();
  const callingState = useCallCallingState();
  const session = useCallSession();
  const isOffline = callingState === CallingState.OFFLINE;
  const isMigrating = callingState === CallingState.MIGRATING;
  const isJoining = callingState === CallingState.JOINING;
  const isReconnecting = callingState === CallingState.RECONNECTING;
  const hasFailedToRecover = callingState === CallingState.RECONNECTING_FAILED;

  const { t } = useI18n();

  const isDemo = useIsDemoEnvironment();
  const isDebug = useIsDebugMode();

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
            tabModalProps={{ inMeeting: true }}
          />
        </div>

        <div className="rd__call-header__controls-group">
          <AudioHealthIndicator />
          {isDebug && <AudioRecoveryButtons />}
          {(isRecordingInProgress ||
            isRawRecordingInProgress ||
            isIndividualRecordingInProgress) && <RecordingIndicator />}
          <ParticipantCountIndicator />
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
