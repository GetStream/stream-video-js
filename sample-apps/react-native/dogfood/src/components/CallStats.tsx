import {
  AggregatedStatsReport,
  CallStatsReport,
  useCall,
  useCallStateHooks,
  useI18n,
  useTheme,
} from '@stream-io/video-react-native-sdk';

import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useAppGlobalStoreValue } from '../contexts/AppContext';

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
  } = props;
  const styles = useStyles();
  const { t } = useI18n();
  const call = useCall();
  const [publishBitrate, setPublishBitrate] = useState('-');
  const [subscribeBitrate, setSubscribeBitrate] = useState('-');

  const [publishAudioBitrate, setPublishAudioBitrate] = useState('-');
  const [subscribeAudioBitrate, setSubscribeAudioBitrate] = useState('-');
  const previousStats = useRef<CallStatsReport | undefined>(undefined);

  const { useCallStatsReport } = useCallStateHooks();
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const callStatsReport = useCallStatsReport();

  useEffect(() => {
    if (!callStatsReport) {
      return;
    }
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
    previousStats.current = callStatsReport;
  }, [callStatsReport]);

  const latencyComparison = {
    lowBound: latencyLowBound,
    highBound: latencyHighBound,
    value: callStatsReport?.publisherStats.averageRoundTripTimeInMs,
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
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Stats</Text>
      </View>
      <View style={styles.infoContainer}>
        <Image source={{ uri: userImageUrl }} style={styles.logo} />

        <View style={styles.textContainer}>
          <Text style={styles.topText}>Call ID:</Text>
          <Text style={styles.bottomText}>{call?.cid}</Text>
        </View>
      </View>
      {callStatsReport && (
        <>
          <View style={styles.row}>
            <StatCard label={t('Region')} value={callStatsReport.datacenter} />
            <StatCard
              label={t('Latency')}
              value={`${callStatsReport.publisherStats.averageRoundTripTimeInMs} ms.`}
              comparison={latencyComparison}
            />
          </View>
          <View style={styles.row}>
            <StatCard
              label={t('Receive video jitter')}
              value={`${callStatsReport.subscriberStats.averageJitterInMs} ms.`}
              comparison={{
                ...videoJitterComparison,
                value: callStatsReport.subscriberStats.averageJitterInMs,
              }}
            />
            <StatCard
              label={t('Publish video jitter')}
              value={`${callStatsReport.publisherStats.averageJitterInMs} ms.`}
              comparison={{
                ...videoJitterComparison,
                value: callStatsReport.publisherStats.averageJitterInMs,
              }}
            />
          </View>
          <View style={styles.row}>
            <StatCard
              label={t('Receive audio jitter')}
              value={`${callStatsReport.subscriberAudioStats.averageJitterInMs} ms.`}
              comparison={{
                ...audioJitterComparison,
                value: callStatsReport.subscriberAudioStats.averageJitterInMs,
              }}
            />
            <StatCard
              label={t('Publish audio jitter')}
              value={`${callStatsReport.publisherStats.averageJitterInMs} ms.`}
              comparison={{
                ...audioJitterComparison,
                value: callStatsReport.publisherStats.averageJitterInMs,
              }}
            />
          </View>
          <View style={styles.row}>
            <StatCard
              label={`${t('Publish resolution')}${showCodecInfo ? formatCodec(callStatsReport) : ''}`}
              value={toFrameSize(callStatsReport.publisherStats)}
            />
            <StatCard
              label={t('Publish quality drop reason')}
              value={callStatsReport.publisherStats.qualityLimitationReasons}
            />
          </View>
          <View style={styles.row}>
            <StatCard
              label={t('Receiving resolution')}
              value={toFrameSize(callStatsReport.subscriberStats)}
            />
            <StatCard
              label={t('Receive quality drop reason')}
              value={callStatsReport.subscriberStats.qualityLimitationReasons}
            />
          </View>
        </>
      )}
      <View style={styles.row}>
        <StatCard label={t('Publish video bitrate')} value={publishBitrate} />
        <StatCard
          label={t('Receiving video bitrate')}
          value={subscribeBitrate}
        />
      </View>
      <View style={styles.row}>
        <StatCard
          label={t('Publish audio bitrate')}
          value={publishAudioBitrate}
        />
        <StatCard
          label={t('Receiving audio bitrate')}
          value={subscribeAudioBitrate}
        />
      </View>
    </View>
  );
};

