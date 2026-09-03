import { useEffect, useRef, useState } from 'react';
import {
  StatCard,
  type CallStatsReport,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

const BOUNDS = {
  latency: { lowBound: 75, highBound: 400 },
  videoJitter: { lowBound: 20, highBound: 50 },
  audioJitter: { lowBound: 10, highBound: 30 },
};

const comparison = (
  value: number | undefined,
  bounds: { lowBound: number; highBound: number },
) => (value === undefined ? undefined : { value, ...bounds });

const formatMs = (value: number | undefined) =>
  value === undefined ? '-' : `${Math.round(value)} ms.`;

const formatResolution = (
  width: number | undefined,
  height: number | undefined,
  fps: number | undefined,
) => {
  if (!width || !height) return '-';
  return fps ? `${width}x${height}@${fps}` : `${width}x${height}`;
};

const formatBitrate = (
  previousBytes: number,
  currentBytes: number,
  previousTimestamp: number,
  currentTimestamp: number,
) => {
  const elapsed = currentTimestamp - previousTimestamp;
  if (elapsed <= 0) return '-';
  return `${(((currentBytes - previousBytes) * 8) / elapsed).toFixed(2)} kbps`;
};

const NO_BITRATES = {
  pubVideo: '-',
  pubAudio: '-',
  recvVideo: '-',
  recvAudio: '-',
};

export const PreCallTestStats = () => {
  const { useCallStatsReport } = useCallStateHooks();
  const report = useCallStatsReport();

  const previousReport = useRef<CallStatsReport | undefined>(undefined);
  const [bitrates, setBitrates] = useState(NO_BITRATES);

  useEffect(() => {
    if (!report) return;
    const previous = previousReport.current;
    previousReport.current = report;
    if (!previous) return;

    setBitrates({
      pubVideo: formatBitrate(
        previous.publisherStats.totalBytesSent,
        report.publisherStats.totalBytesSent,
        previous.publisherStats.timestamp,
        report.publisherStats.timestamp,
      ),
      pubAudio: formatBitrate(
        previous.publisherAudioStats.totalBytesSent,
        report.publisherAudioStats.totalBytesSent,
        previous.publisherAudioStats.timestamp,
        report.publisherAudioStats.timestamp,
      ),
      recvVideo: formatBitrate(
        previous.subscriberStats.totalBytesReceived,
        report.subscriberStats.totalBytesReceived,
        previous.subscriberStats.timestamp,
        report.subscriberStats.timestamp,
      ),
      recvAudio: formatBitrate(
        previous.subscriberAudioStats.totalBytesReceived,
        report.subscriberAudioStats.totalBytesReceived,
        previous.subscriberAudioStats.timestamp,
        report.subscriberAudioStats.timestamp,
      ),
    });
  }, [report]);

  const publisher = report?.publisherStats;
  const subscriber = report?.subscriberStats;

  return (
    <div className="str-video__call-stats rd__pre-call-test__stats">
      <div className="str-video__call-stats__card-container">
        <StatCard
          label="Latency"
          value={formatMs(publisher?.averageRoundTripTimeInMs)}
          comparison={comparison(
            publisher?.averageRoundTripTimeInMs,
            BOUNDS.latency,
          )}
        />
        <StatCard
          label="Pub resolution"
          value={formatResolution(
            publisher?.highestFrameWidth,
            publisher?.highestFrameHeight,
            publisher?.highestFramesPerSecond,
          )}
        />
        <StatCard
          label="Recv resolution"
          value={formatResolution(
            subscriber?.highestFrameWidth,
            subscriber?.highestFrameHeight,
            subscriber?.highestFramesPerSecond,
          )}
        />

        <StatCard label="Pub video" value={bitrates.pubVideo} />
        <StatCard label="Recv video" value={bitrates.recvVideo} />
        <StatCard
          label="Recv video jitter"
          value={formatMs(subscriber?.averageJitterInMs)}
          comparison={comparison(
            subscriber?.averageJitterInMs,
            BOUNDS.videoJitter,
          )}
        />

        <StatCard label="Pub audio" value={bitrates.pubAudio} />
        <StatCard label="Recv audio" value={bitrates.recvAudio} />
        <StatCard
          label="Recv audio jitter"
          value={formatMs(report?.subscriberAudioStats.averageJitterInMs)}
          comparison={comparison(
            report?.subscriberAudioStats.averageJitterInMs,
            BOUNDS.audioJitter,
          )}
        />
      </div>
    </div>
  );
};
