import { useEffect } from 'react';
import {
  SfuModels,
  combineComparators,
  withParticipantSource,
  role,
  publishingVideo,
  publishingAudio,
} from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';

/**
 * Sets up livestream participant sorting.
 * Prioritizes RTMP sources, then hosts, then participants publishing video/audio.
 */
export const useLivestreamSortPreset = () => {
  const call = useCall();
  useEffect(() => {
    if (!call) return;
    const comparator = combineComparators(
      withParticipantSource(SfuModels.ParticipantSource.RTMP),
      role('host'),
      publishingVideo,
      publishingAudio,
    );
    call.setSortParticipantsBy(comparator);
  }, [call]);
};
