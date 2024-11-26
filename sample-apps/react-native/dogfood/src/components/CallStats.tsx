import {
  useCallStateHooks,
  useI18n,
  CallStatsReport,
  AggregatedStatsReport,
  useTheme,
  useCall,
} from '@stream-io/video-react-native-sdk';

import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useAppGlobalStoreValue } from '../contexts/AppContext';

enum Status {
  GOOD = 'Good',
  OK = 'Ok',
  BAD = 'Bad',
}

export type CallStatsProps = {
  latencyLowBound?: number;
  latencyHighBound?: number;
  showCodecInfo?: boolean;
};

export const CallStats = (props: CallStatsProps) => {
  const {
    latencyLowBound = 75,
    latencyHighBound = 400,
    showCodecInfo = false,
  } = props;
  const styles = useStyles();
  const { t } = useI18n();
  const call = useCall();
  const [publishBitrate, setPublishBitrate] = useState('-');
  const [subscribeBitrate, setSubscribeBitrate] = useState('-');
  const previousStats = useRef<CallStatsReport>();

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

    previousStats.current = callStatsReport;
  }, [callStatsReport]);

  const latencyComparison = {
    lowBound: latencyLowBound,
    highBound: latencyHighBound,
    value: callStatsReport?.publisherStats.averageRoundTripTimeInMs,
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
          <Text style={styles.bottomText}>{call?.id}</Text>
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
              label={t('Receive jitter')}
              value={`${callStatsReport.subscriberStats.averageJitterInMs} ms.`}
              comparison={{
                ...latencyComparison,
                value: callStatsReport.subscriberStats.averageJitterInMs,
              }}
            />
            <StatCard
              label={t('Publish jitter')}
              value={`${callStatsReport.publisherStats.averageJitterInMs} ms.`}
              comparison={{
                ...latencyComparison,
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
              value={toFrameSize(callStatsReport.publisherStats)}
            />
            <StatCard
              label={t('Receive quality drop reason')}
              value={callStatsReport.subscriberStats.qualityLimitationReasons}
            />
          </View>
        </>
      )}
      <View style={styles.row}>
        <StatCard label={t('Publish bitrate')} value={publishBitrate} />
        <StatCard label={t('Receiving bitrate')} value={subscribeBitrate} />
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

const useStyles = () => {
  const {
    theme: { colors, variants },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.sheetSecondary,
          borderRadius: variants.borderRadiusSizes.md,
          padding: variants.spacingSizes.sm,
          maxWidth: 500,
        },
        titleContainer: {
          marginBottom: variants.spacingSizes.sm,
          marginLeft: variants.spacingSizes.sm,
        },
        title: {
          fontSize: 20,
          fontWeight: 'bold',
          color: colors.textPrimary,
        },
        infoContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: variants.spacingSizes.sm,
        },
        logo: {
          height: 50,
          width: 50,
          borderRadius: 50,
          alignSelf: 'center',
          marginLeft: variants.spacingSizes.xs,
        },
        textContainer: {
          flexDirection: 'column',
          marginLeft: variants.spacingSizes.md,
        },
        topText: {
          fontSize: 16,
          fontWeight: 'bold',
          color: colors.textPrimary,
        },
        bottomText: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        row: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: variants.spacingSizes.sm,
        },
        card: {
          width: '48%',
          padding: variants.spacingSizes.sm,
          borderRadius: variants.borderRadiusSizes.md,
          backgroundColor: colors.sheetPrimary,
          alignItems: 'center',
        },
        label: {
          color: colors.textSecondary,
          fontSize: 14,
          marginBottom: variants.spacingSizes.xs,
          textAlign: 'center',
        },
        value: {
          color: colors.textPrimary,
          fontSize: 16,
          fontWeight: 'bold',
          textAlign: 'center',
        },
        tag: {
          paddingVertical: variants.spacingSizes.xs,
          paddingHorizontal: variants.spacingSizes.md,
          borderRadius: variants.borderRadiusSizes.sm,
          alignItems: 'center',
          justifyContent: 'center',
          marginVertical: variants.spacingSizes.xs,
        },
        text: {
          fontSize: 14,
          fontWeight: 600,
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
    [variants, colors],
  );
};
