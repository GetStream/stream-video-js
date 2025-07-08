import {
  type StreamVideoParticipant,
  type VideoTrackType,
} from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';
import { useEffect, useState } from 'react';

/**
 * This is a utility hook to get the dimensions of the video track of the participant.
 * Note: the `tracktype` is used only for local participants.
 * `tracktype` should be 'videoTrack' for video track and 'screenShareTrack' for screen share track.
 */
export function useTrackDimensions(participant: StreamVideoParticipant) {
  const [trackDimensions, setTrackDimensions] = useState({
    width: 0,
    height: 0,
  });
  const call = useCall();
  const { sessionId } = participant;

  useEffect(() => {
    if (!call) return;
    call.startReportingStatsFor(sessionId);
    return () => {
      call.stopReportingStatsFor(sessionId);
    };
  }, [call, sessionId]);

  // for remote participants track.getSettings() is not supported it returns an empty object
  // and for local participants we can get from track.getSettings() but it reports the wrong dimensions as it sends the constraints
  // so we need to rely on call stats for all participants to get the dimensions
  useEffect(() => {
    if (!call) return;
    const sub = call.state.callStatsReport$.subscribe((report) => {
      if (!report) return;
      const reportForTracks = report.participants[sessionId];
      const trackStats = reportForTracks
        ?.flatMap((r) => r.streams)
        .filter((track) => track.kind === 'video');
      if (!trackStats) return;
      const stat = trackStats[0];
      if (stat) {
        const { frameWidth = 0, frameHeight = 0 } = stat;
        setTrackDimensions((prev) => {
          if (prev.width !== frameWidth || prev.height !== frameHeight) {
            return { width: frameWidth, height: frameHeight };
          }
          return prev;
        });
      }
    });
    return () => sub.unsubscribe();
  }, [call, sessionId]);

  return trackDimensions;
}
