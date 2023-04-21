import {
  DetailedHTMLProps,
  useCallback,
  useEffect,
  useRef,
  useState,
  VideoHTMLAttributes,
} from 'react';
import {
  Call,
  DebounceType,
  SfuModels,
  StreamVideoParticipant,
  VisibilityState,
} from '@stream-io/video-client';
import clsx from 'clsx';
import { VideoPlaceholder } from './VideoPlaceholder';
import { BaseVideo } from './BaseVideo';

export const Video = (
  props: DetailedHTMLProps<
    VideoHTMLAttributes<HTMLVideoElement>,
    HTMLVideoElement
  > & {
    call: Call;
    kind: 'video' | 'screen';
    participant: StreamVideoParticipant;
    setVideoElementRef?: (element: HTMLElement | null) => void;
  },
) => {
  const { call, kind, participant, className, setVideoElementRef, ...rest } =
    props;
  const { sessionId, videoStream, screenShareStream, publishedTracks } =
    participant;

  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null,
  );
  // const [videoTrackMuted, setVideoTrackMuted] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const viewportVisibilityRef = useRef<VisibilityState | undefined>(
    participant.viewportVisibilityState,
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
    (participant.viewportVisibilityState === VisibilityState.INVISIBLE &&
      !screenShareStream) ||
    !videoPlaying;

  const lastDimensionRef = useRef<string | undefined>();
  const updateSubscription = useCallback(
    (
      dimension?: SfuModels.VideoDimension,
      type: DebounceType = DebounceType.SLOW,
    ) => {
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

  // handle generic subscription updates
  useEffect(() => {
    if (!isPublishingTrack || !videoElement) return;

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
  }, [updateSubscription, videoElement, isPublishingTrack]);

  // handle visibility subscription updates
  useEffect(() => {
    viewportVisibilityRef.current = participant.viewportVisibilityState;

    const isUnknownVVS =
      participant.viewportVisibilityState === VisibilityState.UNKNOWN;
    if (!videoElement || !isPublishingTrack || isUnknownVVS) return;

    const isInvisibleVVS =
      participant.viewportVisibilityState === VisibilityState.INVISIBLE;

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
    participant.viewportVisibilityState,
    videoElement,
    isPublishingTrack,
  ]);

  // handle resize subscription updates
  useEffect(() => {
    if (!videoElement || !isPublishingTrack) return;

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
    participant.viewportVisibilityState,
    isPublishingTrack,
  ]);

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

  return (
    <>
      <BaseVideo
        {...rest}
        stream={stream}
        className={clsx(className, {
          'str-video__video--wide': isWideMode,
          'str-video__video--tall': !isWideMode,
        })}
        data-user-id={participant.userId}
        data-session-id={sessionId}
        ref={(ref) => {
          setVideoElement(ref);
          setVideoElementRef?.(ref);
        }}
      />
      {displayPlaceholder && (
        <VideoPlaceholder
          style={{ position: 'absolute' }}
          participant={participant}
          ref={setVideoElementRef}
        />
      )}
    </>
  );
};
