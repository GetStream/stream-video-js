import {
  DetailedHTMLProps,
  useCallback,
  useEffect,
  useRef,
  useState,
  VideoHTMLAttributes,
} from 'react';
import {
  Browsers,
  Call,
  SfuModels,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import clsx from 'clsx';
import { VideoPlaceholder } from './VideoPlaceholder';

export type VideoProps = DetailedHTMLProps<
  VideoHTMLAttributes<HTMLVideoElement>,
  HTMLVideoElement
> & {
  call: Call;
  kind: 'video' | 'screen';
  participant: StreamVideoParticipant;
  setVideoElementRef?: (element: HTMLVideoElement | null) => void;
};

export const Video = (props: VideoProps) => {
  const { call, kind, participant, className, setVideoElementRef, ...rest } =
    props;
  const { sessionId, videoStream, screenShareStream, publishedTracks } =
    participant;

  const stream = kind === 'video' ? videoStream : screenShareStream;
  const isPublishingTrack = publishedTracks.includes(
    kind === 'video'
      ? SfuModels.TrackType.VIDEO
      : SfuModels.TrackType.SCREEN_SHARE,
  );

  const videoRef = useRef<HTMLVideoElement | null>();
  useEffect(() => {
    const $el = videoRef.current;
    if (!$el) return;
    if (stream && stream !== $el.srcObject && isPublishingTrack) {
      $el.srcObject = stream;
      if (Browsers.isSafari() || Browsers.isFirefox()) {
        // Firefox and Safari have some timing issue
        setTimeout(() => {
          $el.srcObject = stream;
          $el.play().catch((e) => {
            console.error(`Failed to play stream`, e);
          });
        }, 0);
      }
    }
    return () => {
      $el.srcObject = null;
    };
  }, [stream, isPublishingTrack]);

  const lastDimensionRef = useRef<SfuModels.VideoDimension | undefined>();
  const updateSubscription = useCallback(() => {
    let nextDimension;
    const $el = videoRef.current;
    if ($el && isPublishingTrack) {
      nextDimension = {
        width: $el.clientWidth,
        height: $el.clientHeight,
      };
    }

    const lastDimension = lastDimensionRef.current;
    if (
      nextDimension?.width !== lastDimension?.width ||
      nextDimension?.height !== lastDimension?.height
    ) {
      call.updateSubscriptionsPartial(kind, {
        [sessionId]: {
          dimension: nextDimension,
        },
      });
      lastDimensionRef.current = nextDimension;
    }
  }, [call, isPublishingTrack, kind, sessionId]);

  useEffect(() => {
    updateSubscription();
  }, [updateSubscription]);

  useEffect(() => {
    const $videoEl = videoRef.current;
    if (!$videoEl) return;
    const resizeObserver = new ResizeObserver(() => {
      updateSubscription();
    });
    resizeObserver.observe($videoEl);
    return () => {
      resizeObserver.disconnect();
    };
  }, [updateSubscription]);

  const [isWideMode, setIsWideMode] = useState(true);
  useEffect(() => {
    if (!stream) return;
    const calculateVideoRatio = () => {
      const [track] = stream.getVideoTracks();
      if (!track) return;

      const { width = 0, height = 0 } = track.getSettings();
      setIsWideMode(width > height);
    };
    const $videoEl = videoRef.current;
    $videoEl?.addEventListener('play', calculateVideoRatio);
    return () => {
      $videoEl?.removeEventListener('play', calculateVideoRatio);
    };
  }, [stream]);

  if (!isPublishingTrack)
    return (
      <VideoPlaceholder
        imageSrc={participant.user?.image}
        userId={participant.userId}
        isSpeaking={participant.isSpeaking}
      />
    );

  return (
    <video
      autoPlay
      playsInline
      {...rest}
      className={clsx(className, {
        'str_video__video--wide': isWideMode,
        'str_video__video--tall': !isWideMode,
      })}
      data-user-id={participant.userId}
      data-session-id={sessionId}
      ref={(ref) => {
        videoRef.current = ref;
        setVideoElementRef?.(ref);
      }}
    />
  );
};
