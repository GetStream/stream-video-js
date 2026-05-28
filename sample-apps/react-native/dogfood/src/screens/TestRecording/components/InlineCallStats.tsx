import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  CallStatsReport,
  useCallStateHooks,
  useTheme,
} from '@stream-io/video-react-native-sdk';

type StatChipProps = { label: string; value: string };

const StatChip = ({ label, value }: StatChipProps) => {
  const styles = useStyles();
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

export const InlineCallStats = () => {
  const styles = useStyles();
  const { useCallStatsReport } = useCallStateHooks();
  const report = useCallStatsReport();

  const previousReport = useRef<CallStatsReport | undefined>(undefined);

  const [pubVideoBitrate, setPubVideoBitrate] = useState('-');
  const [pubAudioBitrate, setPubAudioBitrate] = useState('-');
  const [recvVideoBitrate, setRecvVideoBitrate] = useState('-');
  const [recvAudioBitrate, setRecvAudioBitrate] = useState('-');

  useEffect(() => {
    if (!report) return;
    if (!previousReport.current) {
      previousReport.current = report;
      return;
    }

    setPubVideoBitrate(
      formatBitrate(
        previousReport.current.publisherStats.totalBytesSent,
        report.publisherStats.totalBytesSent,
        previousReport.current.publisherStats.timestamp,
        report.publisherStats.timestamp,
      ),
    );
    setPubAudioBitrate(
      formatBitrate(
        previousReport.current.publisherAudioStats.totalBytesSent,
        report.publisherAudioStats.totalBytesSent,
        previousReport.current.publisherAudioStats.timestamp,
        report.publisherAudioStats.timestamp,
      ),
    );
    setRecvVideoBitrate(
      formatBitrate(
        previousReport.current.subscriberStats.totalBytesReceived,
        report.subscriberStats.totalBytesReceived,
        previousReport.current.subscriberStats.timestamp,
        report.subscriberStats.timestamp,
      ),
    );
    setRecvAudioBitrate(
      formatBitrate(
        previousReport.current.subscriberAudioStats.totalBytesReceived,
        report.subscriberAudioStats.totalBytesReceived,
        previousReport.current.subscriberAudioStats.timestamp,
        report.subscriberAudioStats.timestamp,
      ),
    );
    previousReport.current = report;
  }, [report]);

  const latency = report?.publisherStats.averageRoundTripTimeInMs;
  const recvVideoJitter = report?.subscriberStats.averageJitterInMs;
  const recvAudioJitter = report?.subscriberAudioStats.averageJitterInMs;
  const pubResolution = formatResolution(
    report?.publisherStats.highestFrameWidth,
    report?.publisherStats.highestFrameHeight,
    report?.publisherStats.highestFramesPerSecond,
  );
  const recvResolution = formatResolution(
    report?.subscriberStats.highestFrameWidth,
    report?.subscriberStats.highestFrameHeight,
    report?.subscriberStats.highestFramesPerSecond,
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatChip label="Latency" value={formatMs(latency)} />
        <StatChip label="Pub resolution" value={pubResolution} />
        <StatChip label="Recv resolution" value={recvResolution} />
      </View>
      <View style={styles.row}>
        <StatChip label="Pub video" value={pubVideoBitrate} />
        <StatChip label="Recv video" value={recvVideoBitrate} />
        <StatChip label="Recv video jitter" value={formatMs(recvVideoJitter)} />
      </View>
      <View style={styles.row}>
        <StatChip label="Pub audio" value={pubAudioBitrate} />
        <StatChip label="Recv audio" value={recvAudioBitrate} />
        <StatChip label="Recv audio jitter" value={formatMs(recvAudioJitter)} />
      </View>
    </View>
  );
};

const formatResolution = (
  w: number | undefined,
  h: number | undefined,
  fps: number | undefined,
) => {
  if (!w || !h) return '-';
  return fps ? `${w}x${h}@${fps}` : `${w}x${h}`;
};

const formatMs = (value: number | undefined) =>
  value === undefined ? '-' : `${value} ms`;

const formatBitrate = (
  prevBytes: number,
  curBytes: number,
  prevTs: number,
  curTs: number,
) => {
  const dt = curTs - prevTs;
  if (dt <= 0) return '-';
  const bytes = curBytes - prevBytes;
  return `${((bytes * 8) / dt).toFixed(2)} kbps`;
};

const useStyles = () => {
  const {
    theme: { colors, variants },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: variants.spacingSizes.xs,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'stretch',
          gap: variants.spacingSizes.xs,
        },
        chip: {
          flex: 1,
          backgroundColor: colors.sheetSecondary,
          paddingVertical: variants.spacingSizes.xs,
          paddingHorizontal: variants.spacingSizes.sm,
          borderRadius: variants.borderRadiusSizes.sm,
          minWidth: 90,
        },
        chipLabel: {
          color: colors.textSecondary,
          fontSize: 10,
        },
        chipValue: {
          color: colors.textPrimary,
          fontSize: 13,
          fontWeight: '600',
        },
      }),
    [colors, variants],
  );
};
