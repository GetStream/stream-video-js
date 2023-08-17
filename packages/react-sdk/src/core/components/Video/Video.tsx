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
import { BaseVideo } from './BaseVideo';
import { useCall } from '@stream-io/video-react-bindings';

export type VideoProps = ComponentPropsWithoutRef<'video'> & {
  kind: 'video' | 'screen' | 'none';
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
    isLocalParticipant,
    userId,
  } = participant;

  const call = useCall();

  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null,
  );

  // const [videoTrackMuted, setVideoTrackMuted] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const stream =
    kind === 'none'
      ? undefined
      : kind === 'video'
      ? videoStream
      : screenShareStream;

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

  const isPublishingTrack =
    kind === 'none'
      ? false
      : publishedTracks.includes(
          kind === 'video'
            ? SfuModels.TrackType.VIDEO
            : SfuModels.TrackType.SCREEN_SHARE,
        );

  const displayPlaceholder =
    !isPublishingTrack ||
    (viewportVisibilityState === VisibilityState.INVISIBLE &&
      !screenShareStream) ||
    !videoPlaying;

  useEffect(() => {
    if (!call || !videoElement || kind === 'none') return;

    const cleanup = call.registerVideoElement(videoElement, kind, sessionId);

    return () => cleanup?.();
  }, [call, kind, sessionId, videoElement]);

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
      <video
        {...rest}
        className={clsx(className, 'str-video__video', {
          'str-video__video--tall': !isWideMode,
          'str-video__video--mirror': isLocalParticipant && kind === 'video',
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
