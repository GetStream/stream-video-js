import {
  ComponentPropsWithoutRef,
  ComponentType,
  useEffect,
  useState,
} from 'react';
import {
  SfuModels,
  StreamVideoParticipant,
  VisibilityState,
} from '@stream-io/video-client';
import clsx from 'clsx';
import {
  DefaultVideoPlaceholder,
  VideoPlaceholderProps,
} from './DefaultVideoPlaceholder';
import { useCall } from '@stream-io/video-react-bindings';

export type VideoProps = ComponentPropsWithoutRef<'video'> & {
  videoMode: 'video' | 'screen' | 'none';
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
  videoMode,
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
    screenShareViewportVisibilityState,
    isLocalParticipant,
    userId,
  } = participant;

  const call = useCall();
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null,
  );
  // const [videoTrackMuted, setVideoTrackMuted] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [isWideMode, setIsWideMode] = useState(true);

  const stream =
    videoMode === 'none'
      ? undefined
      : videoMode === 'video'
      ? videoStream
      : screenShareStream;

  const isPublishingTrack =
    videoMode === 'none'
      ? false
      : publishedTracks.includes(
          videoMode === 'video'
            ? SfuModels.TrackType.VIDEO
            : SfuModels.TrackType.SCREEN_SHARE,
        );

  const isInvisible =
    videoMode === 'none'
      ? true
      : videoMode === 'video'
      ? viewportVisibilityState === VisibilityState.INVISIBLE
      : screenShareViewportVisibilityState === VisibilityState.INVISIBLE;

  const displayPlaceholder = !isPublishingTrack || isInvisible || !videoPlaying;

  useEffect(() => {
    if (!call || !videoElement || videoMode === 'none') return;

    const cleanup = call.bindVideoElement(videoElement, sessionId, videoMode);

    return () => {
      cleanup?.();
    };
  }, [call, videoMode, sessionId, videoElement]);

  useEffect(() => {
    if (!stream || !videoElement) return;

    const handlePlayPause = () => {
      setVideoPlaying(!videoElement.paused);

      const [track] = stream.getVideoTracks();
      if (!track) return;

      // TODO: find out why track dimensions aren't coming in
      const { width = 0, height = 0 } = track.getSettings();
      setIsWideMode(width >= height);
    };

    videoElement.addEventListener('play', handlePlayPause);
    videoElement.addEventListener('pause', handlePlayPause);
    return () => {
      videoElement.removeEventListener('play', handlePlayPause);
      videoElement.removeEventListener('pause', handlePlayPause);
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
            isLocalParticipant && videoMode === 'video',
          'str-video__video--screen-share': videoMode === 'screen',
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
