import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import {
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import { ParticipantView, useParticipantViewContext } from '../ParticipantView';
import { ParticipantsAudio } from '../Audio';
import { usePaginatedLayoutSortPreset } from './hooks';

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
   * The props to pass to the floating participant element.
   */
  floatingParticipantProps?: LivestreamLayoutProps & {
    /**
     * The position of the floating participant element. Defaults to `top-right`.
     */
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
};

export const LivestreamLayout = (props: LivestreamLayoutProps) => {
  const { useParticipants, useRemoteParticipants, useHasOngoingScreenShare } =
    useCallStateHooks();
  const call = useCall();
  const [currentSpeaker, ...otherParticipants] = useParticipants();
  const remoteParticipants = useRemoteParticipants();
  const hasOngoingScreenShare = useHasOngoingScreenShare();
  const presenter = hasOngoingScreenShare
    ? hasScreenShare(currentSpeaker) && currentSpeaker
    : otherParticipants.find(hasScreenShare);

  usePaginatedLayoutSortPreset(call);

  const Overlay = (
    <ParticipantOverlay
      showParticipantCount={props.showParticipantCount}
      showDuration={props.showDuration}
      showLiveBadge={props.showLiveBadge}
      showSpeakerName={props.showSpeakerName}
    />
  );

  const { floatingParticipantProps } = props;
  const FloatingParticipantOverlay = hasOngoingScreenShare && (
    <ParticipantOverlay
      // these elements aren't needed for the video feed
      showParticipantCount={
        floatingParticipantProps?.showParticipantCount ?? false
      }
      showDuration={floatingParticipantProps?.showDuration ?? false}
      showLiveBadge={floatingParticipantProps?.showLiveBadge ?? false}
      showSpeakerName={floatingParticipantProps?.showSpeakerName ?? true}
    />
  );

  return (
    <div className="str-video__livestream-layout__wrapper">
      <ParticipantsAudio participants={remoteParticipants} />
      {hasOngoingScreenShare && presenter && (
        <ParticipantView
          className="str-video__livestream-layout__screen-share"
          participant={presenter}
          ParticipantViewUI={Overlay}
          trackType="screenShareTrack"
          muteAudio // audio is rendered by ParticipantsAudio
        />
      )}
      {currentSpeaker && (
        <ParticipantView
          className={clsx(
            hasOngoingScreenShare &&
              'str-video__livestream-layout__floating-participant',
            (hasOngoingScreenShare &&
              `str-video__livestream-layout__floating-participant--${floatingParticipantProps?.position ?? 'top-right'}`),
          )}
          participant={currentSpeaker}
          ParticipantViewUI={FloatingParticipantOverlay || Overlay}
          muteAudio // audio is rendered by ParticipantsAudio
        />
      )}
    </div>
  );
};

const hasScreenShare = (p?: StreamVideoParticipant) =>
  !!p?.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE);

const ParticipantOverlay = (props: {
  enableFullScreen?: boolean;
  showParticipantCount?: boolean;
  showDuration?: boolean;
  showLiveBadge?: boolean;
  showSpeakerName?: boolean;
}) => {
  const {
    enableFullScreen = true,
    showParticipantCount = true,
    showDuration = true,
    showLiveBadge = true,
    showSpeakerName = false,
  } = props;
  const { participant } = useParticipantViewContext();
  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();
  const duration = useUpdateCallDuration();
  const toggleFullScreen = useToggleFullScreen();
  const { t } = useI18n();
  return (
    <div className="str-video__livestream-layout__overlay">
      <div className="str-video__livestream-layout__overlay__bar">
        {showLiveBadge && (
          <span className="str-video__livestream-layout__live-badge">
            {t('Live')}
          </span>
        )}
        {showParticipantCount && (
          <span className="str-video__livestream-layout__viewers-count">
            {participantCount}
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
        {enableFullScreen && (
          <span
            className="str-video__livestream-layout__go-fullscreen"
            onClick={toggleFullScreen}
          />
        )}
      </div>
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  return useCallback(() => {
    if (isFullscreen) {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    } else {
      participantViewElement?.requestFullscreen().then(() => {
        setIsFullscreen(true);
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
