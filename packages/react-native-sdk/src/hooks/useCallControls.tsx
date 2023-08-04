import { SfuModels } from '@stream-io/video-client';
import { useLocalParticipant } from '@stream-io/video-react-bindings';
import { useCallback } from 'react';
import { useMediaStreamManagement } from '../providers/MediaStreamManagement';

/**
 * A helper hook which exposes audio, video publishing state and
 * their respective functions to toggle state
 *
 * @category Device Management
 */
export const useCallControls = () => {
  const localParticipant = useLocalParticipant();

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

  const toggleVideoMuted = useCallback(async () => {
    if (isVideoPublished) {
      stopPublishingVideo();
    } else {
      publishVideoStream();
    }
  }, [isVideoPublished, publishVideoStream, stopPublishingVideo]);

  const toggleAudioMuted = useCallback(async () => {
    if (isAudioPublished) {
      stopPublishingAudio();
    } else {
      publishAudioStream();
    }
  }, [isAudioPublished, publishAudioStream, stopPublishingAudio]);

  return {
    isAudioPublished,
    isVideoPublished,
    toggleAudioMuted,
    toggleVideoMuted,
  };
};
