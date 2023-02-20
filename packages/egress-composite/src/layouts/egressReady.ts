import { useNotifyEgressReady } from '../hooks/useNotifyEgress';
import { useEffect, useState } from 'react';
import { SfuModels, StreamVideoParticipant } from '@stream-io/video-react-sdk';

export const useEgressReadyWhenAnyParticipantMounts = (
  participant?: StreamVideoParticipant,
  trackType?: SfuModels.TrackType.VIDEO | SfuModels.TrackType.SCREEN_SHARE,
) => {
  const notifyEgressReady = useNotifyEgressReady();
  const [videoElement, setVideoElement] = useState<HTMLElement | null>();
  useEffect(() => {
    const isPublishingVideoTrack =
      trackType !== undefined &&
      participant?.publishedTracks.includes(trackType);
    if (videoElement instanceof HTMLVideoElement) {
      // video element for participants with video
      const onPlay = () => notifyEgressReady(true);
      videoElement.addEventListener('play', onPlay);
      return () => videoElement?.removeEventListener('play', onPlay);
    } else if (
      !isPublishingVideoTrack &&
      videoElement instanceof HTMLDivElement
    ) {
      // placeholder div for audio-only participants
      notifyEgressReady(true);
    }
  }, [
    notifyEgressReady,
    participant?.publishedTracks,
    trackType,
    videoElement,
  ]);

  return setVideoElement;
};
