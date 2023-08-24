import { useNotifyEgressReady } from '../../hooks/useNotifyEgress';
import { useEffect, useState } from 'react';
import { SfuModels, StreamVideoParticipant } from '@stream-io/video-react-sdk';

export const useEgressReadyWhenAnyParticipantMounts = (
  participant?: StreamVideoParticipant,
  trackType?: SfuModels.TrackType.VIDEO | SfuModels.TrackType.SCREEN_SHARE,
) => {
  const notifyEgressReady = useNotifyEgressReady();
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null,
  );
  const [videoPlaceholderElement, setVideoPlaceholderElement] =
    useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const isPublishingVideoTrack =
      trackType !== undefined &&
      participant?.publishedTracks.includes(trackType);

    if (isPublishingVideoTrack && videoElement) {
      // video element for participants with video
      const onPlay = () => notifyEgressReady(true);
      videoElement.addEventListener('play', onPlay, { once: true });
      return () => videoElement.removeEventListener('play', onPlay);
    }

    if (!isPublishingVideoTrack && videoPlaceholderElement) {
      // placeholder div for audio-only participants
      notifyEgressReady(true);
    }
  }, [
    notifyEgressReady,
    participant?.publishedTracks,
    trackType,
    videoElement,
    videoPlaceholderElement,
  ]);

  return { setVideoElement, setVideoPlaceholderElement };
};
