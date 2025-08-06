import {
  type StreamVideoParticipant,
  type VideoTrackType,
} from '@stream-io/video-client';
import { useEffect, useState } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';

/**
 * This is a utility hook to get the dimensions of the video track of the participant.
 * Note: the `tracktype` is used only for local participants.
 * `tracktype` should be 'videoTrack' for video track and 'screenShareTrack' for screen share track.
 */
export function useTrackDimensions(
  participant: StreamVideoParticipant,
  trackType: VideoTrackType,
) {
  const { videoStream, screenShareStream } = participant;
  const stream =
    trackType === 'screenShareTrack' ? screenShareStream : videoStream;
  const [track] = stream?.getVideoTracks() ?? [];
  const trackId = track?.id;

  const [trackDimensions, setTrackDimensions] = useState(() => {
    const settings = track?.getSettings();
    const width = settings?.width ?? 0;
    const height = settings?.height ?? 0;
    return {
      width,
      height,
    };
  });

  // Set up videoTrackDimensionChanged event listener for more direct dimension updates
  useEffect(() => {
    if (!trackId || !track) return;

    const handleVideoTrackDimensionChanged = (eventData: {
      pcId: string;
      trackId: string;
      width: number;
      height: number;
    }) => {
      // Only handle events for this specific participant
      if (eventData.trackId === trackId) {
        setTrackDimensions((prev) => {
          if (
            prev.width === eventData.width &&
            prev.height === eventData.height
          ) {
            return prev;
          }
          return { width: eventData.width, height: eventData.height };
        });
      }
    };

    const { width, height } = track.getSettings();
    setTrackDimensions((prev) => {
      if (prev.width === width && prev.height === height) {
        return prev;
      }
      return {
        width: width ?? 0,
        height: height ?? 0,
      };
    });

    const webRTCEventEmitter = new NativeEventEmitter(
      NativeModules.WebRTCModule,
    );
    const subscription = webRTCEventEmitter.addListener(
      'videoTrackDimensionChanged',
      handleVideoTrackDimensionChanged,
    );

    return () => {
      subscription.remove();
    };
  }, [trackId, track]);

  return trackDimensions;
}
