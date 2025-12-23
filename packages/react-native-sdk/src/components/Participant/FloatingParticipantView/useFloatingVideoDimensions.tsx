import type {
  StreamVideoParticipant,
  VideoTrackType,
} from '@stream-io/video-client';
import { useTrackDimensions } from '../../../hooks/useTrackDimensions';
import { useWindowDimensions } from 'react-native';

export const useFloatingVideoDimensions = (
  participant: StreamVideoParticipant | undefined,
  trackType: VideoTrackType,
) => {
  const { width: containerWidth, height: containerHeight } =
    useWindowDimensions();
  const { width, height } = useTrackDimensions(participant, trackType);

  if (
    width === 0 ||
    height === 0 ||
    containerWidth === 0 ||
    containerHeight === 0
  ) {
    return undefined;
  }

  // based on Android AOSP PiP mode default dimensions algorithm
  // 23% of the shorter container dimension is the base dimension
  const shorterContainerDimension = Math.min(containerWidth, containerHeight);
  const baseDimension = shorterContainerDimension * 0.23;

  const aspectRatio = width / height;
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
