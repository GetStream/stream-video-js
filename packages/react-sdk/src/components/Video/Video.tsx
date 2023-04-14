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

  const stream = kind === 'video' ? videoStream : screenShareStream;
  const isPublishingTrack = publishedTracks.includes(
    kind === 'video'
      ? SfuModels.TrackType.VIDEO
      : SfuModels.TrackType.SCREEN_SHARE,
  );

  const displayPlaceholder =
    !isPublishingTrack ||
    (participant.viewportVisibilityState === VisibilityState.INVISIBLE &&
      !screenShareStream);

  const lastDimensionRef = useRef<string | undefined>();
  const updateSubscription = useCallback(
    (type: DebounceType, dimension?: SfuModels.VideoDimension) => {
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

    updateSubscription(DebounceType.FAST, {
      height: videoElement.clientHeight,
      width: videoElement.clientWidth,
    });

    return () => {
      updateSubscription(DebounceType.FAST);
    };
  }, [updateSubscription, videoElement, isPublishingTrack]);

  // handle visibility subscription updates
  useEffect(() => {
    const isUnknownVVS =
      participant.viewportVisibilityState === VisibilityState.UNKNOWN;
    if (!videoElement || !isPublishingTrack || isUnknownVVS) return;

    const isInvisibleVVS =
      participant.viewportVisibilityState === VisibilityState.INVISIBLE;

    updateSubscription(
      DebounceType.MEDIUM,
      isInvisibleVVS
        ? undefined
        : {
            height: videoElement.clientHeight,
            width: videoElement.clientWidth,
          },
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
      const currentDimensions = `${videoElement.clientWidth}:${videoElement.clientHeight}`;

      // skip initial trigger of the observer
      if (!lastDimensionRef.current) {
        return (lastDimensionRef.current = currentDimensions);
      }

      if (
        lastDimensionRef.current === currentDimensions ||
        // "display: none" causes dimensions to change to 0
        participant.viewportVisibilityState === VisibilityState.INVISIBLE
      )
        return;

      updateSubscription(DebounceType.SLOW, {
        height: videoElement.clientHeight,
        width: videoElement.clientWidth,
      });
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
    const calculateVideoRatio = () => {
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
      <VideoPlaceholder
        style={
          displayPlaceholder
            ? undefined
            : {
                display: 'none',
              }
        }
        participant={participant}
        ref={setVideoElementRef}
      />
      <BaseVideo
        {...rest}
        style={
          displayPlaceholder
            ? {
                display: 'none',
              }
            : undefined
        }
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
    </>
  );
};