const StatsTag = (props: { children: ReactNode; status: Status }) => {
  const { children, status } = props;
  const styles = useStyles();
  const {
    theme: { colors },
  } = useTheme();
  let color;
  switch (status) {
    case Status.GOOD:
      color = colors.iconSuccess;
      break;
    case Status.OK:
      color = '#ffd646';
      break;
    case Status.BAD:
      color = colors.warning;
      break;
    default:
      color = colors.iconSuccess;
  }
  return (
    <View
      style={[
        styles.tag,
        status === Status.GOOD && styles.good,
        status === Status.OK && styles.ok,
        status === Status.BAD && styles.bad,
      ]}
    >
      <Text style={{ ...styles.text, color }}>{children}</Text>
    </View>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  comparison?: {
    value: number | undefined;
    highBound: number;
    lowBound: number;
  };
}

const StatCard: React.FC<StatCardProps> = ({ label, value, comparison }) => {
  const styles = useStyles();
  const status = comparison ? toStatus(comparison) : undefined;
  const { t } = useI18n();

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {comparison && (
        <>{status && <StatsTag status={status}>{t(status)}</StatsTag>}</>
      )}
    </View>
  );
};

const toStatus = (config: {
  value: number | undefined;
  lowBound: number;
  highBound: number;
}): Status => {
  const { value, lowBound, highBound } = config;
  if (value && value <= lowBound) {
    return Status.GOOD;
  }
  if (value && value >= lowBound && value <= highBound) {
    return Status.OK;
  }
  if (value && value >= highBound) {
    return Status.BAD;
  }
  return Status.GOOD;
};

const toFrameSize = (stats: AggregatedStatsReport) => {
  const {
    highestFrameWidth: w,
    highestFrameHeight: h,
    highestFramesPerSecond: fps,
  } = stats;
  let size = '-';
  if (w && h) {
    size = `${w}x${h}`;
    if (fps) {
      size += `@${fps}fps.`;
    }
  }
  return size;
};

const formatCodec = (callStatsReport: CallStatsReport): string => {
  const { codec } = callStatsReport.publisherStats;
  if (!codec) {
    return '';
  }
  const [, name] = codec.split('/');
  return name ? ` (${name})` : '';
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

const useStyles = () => {
  const {
    theme: { primitives, semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: semantics.backgroundCoreApp,
          borderRadius: primitives.radiusMd,
          padding: primitives.spacingSm,
          maxWidth: 500,
        },
        titleContainer: {
          marginBottom: primitives.spacingSm,
          marginLeft: primitives.spacingSm,
        },
        title: {
          fontSize: primitives.typographyFontSizeLg,
          fontWeight: primitives.typographyFontWeightBold,
          color: semantics.textPrimary,
        },
        infoContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: primitives.spacingSm,
        },
        logo: {
          height: 50,
          width: 50,
          borderRadius: 50,
          alignSelf: 'center',
          marginLeft: primitives.spacingXs,
        },
        textContainer: {
          flexDirection: 'column',
          marginLeft: primitives.spacingMd,
        },
        topText: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightBold,
          color: semantics.textPrimary,
        },
        bottomText: {
          fontSize: primitives.typographyFontSizeMd,
          color: semantics.textSecondary,
        },
        row: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: primitives.spacingSm,
        },
        card: {
          width: '48%',
          padding: primitives.spacingSm,
          borderRadius: primitives.radiusMd,
          backgroundColor: semantics.backgroundCoreApp,
          alignItems: 'center',
        },
        label: {
          color: semantics.textSecondary,
          fontSize: primitives.typographyFontSizeMd,
          marginBottom: primitives.spacingXs,
          textAlign: 'center',
        },
        value: {
          color: semantics.textPrimary,
          fontSize: primitives.typographyFontSizeLg,
          fontWeight: primitives.typographyFontWeightBold,
          textAlign: 'center',
        },
        tag: {
          paddingVertical: primitives.spacingXs,
          paddingHorizontal: primitives.spacingMd,
          borderRadius: primitives.radiusSm,
          alignItems: 'center',
          justifyContent: 'center',
          marginVertical: primitives.spacingXs,
        },
        text: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
        },
        good: {
          backgroundColor: '#1B393A',
        },
        ok: {
          backgroundColor: '#ffd646a6',
        },
        bad: {
          backgroundColor: '#442C31',
        },
      }),
    [primitives, semantics],
  );
};
