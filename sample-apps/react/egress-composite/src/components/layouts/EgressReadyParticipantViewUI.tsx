import { useEffect } from 'react';
import {
  DefaultParticipantViewUI,
  DefaultParticipantViewUIProps,
  SfuModels,
  useParticipantViewContext,
} from '@stream-io/video-react-sdk';

import { useNotifyEgressReady } from '../../hooks';

export const EgressReadyParticipantViewUI = (
  props: DefaultParticipantViewUIProps,
) => {
  useNotifyEgressReadyOnFirstFrame();
  return <DefaultParticipantViewUI {...props} />;
};

export const EgressReadinessProbe = () => {
  useNotifyEgressReadyOnFirstFrame();
  return null;
};

const useNotifyEgressReadyOnFirstFrame = () => {
  const notifyReady = useNotifyEgressReady();
  const { participant, trackType, videoElement, videoPlaceholderElement } =
    useParticipantViewContext();

  useEffect(() => {
    const sfuTrackType =
      trackType === 'screenShareTrack'
        ? SfuModels.TrackType.SCREEN_SHARE
        : SfuModels.TrackType.VIDEO;
    const isPublishingTrack =
      participant?.publishedTracks.includes(sfuTrackType);

    if (isPublishingTrack && videoElement) {
      const isAlreadyPlaying =
        videoElement.currentTime > 0 &&
        !videoElement.paused &&
        !videoElement.ended;
      if (isAlreadyPlaying) notifyReady(true);
      const onPlay = () => notifyReady(true);
      videoElement.addEventListener('play', onPlay, { once: true });
      return () => videoElement.removeEventListener('play', onPlay);
    }

    if (!isPublishingTrack && videoPlaceholderElement) {
      notifyReady(true);
    }
    return undefined;
  }, [
    notifyReady,
    participant?.publishedTracks,
    trackType,
    videoElement,
    videoPlaceholderElement,
  ]);
};
