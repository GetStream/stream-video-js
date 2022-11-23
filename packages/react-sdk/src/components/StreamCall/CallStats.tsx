import { useEffect, useRef, useState } from 'react';
import { usePopper } from 'react-popper';
import {
  AggregatedStatsReport,
  CallStatsReport,
} from '@stream-io/video-client';
import { useLatestStats } from '../../hooks/useParticipants';
import { CallStatsLatencyChart } from './CallStatsLatencyChart';

export const CallStats = (props: {
  anchor: HTMLElement;
  onClose?: () => void;
}) => {
  const { anchor, onClose } = props;
  const [popover, setPopover] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(anchor, popover, {
    placement: 'auto',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 10],
        },
      },
    ],
  });

  const [latencyBuffer, setLatencyBuffer] = useState<
    Array<{ x: number; y: number }>
  >(() => {
    const now = Date.now();
    return Array(20)
      .fill(null)
      .map((_, i) => ({ x: now + i, y: 0 }));
  });
  const [publishBitrate, setPublishBitrate] = useState('-');
  const [subscribeBitrate, setSubscribeBitrate] = useState('-');
  const previousStats = useRef<CallStatsReport>();
  const callStatsReport = useLatestStats();

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

    setLatencyBuffer((latencyBuffer) => {
      const newLatencyBuffer = latencyBuffer.slice(-19);
      newLatencyBuffer.push({
        x: callStatsReport.timestamp,
        y: callStatsReport.latencyInMs,
      });
      return newLatencyBuffer;
    });

    previousStats.current = callStatsReport;
  }, [callStatsReport]);

  return (
    <div
      className="str-video__call-stats"
      ref={setPopover}
      style={styles.popper}
      {...attributes.popper}
    >
      <h2 className="str-video__call-stats__title">
        Statistics{' '}
        <span className="str-video__call-stats__close" onClick={onClose}>
          X
        </span>
      </h2>
      {callStatsReport && (
        <>
          <h3>Call Latency</h3>
          <CallStatsLatencyChart values={latencyBuffer} />

          <h3>Call performance</h3>
          <div className="str-video__call-stats__card-container">
            <StatCard label="Region" value={callStatsReport.datacenter} />
            <StatCard
              label="Latency"
              value={`${callStatsReport.latencyInMs} ms.`}
            />
            <StatCard
              label="Jitter"
              value={`${callStatsReport.subscriberStats.averageJitterInMs} ms.`}
            />
            <StatCard
              label="Quality drop reason"
              value={callStatsReport.publisherStats.qualityLimitationReasons}
            />
            <StatCard
              label="Publish resolution"
              value={toFrameSize(callStatsReport.publisherStats)}
            />
            <StatCard
              label="Receiving resolution"
              value={toFrameSize(callStatsReport.subscriberStats)}
            />
            <StatCard label="Publish bitrate" value={publishBitrate} />
            <StatCard label="Receiving bitrate" value={subscribeBitrate} />
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = (props: { label: string; value: string }) => {
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
