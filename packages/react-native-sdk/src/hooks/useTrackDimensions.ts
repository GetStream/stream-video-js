import {
  StreamVideoParticipant,
  VideoTrackType,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useState, useEffect } from 'react';

/**
 * This is a utility hook to get the dimensions of the video track of the participant.
 * Note: the `tracktype` is used only for local participants.
 * `tracktype` should be 'videoTrack' for video track and 'screenShareTrack' for screen share track.
 */
export function useTrackDimensions(
  participant: StreamVideoParticipant,
  trackType: VideoTrackType
) {
  const [trackDimensions, setTrackDimensions] = useState({
    width: 0,
    height: 0,
  });
  const call = useCall();
  const { useCallStatsReport } = useCallStateHooks();
  const callStatsReport = useCallStatsReport();
  const { isLocalParticipant, sessionId, videoStream, screenShareStream } =
    participant;
  useEffect(() => {
    if (!call) return;
    if (isLocalParticipant) return;
    call.startReportingStatsFor(sessionId);
    return () => {
      call.stopReportingStatsFor(sessionId);
    };
  }, [call, sessionId, isLocalParticipant]);

  useEffect(() => {
    if (call && isLocalParticipant) {
      const stream =
        trackType === 'screenShareTrack' ? screenShareStream : videoStream;
      if (!stream) return;
      const [track] = stream?.getVideoTracks();
      if (!track) return;
      const { width = 0, height = 0 } = track.getSettings();
      setTrackDimensions((prev) => {
        if (prev.width !== width || prev.height !== height) {
          return { width, height };
        }
        return prev;
      });
    }
  }, [call, isLocalParticipant, screenShareStream, trackType, videoStream]);

  useEffect(() => {
    const reportForTracks = callStatsReport?.participants[sessionId];
    const trackStats = reportForTracks
      ?.flatMap((report) => report.streams)
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
  }, [callStatsReport, sessionId]);

  return trackDimensions;
}
