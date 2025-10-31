import {
  StreamVideoParticipant,
  VideoTrackType,
} from '@stream-io/video-client';
import { useTrackDimensions } from '../../../hooks/useTrackDimensions';

export const useFloatingVideoDimensions = (
  containerDimensions:
    | {
        width: number;
        height: number;
      }
    | undefined,
  participant: StreamVideoParticipant | undefined,
  trackType: VideoTrackType,
) => {
  const containerWidth = containerDimensions?.width ?? 0;
  const { width, height } = useTrackDimensions(participant, trackType);

  if (width === 0 || height === 0 || containerWidth === 0) {
    return undefined;
  }

  const aspectRatio = width / height;

  // based on Android AOSP PiP mode default dimensions algorithm
  // 23% of the container width
  const floatingVideoWidth = containerWidth * 0.23;
  // the height is calculated based on the aspect ratio
  const floatingVideoHeight = floatingVideoWidth / aspectRatio;

  return {
    width: floatingVideoWidth,
    height: floatingVideoHeight,
  };
};
