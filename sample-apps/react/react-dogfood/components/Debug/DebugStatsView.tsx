import { useEffect, useRef, useState } from 'react';
import { Call, StatCard, useCallStateHooks } from '@stream-io/video-react-sdk';
import { useFloatingUIPreset } from '../../hooks/useFloatingUIPreset';

export const DebugStatsView = (props: {
  call: Call;
  mediaStream?: MediaStream;
  sessionId: string;
  userId: string;
}) => {
  const { call, mediaStream, sessionId, userId } = props;
  const { useCallStatsReport } = useCallStateHooks();
  const callStatsReport = useCallStatsReport();

  useEffect(() => {
    call.startReportingStatsFor(sessionId);
    return () => {
      call.stopReportingStatsFor(sessionId);
    };
  }, [call, sessionId]);

  const reportForTracks = callStatsReport?.participants[sessionId];
  const trackStats = reportForTracks?.flatMap((report) => report.streams);

  const previousWidth = useRef<Record<string, number>>({ f: 0, h: 0, q: 0 });
  const previousHeight = useRef<Record<string, number>>({ f: 0, h: 0, q: 0 });
  trackStats?.forEach((track) => {
    if (track.kind !== 'video') return;
    const { frameWidth = 0, frameHeight = 0, rid = '' } = track;
    if (
      frameWidth !== previousWidth.current[rid] ||
      frameHeight !== previousHeight.current[rid]
    ) {
      const trackSize = `${frameWidth}x${frameHeight}`;
      console.log(`Track stats (${userId}/${sessionId}): ${rid}(${trackSize})`);
      previousWidth.current[rid] = frameWidth;
      previousHeight.current[rid] = frameHeight;
    }
  });

  const { refs, strategy, y, x } = useFloatingUIPreset({
    placement: 'top',
    strategy: 'absolute',
  });

  const [isPopperOpen, setIsPopperOpen] = useState(false);

  const [videoTrack] = mediaStream?.getVideoTracks() ?? [];
  const settings = videoTrack?.getSettings();
  return (
    <>
      <span
        className="rd__debug__track-stats-icon"
        tabIndex={0}
        ref={refs.setReference}
        title={
          settings &&
          `${settings.width}x${settings.height}@${Math.round(
            settings.frameRate || 0,
          )}`
        }
        onClick={() => {
          setIsPopperOpen((v) => !v);
        }}
      />
      {isPopperOpen && (
        <div
          className="rd__debug__track-stats str-video__call-stats"
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            overflowY: 'auto',
          }}
        >
          <h3>Participant stats</h3>
          <div className="str-video__call-stats__card-container">
            {trackStats
              ?.map((track) => {
                if (track.kind === 'video') {
                  return (
                    <StatCard
                      key={`${track.rid}/${track.ssrc}/${track.codec}/${track.kind}`}
                      label={
                        `${track.kind}: ${track.codec} ` +
                        (track.rid ? ` (${track.rid})` : '')
                      }
                      value={`${track.frameWidth || 0}x${
                        track.frameHeight || 0
                      }@${track.framesPerSecond || 0}fps`}
                    />
                  );
                } else if (track.kind === 'audio') {
                  return (
                    <StatCard
                      key={`${track.ssrc}/${track.codec}/${track.kind}`}
                      label={track.codec || 'N/A'}
                      value={`Jitter: ${track.jitter || 0}ms`}
                    />
                  );
                }
                return null;
              })
              .filter(Boolean)}
          </div>
          {reportForTracks?.map((report, index) => (
            <pre key={index}>
              {JSON.stringify(unwrapStats(report.rawStats), null, 2)}
            </pre>
          ))}
        </div>
      )}
    </>
  );
};

const unwrapStats = (rawStats?: RTCStatsReport) => {
  const decodedStats: Record<string, string> = {};
  rawStats?.forEach((s) => {
    decodedStats[s.id] = s;
  });
  return decodedStats;
};
