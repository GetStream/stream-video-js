import { useEffect, useRef, useState } from 'react';
import {
  AggregatedStatsReport,
  CallStatsReport,
} from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { CallStatsLatencyChart } from './CallStatsLatencyChart';

export const CallStats = () => {
  const [latencyBuffer, setLatencyBuffer] = useState<
    Array<{ x: number; y: number }>
  >(() => {
    const now = Date.now();
    return Array.from({ length: 20 }, (_, i) => ({ x: now + i, y: 0 }));
  });

  const [publishBitrate, setPublishBitrate] = useState('-');
  const [subscribeBitrate, setSubscribeBitrate] = useState('-');
  const previousStats = useRef<CallStatsReport>();
  const { useCallStatsReport } = useCallStateHooks();
  const callStatsReport = useCallStatsReport();

  useEffect(() => {
    if (!callStatsReport) return;
    if (!previousStats.current) {
      previousStats.current = callStatsReport;
      return;
    }
    const previousCallStatsReport = previousStats.current;
    setPublishBitrate(() => {
      return calculatePublishBitrate(previousCallStatsReport, callStatsReport);
    });
    setSubscribeBitrate(() => {
      return calculateSubscribeBitrate(
        previousCallStatsReport,
        callStatsReport,
      );
    });

    setLatencyBuffer((latencyBuf) => {
      const newLatencyBuffer = latencyBuf.slice(-19);
      newLatencyBuffer.push({
        x: callStatsReport.timestamp,
        y: callStatsReport.publisherStats.averageRoundTripTimeInMs,
      });
      return newLatencyBuffer;
    });

    previousStats.current = callStatsReport;
  }, [callStatsReport]);

  return (
    <div className="str-video__call-stats">
      {callStatsReport && (
        <>
          <h3>Call Latency</h3>
          <CallStatsLatencyChart values={latencyBuffer} />

          <h3>Call performance</h3>
          <div className="str-video__call-stats__card-container">
            <StatCard label="Region" value={callStatsReport.datacenter} />
            <StatCard
              label="Latency"
              value={`${callStatsReport.publisherStats.averageRoundTripTimeInMs} ms.`}
            />
            <StatCard
              label="Receive jitter"
              value={`${callStatsReport.subscriberStats.averageJitterInMs} ms.`}
            />
            <StatCard
              label="Publish jitter"
              value={`${callStatsReport.publisherStats.averageJitterInMs} ms.`}
            />
            <StatCard
              label="Publish resolution"
              value={toFrameSize(callStatsReport.publisherStats)}
            />
            <StatCard
              label="Publish quality drop reason"
              value={callStatsReport.publisherStats.qualityLimitationReasons}
            />
            <StatCard
              label="Receiving resolution"
              value={toFrameSize(callStatsReport.subscriberStats)}
            />
            <StatCard
              label="Receive quality drop reason"
              value={callStatsReport.subscriberStats.qualityLimitationReasons}
            />
            <StatCard label="Publish bitrate" value={publishBitrate} />
            <StatCard label="Receiving bitrate" value={subscribeBitrate} />
          </div>
        </>
      )}
    </div>
  );
};

export const StatCard = (props: { label: string; value: string }) => {
  const { label, value } = props;
  return (
    <div className="str-video__call-stats__card">
      <div className="str-video__call-stats__card_label">{label}</div>
      <div className="str-video__call-stats__card_value">{value}</div>
    </div>
  );
};

const toFrameSize = (stats: AggregatedStatsReport) => {
  const {
    highestFrameWidth: w,
    highestFrameHeight: h,
    highestFramesPerSecond: fps,
  } = stats;
  let size = `-`;
  if (w && h) {
    size = `${w}x${h}`;
    if (fps) {
      size += `@${fps}fps.`;
    }
  }
  return size;
};

const calculatePublishBitrate = (
  previousCallStatsReport: CallStatsReport,
  callStatsReport: CallStatsReport,
) => {
  const {
    publisherStats: {
      totalBytesSent: previousTotalBytesSent,
      timestamp: previousTimestamp,
    },
  } = previousCallStatsReport;

  const {
    publisherStats: { totalBytesSent, timestamp },
  } = callStatsReport;

  const bytesSent = totalBytesSent - previousTotalBytesSent;
  const timeElapsed = timestamp - previousTimestamp;
  return `${((bytesSent * 8) / timeElapsed).toFixed(2)} kbps`;
};

const calculateSubscribeBitrate = (
  previousCallStatsReport: CallStatsReport,
  callStatsReport: CallStatsReport,
) => {
  const {
    subscriberStats: {
      totalBytesReceived: previousTotalBytesReceived,
      timestamp: previousTimestamp,
    },
  } = previousCallStatsReport;

  const {
    subscriberStats: { totalBytesReceived, timestamp },
  } = callStatsReport;

  const bytesReceived = totalBytesReceived - previousTotalBytesReceived;
  const timeElapsed = timestamp - previousTimestamp;
  return `${((bytesReceived * 8) / timeElapsed).toFixed(2)} kbps`;
};
