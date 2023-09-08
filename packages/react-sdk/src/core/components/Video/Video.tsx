import {
  ComponentPropsWithoutRef,
  ComponentType,
  useEffect,
  useState,
} from 'react';
import {
  SfuModels,
  StreamVideoParticipant,
  VideoTrackType,
  VisibilityState,
} from '@stream-io/video-client';
import clsx from 'clsx';
import {
  DefaultVideoPlaceholder,
  VideoPlaceholderProps,
} from './DefaultVideoPlaceholder';
import { useCall } from '@stream-io/video-react-bindings';

export type VideoProps = ComponentPropsWithoutRef<'video'> & {
  /**
   * The track type to display.
   */
  trackType: VideoTrackType | 'none';
  /**
   * The participant represented by this video element.
   */
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
  trackType,
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
    isLocalParticipant,
    userId,
  } = participant;

  const call = useCall();
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null,
  );
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [isWideMode, setIsWideMode] = useState(true);

  const stream =
    trackType === 'none'
      ? undefined
      : trackType === 'videoTrack'
      ? videoStream
      : screenShareStream;

  const isPublishingTrack =
    trackType === 'none'
      ? false
      : publishedTracks.includes(
          trackType === 'videoTrack'
            ? SfuModels.TrackType.VIDEO
            : SfuModels.TrackType.SCREEN_SHARE,
        );

  const isInvisible =
    trackType === 'none' ||
    viewportVisibilityState?.[trackType] === VisibilityState.INVISIBLE;

  const displayPlaceholder = !isPublishingTrack || isInvisible || !videoPlaying;

  useEffect(() => {
    if (!call || !videoElement || trackType === 'none') return;

    const cleanup = call.bindVideoElement(videoElement, sessionId, trackType);

    return () => {
      cleanup?.();
    };
  }, [call, trackType, sessionId, videoElement]);

  useEffect(() => {
    if (!stream || !videoElement) return;

    const [track] = stream.getVideoTracks();
    if (!track) return;

    const handlePlayPause = () => {
      setVideoPlaying(!videoElement.paused);

      const { width = 0, height = 0 } = track.getSettings();
      setIsWideMode(width >= height);
    };

    videoElement.addEventListener('play', handlePlayPause);
    videoElement.addEventListener('pause', handlePlayPause);
    track.addEventListener('unmute', handlePlayPause);
    return () => {
      videoElement.removeEventListener('play', handlePlayPause);
      videoElement.removeEventListener('pause', handlePlayPause);
      track.removeEventListener('unmute', handlePlayPause);
    };
  }, [stream, videoElement]);

  if (!call) return null;

  return (
    <>
      <video
        {...rest}
        className={clsx(className, 'str-video__video', {
          'str-video__video--tall': !isWideMode,
          'str-video__video--mirror':
            isLocalParticipant && trackType === 'videoTrack',
          'str-video__video--screen-share': trackType === 'screenShareTrack',
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
