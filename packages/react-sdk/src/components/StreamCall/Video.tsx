import {
  DetailedHTMLProps,
  useCallback,
  useEffect,
  useRef,
  VideoHTMLAttributes,
} from 'react';
import {
  Browsers,
  Call,
  SfuModels,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { VideoPlaceholder } from './VideoPlaceholder';

export const Video = (
  props: DetailedHTMLProps<
    VideoHTMLAttributes<HTMLVideoElement>,
    HTMLVideoElement
  > & {
    call: Call;
    kind: 'video' | 'screen';
    participant: StreamVideoParticipant;
  },
) => {
  const { call, kind, participant, ...rest } = props;
  const { sessionId, videoStream, screenShareStream, publishedTracks } =
    participant;

  const stream = kind === 'video' ? videoStream : screenShareStream;
  const isPublishingTrack = publishedTracks.includes(
    kind === 'video'
      ? SfuModels.TrackType.VIDEO
      : SfuModels.TrackType.SCREEN_SHARE,
  );

  const videoRef = useRef<HTMLVideoElement>(null);
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
      data-user-id={participant.userId}
      data-session-id={sessionId}
      ref={videoRef}
    />
  );
};
