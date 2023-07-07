import { SfuModels } from '@stream-io/video-client';
import { useCall, useLocalParticipant } from '@stream-io/video-react-bindings';
import { useCallback, useRef } from 'react';
import { useAppStateListener } from '../utils/hooks/useAppStateListener';
import { useMediaStreamManagement } from '../providers/MediaStreamManagement';

/**
 * A helper hook which exposes audio, video mute and camera facing mode and
 * their respective functions to toggle state
 *
 * @category Device Management
 */
export const useCallControls = () => {
  const localParticipant = useLocalParticipant();
  const call = useCall();
  /** Refs to keep track of the current call and whether the user is online or not */
  const callRef = useRef(call);
  callRef.current = call;

  const {
    publishAudioStream,
    publishVideoStream,
    stopPublishingAudio,
    stopPublishingVideo,
  } = useMediaStreamManagement();

  const isAudioPublished = localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoPublished = localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );
  /** Refs to keep track of whether the user has published the track before going offline  */
  const isAudioPublishedRef = useRef(false);
  const isVideoPublishedRef = useRef(false);
  isAudioPublishedRef.current = !isAudioPublished;
  isVideoPublishedRef.current = !isVideoPublished;

  /** Refs to be used for useEffect that does the rejoining flow when coming back offline */
  const publishAudioStreamRef = useRef(publishAudioStream);
  const publishVideoStreamRef = useRef(publishVideoStream);
  publishAudioStreamRef.current = publishAudioStream;
  publishVideoStreamRef.current = publishVideoStream;

  /** Attempt to republish video stream when app comes back to foreground */
  useAppStateListener(
    isVideoPublishedRef.current ? publishVideoStream : undefined,
  );

  const toggleVideoMuted = useCallback(async () => {
    if (!isVideoPublished) {
      publishVideoStream();
    } else {
      stopPublishingVideo();
    }
  }, [isVideoPublished, publishVideoStream, stopPublishingVideo]);

  const toggleAudioMuted = useCallback(async () => {
    if (!isAudioPublished) {
      publishAudioStream();
    } else {
      stopPublishingAudio();
    }
  }, [isAudioPublished, publishAudioStream, stopPublishingAudio]);

  return {
    isAudioPublished,
    isVideoPublished,
    toggleAudioMuted,
    toggleVideoMuted,
  };
};
