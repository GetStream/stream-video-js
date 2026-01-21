import { lazy, ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  AggregatedStatsReport,
  CallStatsReport,
  SfuModels,
} from '@stream-io/video-client';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { useFloating, useHover, useInteractions } from '@floating-ui/react';
import { Icon } from '../Icon';

const CallStatsLatencyChart = lazy(() => import('./CallStatsLatencyChart'));

enum Status {
  GOOD = 'Good',
  OK = 'Ok',
  BAD = 'Bad',
}

export type CallStatsProps = {
  latencyLowBound?: number;
  latencyHighBound?: number;
  audioJitterLowBound?: number;
  audioJitterHighBound?: number;
  videoJitterLowBound?: number;
  videoJitterHighBound?: number;
  showCodecInfo?: boolean;
  LatencyChartSuspenseFallback?: ReactNode;
};

export const CallStats = (props: CallStatsProps) => {
  const {
    latencyLowBound = 75,
    latencyHighBound = 400,
    audioJitterLowBound = 10,
    audioJitterHighBound = 30,
    videoJitterLowBound = 20,
    videoJitterHighBound = 50,
    showCodecInfo = false,
    LatencyChartSuspenseFallback = null,
  } = props;
  const [latencyBuffer, setLatencyBuffer] = useState<
    Array<{ x: number; y: number }>
  >(() => {
    const now = Date.now();
    return Array.from({ length: 20 }, (_, i) => ({ x: now + i, y: 0 }));
  });

  const { t } = useI18n();
  const [publishBitrate, setPublishBitrate] = useState('-');
  const [subscribeBitrate, setSubscribeBitrate] = useState('-');
  const [publishAudioBitrate, setPublishAudioBitrate] = useState('-');
  const [subscribeAudioBitrate, setSubscribeAudioBitrate] = useState('-');
  const previousStats = useRef<CallStatsReport>(undefined);
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
    setPublishAudioBitrate(() => {
      return calculatePublishAudioBitrate(
        previousCallStatsReport,
        callStatsReport,
      );
    });
    setSubscribeAudioBitrate(() => {
      return calculateSubscribeAudioBitrate(
        previousCallStatsReport,
        callStatsReport,
      );
    });

    setLatencyBuffer((latencyBuf) => {
      const newLatencyBuffer = latencyBuf.slice(-19);
      newLatencyBuffer.push({
        x: callStatsReport.timestamp,
        y:
          callStatsReport.publisherStats.averageRoundTripTimeInMs ||
          callStatsReport.publisherAudioStats.averageRoundTripTimeInMs,
      });
      return newLatencyBuffer;
    });

    previousStats.current = callStatsReport;
  }, [callStatsReport]);

  const latencyComparison = {
    lowBound: latencyLowBound,
    highBound: latencyHighBound,
    value: callStatsReport?.publisherStats.averageRoundTripTimeInMs || 0,
  };

  const audioJitterComparison = {
    lowBound: audioJitterLowBound,
    highBound: audioJitterHighBound,
  };

  const videoJitterComparison = {
    lowBound: videoJitterLowBound,
    highBound: videoJitterHighBound,
  };

  return (
    <div className="str-video__call-stats">
      {callStatsReport && (
        <>
          <div className="str-video__call-stats__header">
            <h3 className="str-video__call-stats__heading">
              <Icon
                className="str-video__call-stats__icon"
                icon="call-latency"
              />
              {t('Call Latency')}
            </h3>
            <p className="str-video__call-stats__description">
              {t(
                'Very high latency values may reduce call quality, cause lag, and make the call less enjoyable.',
              )}
            </p>
          </div>

          <div className="str-video__call-stats__latencychart">
            <Suspense fallback={LatencyChartSuspenseFallback}>
              <CallStatsLatencyChart values={latencyBuffer} />
            </Suspense>
          </div>

          <div className="str-video__call-stats__header">
            <h3 className="str-video__call-stats__heading">
              <Icon
                className="str-video__call-stats__icon"
                icon="network-quality"
              />
              {t('Video performance')}
            </h3>
            <p className="str-video__call-stats__description">
              {t('Review the key data points below to assess call performance')}
            </p>
          </div>

          <div className="str-video__call-stats__card-container">
            <StatCard label={t('Region')} value={callStatsReport.datacenter} />
            <StatCard
              label={t('Latency')}
              value={`${callStatsReport.publisherStats.averageRoundTripTimeInMs} ms.`}
              comparison={latencyComparison}
            />
            <StatCard
              label={t('Receive jitter')}
              value={`${callStatsReport.subscriberStats.averageJitterInMs} ms.`}
              comparison={{
                ...videoJitterComparison,
                value: callStatsReport.subscriberStats.averageJitterInMs,
              }}
            />
            <StatCard
              label={t('Publish jitter')}
              value={`${callStatsReport.publisherStats.averageJitterInMs} ms.`}
              comparison={{
                ...videoJitterComparison,
                value: callStatsReport.publisherStats.averageJitterInMs,
              }}
            />
            <StatCard
              label={`${t('Publish resolution')}${showCodecInfo ? formatCodec(callStatsReport) : ''}`}
              value={toFrameSize(callStatsReport.publisherStats)}
            />
            <StatCard
              label={t('Publish quality drop reason')}
              value={callStatsReport.publisherStats.qualityLimitationReasons}
            />
            <StatCard
              label={t('Receiving resolution')}
              value={toFrameSize(callStatsReport.subscriberStats)}
            />
            <StatCard
              label={t('Receive quality drop reason')}
              value={callStatsReport.subscriberStats.qualityLimitationReasons}
            />
            <StatCard label={t('Publish bitrate')} value={publishBitrate} />
            <StatCard label={t('Receiving bitrate')} value={subscribeBitrate} />
          </div>

          <div className="str-video__call-stats__header">
            <h3 className="str-video__call-stats__heading">
              <Icon className="str-video__call-stats__icon" icon="mic" />
              {t('Audio Performance')}
            </h3>
            <p className="str-video__call-stats__description">
              {t(
                'Review the key audio data points below to assess audio performance',
              )}
            </p>
          </div>

          <div className="str-video__call-stats__card-container">
            <StatCard
              label={t('Latency')}
              value={`${callStatsReport.publisherAudioStats.averageRoundTripTimeInMs} ms.`}
              comparison={latencyComparison}
            />
            <StatCard
              label={t('Audio codec')}
              value={formatAudioCodec(callStatsReport)}
            />
            <StatCard
              label={t('Audio bitrate (publish)')}
              value={publishAudioBitrate}
            />
            <StatCard
              label={t('Audio bitrate (receive)')}
              value={subscribeAudioBitrate}
            />
            <StatCard
              label={t('Audio jitter (publish)')}
              value={`${callStatsReport.publisherAudioStats.averageJitterInMs} ms.`}
              comparison={{
                ...audioJitterComparison,
                value: callStatsReport.publisherAudioStats.averageJitterInMs,
              }}
            />
            <StatCard
              label={t('Audio jitter (receive)')}
              value={`${callStatsReport.subscriberAudioStats.averageJitterInMs} ms.`}
              comparison={{
                ...audioJitterComparison,
                value: callStatsReport.subscriberAudioStats.averageJitterInMs,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

const StatCardExplanation = (props: { description: string }) => {
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

const StatsTag = (props: { children: ReactNode; status: Status }) => {
  const { children, status } = props;
  return (
    <div
      className={clsx('str-video__call-stats__tag', {
        'str-video__call-stats__tag--good': status === Status.GOOD,
        'str-video__call-stats__tag--ok': status === Status.OK,
        'str-video__call-stats__tag--bad': status === Status.BAD,
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
  const status = comparison ? toStatus(comparison) : undefined;

  return (
    <div className="str-video__call-stats__card">
      <div className="str-video__call-stats__card-content">
        <div className="str-video__call-stats__card-label">
          {label}
          {description && <StatCardExplanation description={description} />}
        </div>
        <div className="str-video__call-stats__card-value">{value}</div>
      </div>
      {status && <StatsTag status={status}>{t(status)}</StatsTag>}
    </div>
  );
};

const toStatus = (config: {
  value: number;
  lowBound: number;
  highBound: number;
}): Status => {
  const { value, lowBound, highBound } = config;
  if (value <= lowBound) return Status.GOOD;
  if (value >= lowBound && value <= highBound) return Status.OK;
  if (value >= highBound) return Status.BAD;
  return Status.GOOD;
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

const formatCodec = (callStatsReport: CallStatsReport): string => {
  const { codecPerTrackType } = callStatsReport.publisherStats;
  if (!codecPerTrackType || !codecPerTrackType[SfuModels.TrackType.VIDEO]) {
    return '';
  }
  const [, name] = codecPerTrackType[SfuModels.TrackType.VIDEO].split('/');
  return name ? ` (${name})` : '';
};

const formatAudioCodec = (callStatsReport: CallStatsReport): string => {
  const { codecPerTrackType } = callStatsReport.publisherAudioStats;
  if (!codecPerTrackType || !codecPerTrackType[SfuModels.TrackType.AUDIO]) {
    return '';
  }
  const [, name] = codecPerTrackType[SfuModels.TrackType.AUDIO].split('/');
  return name ?? '';
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

const calculatePublishAudioBitrate = (
  previousCallStatsReport: CallStatsReport,
  callStatsReport: CallStatsReport,
) => {
  const previousAudioStats = previousCallStatsReport.publisherAudioStats;
  const audioStats = callStatsReport.publisherAudioStats;

  const bytesSent =
    audioStats.totalBytesSent - previousAudioStats.totalBytesSent;
  const timeElapsed = audioStats.timestamp - previousAudioStats.timestamp;

  return `${((bytesSent * 8) / timeElapsed).toFixed(2)} kbps`;
};

const calculateSubscribeAudioBitrate = (
  previousCallStatsReport: CallStatsReport,
  callStatsReport: CallStatsReport,
) => {
  const previousAudioStats = previousCallStatsReport.subscriberAudioStats;
  const audioStats = callStatsReport.subscriberAudioStats;

  const bytesReceived =
    audioStats.totalBytesReceived - previousAudioStats.totalBytesReceived;
  const timeElapsed = audioStats.timestamp - previousAudioStats.timestamp;

  return `${((bytesReceived * 8) / timeElapsed).toFixed(2)} kbps`;
};
