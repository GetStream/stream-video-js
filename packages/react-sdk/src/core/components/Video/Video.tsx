import {
  ComponentPropsWithoutRef,
  ComponentType,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  DebounceType,
  SfuModels,
  StreamVideoParticipant,
  VisibilityState,
} from '@stream-io/video-client';
import clsx from 'clsx';
import {
  DefaultVideoPlaceholder,
  VideoPlaceholderProps,
} from './DefaultVideoPlaceholder';
import { BaseVideo } from './BaseVideo';
import { useCall } from '@stream-io/video-react-bindings';

export type VideoProps = ComponentPropsWithoutRef<'video'> & {
  kind: 'video' | 'screen';
  participant: StreamVideoParticipant;
  /**
   * Override the default UI that's visible when a participant turned off their video.
   */
  VideoPlaceholder?: ComponentType<VideoPlaceholderProps>;
  refs?: {
    setVideoElement?: (element: HTMLVideoElement | null) => void;
    setVideoPlaceholderElement?: (element: HTMLDivElement | null) => void;
  };
};

export const Video = ({
  kind,
  participant,
  className,
  VideoPlaceholder = DefaultVideoPlaceholder,
  refs,
  ...rest
}: VideoProps) => {
  const {
    sessionId,
    videoStream,
    screenShareStream,
    publishedTracks,
    viewportVisibilityState,
    isLoggedInUser,
    userId,
  } = participant;

  const call = useCall();

  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null,
  );

  // const [videoTrackMuted, setVideoTrackMuted] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const viewportVisibilityRef = useRef<VisibilityState | undefined>(
    viewportVisibilityState,
  );

  const stream = kind === 'video' ? videoStream : screenShareStream;

  // TODO: handle track muting
  // useEffect(() => {
  //   if (!stream) return;

  //   const [track] = stream.getVideoTracks();
  //   setVideoTrackMuted(track.muted);

  //   const handleMute = () => {
  //     setVideoTrackMuted(true);
  //   };
  //   const handleUnmute = () => {
  //     setVideoTrackMuted(false);
  //   };

  //   track.addEventListener('mute', handleMute);
  //   track.addEventListener('unmute', handleUnmute);

  //   return () => {
  //     track.removeEventListener('mute', handleMute);
  //     track.removeEventListener('unmute', handleUnmute);
  //   };
  // }, [stream]);

  const isPublishingTrack = publishedTracks.includes(
    kind === 'video'
      ? SfuModels.TrackType.VIDEO
      : SfuModels.TrackType.SCREEN_SHARE,
  );

  const displayPlaceholder =
    !isPublishingTrack ||
    (viewportVisibilityState === VisibilityState.INVISIBLE &&
      !screenShareStream) ||
    !videoPlaying;

  const lastDimensionRef = useRef<string | undefined>();
  const updateSubscription = useCallback(
    (
      dimension?: SfuModels.VideoDimension,
      type: DebounceType = DebounceType.SLOW,
    ) => {
      if (!call) return;

      call.updateSubscriptionsPartial(
        kind,
        {
          [sessionId]: {
            dimension,
          },
        },
        type,
      );
    },
    [call, kind, sessionId],
  );

  // handle visibility subscription updates
  useEffect(() => {
    viewportVisibilityRef.current = viewportVisibilityState;

    if (!videoElement || !isPublishingTrack || isLoggedInUser) return;

    const isInvisibleVVS =
      viewportVisibilityState === VisibilityState.INVISIBLE;

    updateSubscription(
      isInvisibleVVS
        ? undefined
        : {
            height: videoElement.clientHeight,
            width: videoElement.clientWidth,
          },
      DebounceType.MEDIUM,
    );
  }, [
    updateSubscription,
    viewportVisibilityState,
    videoElement,
    isPublishingTrack,
    isLoggedInUser,
  ]);

  // handle resize subscription updates
  useEffect(() => {
    if (!videoElement || !isPublishingTrack || isLoggedInUser) return;

    const resizeObserver = new ResizeObserver(() => {
      const currentDimensions = `${videoElement.clientWidth},${videoElement.clientHeight}`;

      // skip initial trigger of the observer
      if (!lastDimensionRef.current) {
        return (lastDimensionRef.current = currentDimensions);
      }

      if (
        lastDimensionRef.current === currentDimensions ||
        viewportVisibilityRef.current === VisibilityState.INVISIBLE
      )
        return;

      updateSubscription(
        {
          height: videoElement.clientHeight,
          width: videoElement.clientWidth,
        },
        DebounceType.SLOW,
      );
      lastDimensionRef.current = currentDimensions;
    });
    resizeObserver.observe(videoElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [
    updateSubscription,
    videoElement,
    viewportVisibilityState,
    isPublishingTrack,
    isLoggedInUser,
  ]);

  // handle generic subscription updates
  useEffect(() => {
    if (!isPublishingTrack || !videoElement || isLoggedInUser) return;

    updateSubscription(
      {
        height: videoElement.clientHeight,
        width: videoElement.clientWidth,
      },
      DebounceType.FAST,
    );

    return () => {
      updateSubscription(undefined, DebounceType.FAST);
    };
  }, [updateSubscription, videoElement, isPublishingTrack, isLoggedInUser]);

  const [isWideMode, setIsWideMode] = useState(true);
  useEffect(() => {
    if (!stream || !videoElement) return;

    setVideoPlaying(!videoElement.paused);

    const calculateVideoRatio = () => {
      setVideoPlaying(true);
      const [track] = stream.getVideoTracks();
      if (!track) return;

      const { width = 0, height = 0 } = track.getSettings();
      setIsWideMode(width > height);
    };
    videoElement.addEventListener('play', calculateVideoRatio);
    return () => {
      videoElement.removeEventListener('play', calculateVideoRatio);
    };
  }, [stream, videoElement]);

  if (!call) return null;

  return (
    <>
      <BaseVideo
        {...rest}
        stream={stream}
        className={clsx(className, 'str-video__video', {
          'str-video__video--tall': !isWideMode,
          'str-video__video--mirror': isLoggedInUser && kind === 'video',
          'str-video__video--screen-share': kind === 'screen',
        })}
        data-user-id={userId}
        data-session-id={sessionId}
        ref={(element) => {
          setVideoElement(element);
          refs?.setVideoElement?.(element);
        }}
      />
      {displayPlaceholder && (
        <VideoPlaceholder
          style={{ position: 'absolute' }}
          participant={participant}
          ref={refs?.setVideoPlaceholderElement}
        />
      )}
    </>
  );
};
