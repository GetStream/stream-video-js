import { ReactNode, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  AggregatedStatsReport,
  CallStatsReport,
} from '@stream-io/video-client';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';

import { useFloating, useHover, useInteractions } from '@floating-ui/react';

import { CallStatsLatencyChart } from './CallStatsLatencyChart';
import { Icon } from '../Icon';

export enum Statuses {
  GOOD = 'Good',
  OK = 'Ok',
  BAD = 'Bad',
}
export type Status = Statuses.GOOD | Statuses.OK | Statuses.BAD;

export const statsStatus = ({
  value,
  lowBound,
  highBound,
}: {
  value: number;
  lowBound: number;
  highBound: number;
}): Status => {
  if (value <= lowBound) {
    return Statuses.GOOD;
  }

  if (value >= lowBound && value <= highBound) {
    return Statuses.OK;
  }

  if (value >= highBound) {
    return Statuses.BAD;
  }

  return Statuses.GOOD;
};

export const CallStats = () => {
  const [latencyBuffer, setLatencyBuffer] = useState<
    Array<{ x: number; y: number }>
  >(() => {
    const now = Date.now();
    return Array.from({ length: 20 }, (_, i) => ({ x: now + i, y: 0 }));
  });

  const { t } = useI18n();
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

  const latencyComparison = {
    highBound: 300,
    lowBound: 50,
    value: callStatsReport?.publisherStats.averageRoundTripTimeInMs || 0,
  };

  return (
    <div className="str-video__call-stats">
      {callStatsReport && (
        <>
          <div className="str-video__call-stats__header">
            <h3 className="str-video__call-stats__heading">
              <Icon className="str-video__call-stats__icon" icon="grid" />
              {t('Call Latency')}
            </h3>
            <p className="str-video__call-stats__description">
              {t(
                'Very high latency values may reduce call quality, cause lag, and make the call less enjoyable.',
              )}
            </p>
          </div>

          <div className="str-video__call-stats__latencychart">
            <CallStatsLatencyChart values={latencyBuffer} />
          </div>

          <div className="str-video__call-stats__header">
            <h3 className="str-video__call-stats__heading">
              <Icon className="str-video__call-stats__icon" icon="grid" />
              {t('Call performance')}
            </h3>
            <p className="str-video__call-stats__description">
              {t(
                'Very high latency values may reduce call quality, cause lag, and make the call less enjoyable.',
              )}
            </p>
          </div>

          <div className="str-video__call-stats__card-container">
            <StatCard
              label="Region"
              value={callStatsReport.datacenter}
              comparison={latencyComparison}
            />
            <StatCard
              label="Latency"
              value={`${callStatsReport.publisherStats.averageRoundTripTimeInMs} ms.`}
              comparison={latencyComparison}
            />
            <StatCard
              label="Receive jitter"
              value={`${callStatsReport.subscriberStats.averageJitterInMs} ms.`}
              comparison={{
                highBound: 300,
                lowBound: 100,
                value: callStatsReport.subscriberStats.averageJitterInMs,
              }}
            />
            <StatCard
              label="Publish jitter"
              value={`${callStatsReport.publisherStats.averageJitterInMs} ms.`}
              comparison={{
                highBound: 300,
                lowBound: 100,
                value: callStatsReport.publisherStats.averageJitterInMs,
              }}
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

export const StatCardExplanation = (props: { description: string }) => {
  const { description } = props;
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
  });

  const hover = useHover(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <>
      <div
        className="str-video__call-explanation"
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <Icon className="str-video__call-explanation__icon" icon="info" />
      </div>
      {isOpen && (
        <div
          className="str-video__call-explanation__description"
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
        >
          {description}
        </div>
      )}
    </>
  );
};

export const StatsTag = ({
  children,
  status = Statuses.GOOD,
}: {
  children: ReactNode;
  status: Statuses.GOOD | Statuses.OK | Statuses.BAD;
}) => {
  return (
    <div
      className={clsx('str-video__call-stats__tag', {
        'str-video__call-stats__tag--good': status === Statuses.GOOD,
        'str-video__call-stats__tag--ok': status === Statuses.OK,
        'str-video__call-stats__tag--bad': status === Statuses.BAD,
      })}
    >
      <div className="str-video__call-stats__tag__text">{children}</div>
    </div>
  );
};

export const StatCard = (props: {
  label: string;
  value: string | ReactNode;
  description?: string;
  comparison?: { value: number; highBound: number; lowBound: number };
}) => {
  const { label, value, description, comparison } = props;

  const { t } = useI18n();
  const status = comparison ? statsStatus(comparison) : undefined;

  return (
    <div className="str-video__call-stats__card">
      <div className="str-video__call-stats__card-content">
        <div className="str-video__call-stats__card-label">
          {label}
          {description && <StatCardExplanation description={description} />}
        </div>
        <div className="str-video__call-stats__card-value">{value}</div>
      </div>
      {comparison && status && <StatsTag status={status}>{t(status)}</StatsTag>}
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
