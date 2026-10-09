import { lazy, ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import {
  AggregatedStatsReport,
  CallStatsReport,
  Icon,
  SfuModels,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { StatCard, StatCardGrid } from '../StatCard';
import { useAppI18n } from '../../hooks/useAppI18n';

const CallStatsLatencyChart = lazy(() => import('./CallStatsLatencyChart'));

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

  const { t } = useAppI18n();
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
    <div className="rd__call-stats">
      {callStatsReport && (
        <>
          <div className="rd__call-stats__header">
            <h3 className="rd__call-stats__heading">
              <Icon className="rd__call-stats__icon" icon="call-latency" />
              {t('callStats.callLatency.title', 'Call Latency')}
            </h3>
            <p className="rd__call-stats__description">
              {t(
                'callStats.callLatency.description',
                'Very high latency values may reduce call quality, cause lag, and make the call less enjoyable.',
              )}
            </p>
          </div>

          <div className="rd__call-stats__latency-chart">
            <Suspense fallback={LatencyChartSuspenseFallback}>
              <CallStatsLatencyChart values={latencyBuffer} />
            </Suspense>
          </div>

          <div className="rd__call-stats__header">
            <h3 className="rd__call-stats__heading">
              <Icon className="rd__call-stats__icon" icon="network-quality" />
              {t('callStats.videoPerformance.title', 'Video performance')}
            </h3>
            <p className="rd__call-stats__description">
              {t(
                'callStats.videoPerformance.description',
                'Review the key data points below to assess call performance',
              )}
            </p>
          </div>

          <StatCardGrid>
            <StatCard
              label={t('callStats.region.label', 'Region')}
              value={callStatsReport.datacenter}
            />
            <StatCard
              label={t('callStats.latency.label', 'Latency')}
              value={`${callStatsReport.publisherStats.averageRoundTripTimeInMs} ms.`}
              comparison={latencyComparison}
            />
            <StatCard
              label={t('callStats.receiveJitter.label', 'Receive jitter')}
              value={`${callStatsReport.subscriberStats.averageJitterInMs} ms.`}
              comparison={{
                ...videoJitterComparison,
                value: callStatsReport.subscriberStats.averageJitterInMs,
              }}
            />
            <StatCard
              label={t('callStats.publishJitter.label', 'Publish jitter')}
              value={`${callStatsReport.publisherStats.averageJitterInMs} ms.`}
              comparison={{
                ...videoJitterComparison,
                value: callStatsReport.publisherStats.averageJitterInMs,
              }}
            />
            <StatCard
              label={`${t('callStats.publishResolution.label', 'Publish resolution')}${showCodecInfo ? formatCodec(callStatsReport) : ''}`}
              value={toFrameSize(callStatsReport.publisherStats)}
            />
            <StatCard
              label={t(
                'callStats.publishQualityDropReason.label',
                'Publish quality drop reason',
              )}
              value={callStatsReport.publisherStats.qualityLimitationReasons}
            />
            <StatCard
              label={t(
                'callStats.receivingResolution.label',
                'Receiving resolution',
              )}
              value={toFrameSize(callStatsReport.subscriberStats)}
            />
            <StatCard
              label={t(
                'callStats.receiveQualityDropReason.label',
                'Receive quality drop reason',
              )}
              value={callStatsReport.subscriberStats.qualityLimitationReasons}
            />
            <StatCard
              label={t('callStats.publishBitrate.label', 'Publish bitrate')}
              value={publishBitrate}
            />
            <StatCard
              label={t('callStats.receivingBitrate.label', 'Receiving bitrate')}
              value={subscribeBitrate}
            />
          </StatCardGrid>

          <div className="rd__call-stats__header">
            <h3 className="rd__call-stats__heading">
              <Icon className="rd__call-stats__icon" icon="mic" />
              {t('callStats.audioPerformance.title', 'Audio Performance')}
            </h3>
            <p className="rd__call-stats__description">
              {t(
                'callStats.audioPerformance.description',
                'Review the key audio data points below to assess audio performance',
              )}
            </p>
          </div>

          <StatCardGrid>
            <StatCard
              label={t('callStats.latency.label', 'Latency')}
              value={`${callStatsReport.publisherAudioStats.averageRoundTripTimeInMs} ms.`}
              comparison={latencyComparison}
            />
            <StatCard
              label={t('callStats.audioCodec.label', 'Audio codec')}
              value={formatAudioCodec(callStatsReport)}
            />
            <StatCard
              label={t(
                'callStats.audioBitratePublish.label',
                'Audio bitrate (publish)',
              )}
              value={publishAudioBitrate}
            />
            <StatCard
              label={t(
                'callStats.audioBitrateReceive.label',
                'Audio bitrate (receive)',
              )}
              value={subscribeAudioBitrate}
            />
            <StatCard
              label={t(
                'callStats.audioJitterPublish.label',
                'Audio jitter (publish)',
              )}
              value={`${callStatsReport.publisherAudioStats.averageJitterInMs} ms.`}
              comparison={{
                ...audioJitterComparison,
                value: callStatsReport.publisherAudioStats.averageJitterInMs,
              }}
            />
            <StatCard
              label={t(
                'callStats.audioJitterReceive.label',
                'Audio jitter (receive)',
              )}
              value={`${callStatsReport.subscriberAudioStats.averageJitterInMs} ms.`}
              comparison={{
                ...audioJitterComparison,
                value: callStatsReport.subscriberAudioStats.averageJitterInMs,
              }}
            />
          </StatCardGrid>
        </>
      )}
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
