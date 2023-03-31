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

  const lastSessionId = useRef<string>(sessionId);
  const lastDimensionRef = useRef<SfuModels.VideoDimension | undefined>();
  const updateSubscription = useCallback(() => {
    let nextDimension;
    if (
      videoElement &&
      isPublishingTrack &&
      participant.viewportVisibilityState !== VisibilityState.INVISIBLE
    ) {
      nextDimension = {
        width: videoElement.clientWidth,
        height: videoElement.clientHeight,
      };
    }

    const lastDimension = lastDimensionRef.current;
    if (
      sessionId !== lastSessionId.current ||
      nextDimension?.width !== lastDimension?.width ||
      nextDimension?.height !== lastDimension?.height
    ) {
      call.updateSubscriptionsPartial(kind, {
        [sessionId]: {
          dimension: nextDimension,
        },
      });
      lastDimensionRef.current = nextDimension;
      lastSessionId.current = sessionId;
    }
  }, [
    call,
    isPublishingTrack,
    kind,
    sessionId,
    videoElement,
    participant.viewportVisibilityState,
  ]);

  useEffect(() => {
    updateSubscription();
  }, [updateSubscription]);

  // cleanup subscription on unmount
  // useEffect(() => {
  //   if (call && sessionId && kind)
  //     return () => {
  //       call.updateSubscriptionsPartial(kind, {
  //         [sessionId]: {
  //           dimension: undefined,
  //         },
  //       });
  //     };
  // }, [call, kind, sessionId]);

  useEffect(() => {
    if (!videoElement) return;

    const resizeObserver = new ResizeObserver(updateSubscription);
    resizeObserver.observe(videoElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateSubscription, videoElement]);

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

  if (
    !isPublishingTrack ||
    (participant.viewportVisibilityState === VisibilityState.INVISIBLE &&
      !screenShareStream)
  )
    return (
      <VideoPlaceholder
        imageSrc={participant.image}
        name={participant.name || participant.userId}
        isSpeaking={participant.isSpeaking}
        ref={setVideoElementRef}
      />
    );

  return (
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
  );
};
