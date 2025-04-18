import {
  ClientDetails,
  Codec,
  Sdk,
  SdkType,
} from '../gen/video/sfu/models/models';
import type { RTCCodecStats } from './types';

/**
 * Flatten the stats report into an array of stats objects.
 *
 * @param report the report to flatten.
 */
export const flatten = (report: RTCStatsReport) => {
  const stats: RTCStats[] = [];
  report.forEach((s) => {
    stats.push(s);
  });
  return stats;
};

/**
 * Convert the stat report to an object.
 *
 * @param report the stat report to convert.
 */
export const toObject = (report: RTCStatsReport): Record<string, RTCStats> => {
  const obj: Record<string, RTCStats> = {};
  report.forEach((v, k) => {
    obj[k] = v;
  });
  return obj;
};

/**
 * Apply delta compression to the stats report.
 * Reduces size by ~90%.
 * To reduce further, report keys could be compressed.
 */
export const deltaCompression = (
  oldStats: Record<any, any>,
  newStats: Record<any, any>,
): Record<any, any> => {
  newStats = JSON.parse(JSON.stringify(newStats));

  for (const [id, report] of Object.entries(newStats)) {
    delete report.id;
    if (!oldStats[id]) continue;

    for (const [name, value] of Object.entries(report)) {
      if (value === oldStats[id][name]) {
        delete report[name];
      }
    }
  }

  let timestamp = -Infinity;
  for (const report of Object.values(newStats)) {
    if (report.timestamp > timestamp) {
      timestamp = report.timestamp;
    }
  }
  for (const report of Object.values(newStats)) {
    if (report.timestamp === timestamp) {
      report.timestamp = 0;
    }
  }
  newStats.timestamp = timestamp;
  return newStats;
};

/**
 * Based on Welford’s method for calculating variance of an infinite sequence.
 *
 * @param currentAverage current average.
 * @param currentValue current value.
 * @param n current sequence index.
 */
export const average = (
  currentAverage: number,
  currentValue: number,
  n: number,
) => currentAverage + (currentValue - currentAverage) / n;

/**
 * Create a Codec object from the codec stats.
 *
 * @param stats the stats report.
 * @param codecId the codec ID to look for.
 */
export const getCodecFromStats = (
  stats: Record<string, RTCStats>,
  codecId: string | undefined,
): Codec | undefined => {
  if (!codecId || !stats[codecId]) return;
  const codecStats = stats[codecId] as RTCCodecStats;
  return Codec.create({
    name: codecStats.mimeType.split('/').pop(), // video/av1 -> av1
    clockRate: codecStats.clockRate,
    payloadType: codecStats.payloadType,
    fmtp: codecStats.sdpFmtpLine,
  });
};

export const getSdkSignature = (clientDetails: ClientDetails) => {
  const { sdk, ...platform } = clientDetails;
  const sdkName = getSdkName(sdk);
  const sdkVersion = getSdkVersion(sdk);

  return {
    sdkName,
    sdkVersion,
    ...platform,
  };
};

export const getSdkName = (sdk: Sdk | undefined) => {
  return sdk && sdk.type === SdkType.REACT
    ? 'stream-react'
    : sdk && sdk.type === SdkType.REACT_NATIVE
      ? 'stream-react-native'
      : 'stream-js';
};

export const getSdkVersion = (sdk: Sdk | undefined) => {
  return sdk ? `${sdk.major}.${sdk.minor}.${sdk.patch}` : '0.0.0-development';
};
