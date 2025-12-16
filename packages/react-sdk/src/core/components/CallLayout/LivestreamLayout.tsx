import clsx from 'clsx';
import {
  ComponentType,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import { hasScreenShare, humanize } from '@stream-io/video-client';
import { ParticipantView, useParticipantViewContext } from '../ParticipantView';
import { ParticipantsAudio } from '../Audio';
import {
  usePaginatedLayoutSortPreset,
  useRawRemoteParticipants,
} from './hooks';

/**
 * The props for the {@link LivestreamLayout} component.
 */
export type LivestreamLayoutProps = {
  /**
   * Whether the livestream is muted. Defaults to `false`.
   */
  muted?: boolean;

  /**
   * Whether to show the participant count. Defaults to `true`.
   */
  showParticipantCount?: boolean;

  /**
   * Whether to humanize the participant count. Defaults to `true`.
   * @example
   * 1000 participants -> 1k
   * 1500 participants -> 1.5k
   * 10_000 participants -> 10k
   * 100_000 participants -> 100k
   */
  humanizeParticipantCount?: boolean;

  /**
   * Whether to enable fullscreen mode. Defaults to `true`.
   */
  enableFullScreen?: boolean;

  /**
   * Whether to show the duration of the call. Defaults to `true`.
   */
  showDuration?: boolean;

  /**
   * Whether to show the live badge. Defaults to `true`.
   */
  showLiveBadge?: boolean;

  /**
   * Whether to show the speaker name. Defaults to `false`.
   */
  showSpeakerName?: boolean;

  /**
   * Whether to show the mute button. Defaults to `true`.
   */
  showMuteButton?: boolean;

  /**
   * When set to `false` disables mirroring of the local participant's video.
   * @default true
   */
  mirrorLocalParticipantVideo?: boolean;

  /**
   * The props to pass to the floating participant element.
   */
  floatingParticipantProps?: LivestreamLayoutProps & {
    /**
     * The position of the floating participant element. Defaults to `top-right`.
     */
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };

  /**
   * Override the default participant view overlay UI.
   */
  ParticipantViewUI?: ComponentType | ReactElement | null;
};

export const LivestreamLayout = (props: LivestreamLayoutProps) => {
  const { useParticipants, useHasOngoingScreenShare } = useCallStateHooks();
  const call = useCall();
  const participants = useParticipants();
  const [currentSpeaker] = participants;
  const remoteParticipants = useRawRemoteParticipants();
  const hasOngoingScreenShare = useHasOngoingScreenShare();
  const presenter = hasOngoingScreenShare
    ? participants.find(hasScreenShare)
    : undefined;

  usePaginatedLayoutSortPreset(call);

  const { floatingParticipantProps, muted, ParticipantViewUI } = props;
  const overlay = ParticipantViewUI ?? (
    <ParticipantOverlay
      showParticipantCount={props.showParticipantCount}
      showDuration={props.showDuration}
      showLiveBadge={props.showLiveBadge}
      showMuteButton={props.showMuteButton}
      showSpeakerName={props.showSpeakerName}
      enableFullScreen={props.enableFullScreen}
    />
  );

  const floatingParticipantOverlay =
    hasOngoingScreenShare &&
    (ParticipantViewUI ?? (
      <ParticipantOverlay
        // these elements aren't needed for the video feed
        showParticipantCount={
          floatingParticipantProps?.showParticipantCount ?? false
        }
        showDuration={floatingParticipantProps?.showDuration ?? false}
        showLiveBadge={floatingParticipantProps?.showLiveBadge ?? false}
        showSpeakerName={floatingParticipantProps?.showSpeakerName ?? true}
        enableFullScreen={floatingParticipantProps?.enableFullScreen ?? true}
      />
    ));

  return (
    <div className="str-video__livestream-layout__wrapper">
      {!muted && <ParticipantsAudio participants={remoteParticipants} />}
      {hasOngoingScreenShare && presenter && (
        <ParticipantView
          className="str-video__livestream-layout__screen-share"
          participant={presenter}
          ParticipantViewUI={overlay}
          trackType="screenShareTrack"
          muteAudio // audio is rendered by ParticipantsAudio
        />
      )}
      {currentSpeaker && (
        <ParticipantView
          className={clsx(
            hasOngoingScreenShare &&
              clsx(
                'str-video__livestream-layout__floating-participant',
                `str-video__livestream-layout__floating-participant--${
                  floatingParticipantProps?.position ?? 'top-right'
                }`,
              ),
          )}
          participant={currentSpeaker}
          ParticipantViewUI={floatingParticipantOverlay || overlay}
          mirror={
            props.mirrorLocalParticipantVideo !== false ? undefined : false
          }
          muteAudio // audio is rendered by ParticipantsAudio
        />
      )}
    </div>
  );
};

LivestreamLayout.displayName = 'LivestreamLayout';

/**
 * The props for the {@link LivestreamLayout} component.
 */
export type BackstageLayoutProps = {
  /**
   * Whether to show the counter for participants that joined before
   * the livestream went live. Defaults to `true`.
   */
  showEarlyParticipantCount?: boolean;

  /**
   * Show the participant count in a humanized format. Defaults to `true`.
   * @example
   * 1000 participants -> 1k
   * 1500 participants -> 1.5k
   * 10_000 participants -> 10k
   * 10_0000 participants -> 100k
   */
  humanizeParticipantCount?: boolean;
};

export const BackstageLayout = (props: BackstageLayoutProps) => {
  const { showEarlyParticipantCount = true, humanizeParticipantCount = true } =
    props;
  const { useParticipantCount, useCallStartsAt } = useCallStateHooks();
  const participantCount = useParticipantCount();
  const startsAt = useCallStartsAt();
  const { t } = useI18n();

  return (
    <div className="str-video__livestream-layout__wrapper">
      <div className="str-video__livestream-layout__backstage">
        {startsAt && (
          <span className="str-video__livestream-layout__starts-at">
            {startsAt.getTime() < Date.now()
              ? t('Livestream starts soon')
              : t('Livestream starts at {{ startsAt }}', { startsAt })}
          </span>
        )}
        {showEarlyParticipantCount && (
          <span className="str-video__livestream-layout__early-viewers-count">
            {t('{{ count }} participants joined early', {
              count: humanizeParticipantCount
                ? humanize(participantCount)
                : participantCount,
            })}
          </span>
        )}
      </div>
    </div>
  );
};

BackstageLayout.displayName = 'BackstageLayout';

const ParticipantOverlay = (props: {
  enableFullScreen?: boolean;
  showParticipantCount?: boolean;
  humanizeParticipantCount?: boolean;
  showDuration?: boolean;
  showLiveBadge?: boolean;
  showSpeakerName?: boolean;
  showMuteButton?: boolean;
}) => {
  const {
    enableFullScreen = true,
    showParticipantCount = true,
    humanizeParticipantCount = true,
    showDuration = true,
    showLiveBadge = true,
    showMuteButton = true,
    showSpeakerName = false,
  } = props;
  const overlayBarVisible =
    enableFullScreen ||
    showParticipantCount ||
    showDuration ||
    showLiveBadge ||
    showMuteButton ||
    showSpeakerName;
  const { participant } = useParticipantViewContext();
  const { useParticipantCount, useSpeakerState } = useCallStateHooks();
  const participantCount = useParticipantCount();
  const duration = useUpdateCallDuration();
  const toggleFullScreen = useToggleFullScreen();
  const { speaker, volume } = useSpeakerState();
  const isSpeakerMuted = volume === 0;
  const { t } = useI18n();
  return (
    <div className="str-video__livestream-layout__overlay">
      {overlayBarVisible && (
        <div className="str-video__livestream-layout__overlay__bar">
          {showLiveBadge && (
            <span className="str-video__livestream-layout__live-badge">
              {t('Live')}
            </span>
          )}
          {showParticipantCount && (
            <span className="str-video__livestream-layout__viewers-count">
              {humanizeParticipantCount
                ? humanize(participantCount)
                : participantCount}
            </span>
          )}
          {showSpeakerName && (
            <span
              className="str-video__livestream-layout__speaker-name"
              title={participant.name || participant.userId || ''}
            >
              {participant.name || participant.userId || ''}
            </span>
          )}
          {showDuration && (
            <span className="str-video__livestream-layout__duration">
              {formatDuration(duration)}
            </span>
          )}
          {showMuteButton && (
            <span
              className={clsx(
                'str-video__livestream-layout__mute-button',
                isSpeakerMuted &&
                  'str-video__livestream-layout__mute-button--muted',
              )}
              onClick={() => speaker.setVolume(isSpeakerMuted ? 1 : 0)}
            />
          )}
          {enableFullScreen && (
            <span
              className="str-video__livestream-layout__go-fullscreen"
              onClick={toggleFullScreen}
            />
          )}
        </div>
      )}
    </div>
  );
};

const useUpdateCallDuration = () => {
  const { useIsCallLive, useCallSession } = useCallStateHooks();
  const isCallLive = useIsCallLive();
  const session = useCallSession();
  const [duration, setDuration] = useState(() => {
    if (!session || !session.live_started_at) return 0;
    const liveStartTime = new Date(session.live_started_at);
    const now = new Date();
    return Math.floor((now.getTime() - liveStartTime.getTime()) / 1000);
  });

  useEffect(() => {
    if (!isCallLive) return;
    const interval = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [isCallLive]);

  return duration;
};

const useToggleFullScreen = () => {
  const { participantViewElement } = useParticipantViewContext();
  const [isFullscreen, setIsFullscreen] = useState(
    !!document.fullscreenElement,
  );
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
    };
  }, []);
  return useCallback(() => {
    if (isFullscreen) {
      document.exitFullscreen().catch((err) => {
        console.error('Failed to exit fullscreen', err);
      });
    } else {
      participantViewElement?.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen', err);
      });
    }
  }, [isFullscreen, participantViewElement]);
};

const formatDuration = (durationInMs: number) => {
  const days = Math.floor(durationInMs / 86400);
  const hours = Math.floor(durationInMs / 3600);
  const minutes = Math.floor((durationInMs % 3600) / 60);
  const seconds = durationInMs % 60;

  return `${days ? days + ' ' : ''}${hours ? hours + ':' : ''}${
    minutes < 10 ? '0' : ''
  }${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};
