import {
  ComponentPropsWithoutRef,
  ComponentType,
  useEffect,
  useLayoutEffect,
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
   * Set it to `null` if you wish to disable the video placeholder.
   *
   * @default DefaultVideoPlaceholder
   */
  VideoPlaceholder?: ComponentType<VideoPlaceholderProps> | null;
  /**
   * An object with setRef functions
   * meant for exposing some of the internal elements of this component.
   */
  refs?: {
    /**
     * The video element that's used to play the video stream.
     * @param element the video element.
     */
    setVideoElement?: (element: HTMLVideoElement | null) => void;
    /**
     * The video placeholder element that's used when the video stream is not playing.
     * @param element the video placeholder element.
     */
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
  // start with true, will flip once the video starts playing
  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const [isWideMode, setIsWideMode] = useState(true);

  const stream =
    trackType === 'videoTrack'
      ? videoStream
      : trackType === 'screenShareTrack'
      ? screenShareStream
      : undefined;

  useLayoutEffect(() => {
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
      setIsVideoPaused(videoElement.paused);

      const { width = 0, height = 0 } = track.getSettings();
      setIsWideMode(width >= height);
    };

    // playback may have started before we had a chance to
    // attach the 'play/pause' event listener, so we set the state
    // here to make sure it's in sync
    setIsVideoPaused(videoElement.paused);

    videoElement.addEventListener('play', handlePlayPause);
    videoElement.addEventListener('pause', handlePlayPause);
    track.addEventListener('unmute', handlePlayPause);
    return () => {
      videoElement.removeEventListener('play', handlePlayPause);
      videoElement.removeEventListener('pause', handlePlayPause);
      track.removeEventListener('unmute', handlePlayPause);

      // reset the 'pause' state once we unmount the video element
      setIsVideoPaused(true);
    };
  }, [stream, videoElement]);

  if (!call) return null;

  const isPublishingTrack =
    trackType === 'videoTrack'
      ? publishedTracks.includes(SfuModels.TrackType.VIDEO)
      : trackType === 'screenShareTrack'
      ? publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE)
      : false;

  const isInvisible =
    trackType === 'none' ||
    viewportVisibilityState?.[trackType] === VisibilityState.INVISIBLE;

  const hasNoVideoOrInvisible = !isPublishingTrack || isInvisible;
  const mirrorVideo = isLocalParticipant && trackType === 'videoTrack';
  const isScreenShareTrack = trackType === 'screenShareTrack';
  return (
    <>
      {!hasNoVideoOrInvisible && (
        <video
          {...rest}
          className={clsx('str-video__video', className, {
            'str-video__video--not-playing': isVideoPaused,
            'str-video__video--tall': !isWideMode,
            'str-video__video--mirror': mirrorVideo,
            'str-video__video--screen-share': isScreenShareTrack,
          })}
          data-user-id={userId}
          data-session-id={sessionId}
          ref={(element) => {
            setVideoElement(element);
            refs?.setVideoElement?.(element);
          }}
        />
      )}
      {/* TODO: add condition to "hold" the placeholder until track unmutes as well */}
      {(hasNoVideoOrInvisible || isVideoPaused) && VideoPlaceholder && (
        <VideoPlaceholder
          style={{ position: 'absolute' }}
          participant={participant}
          ref={refs?.setVideoPlaceholderElement}
        />
      )}
    </>
  );
};
