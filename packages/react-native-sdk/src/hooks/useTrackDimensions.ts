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
export function useTrackDimensions(
  participant: StreamVideoParticipant,
  trackType: VideoTrackType,
) {
  const [trackDimensions, setTrackDimensions] = useState({
    width: 0,
    height: 0,
  });
  const call = useCall();
  const { isLocalParticipant, sessionId, videoStream, screenShareStream } =
    participant;

  // for local participant we can get from track.getSettings()
  useEffect(() => {
    if (call && isLocalParticipant) {
      const stream =
        trackType === 'screenShareTrack' ? screenShareStream : videoStream;
      if (!stream) return;
      const [track] = stream.getVideoTracks();
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

  // start reporting stats for the remote participant
  useEffect(() => {
    if (!call) return;
    if (isLocalParticipant) return;
    call.startReportingStatsFor(sessionId);
    return () => {
      call.stopReportingStatsFor(sessionId);
    };
  }, [call, sessionId, isLocalParticipant]);

  // for remote participants track.getSettings() is not supported it returns an empty object
  // so we need to rely on call stats to get the dimensions
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
