import {
  StreamVideoParticipant,
  VideoTrackType,
} from '@stream-io/video-client';
import { useTrackDimensions } from '../../../hooks/useTrackDimensions';

export const useFloatingVideoDimensions = (
  containerDimensions: { width: number; height: number } | undefined,
  participant: StreamVideoParticipant | undefined,
  trackType: VideoTrackType,
) => {
  const trackDimensions = useTrackDimensions(participant, trackType);
  const containerWidth = containerDimensions?.width ?? 0;
  const containerHeight = containerDimensions?.height ?? 0;

  if (containerWidth === 0 || containerHeight === 0) {
    return undefined;
  }

  const { width, height } = trackDimensions;
  // width / height used until the video reports its size, e.g. when the camera
  // has not been turned on yet, so the view can still render its video fallback
  const aspectRatio = width > 0 && height > 0 ? width / height : 3 / 4;

  // based on Android AOSP PiP mode default dimensions algorithm
  // 23% of the shorter container dimension is the base dimension
  const shorterContainerDimension = Math.min(containerWidth, containerHeight);
  const baseDimension = shorterContainerDimension * 0.23;

  const isPortraitVideo = aspectRatio < 1;

  // baseDimension is assigned to either height or width based on whether the video is landscape or portrait
  if (isPortraitVideo) {
    return {
      width: baseDimension,
      height: baseDimension / aspectRatio,
    };
  } else {
    return {
      width: baseDimension * aspectRatio,
      height: baseDimension,
    };
  }
};
