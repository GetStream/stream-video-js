import {
  Codec,
  PeerType,
  PerformanceStats,
  TrackType,
} from '../../gen/video/sfu/models/models';
import type { RTCCodecStats, RTCMediaSourceStats } from '../types';
import type { ComputedStats } from './types';

/**
 * StatsTracer is a class that collects and processes WebRTC stats.
 * It is used to track the performance of the WebRTC connection
 * and to provide information about the media streams.
 * It is used by both the Publisher and Subscriber classes.
 *
 * @internal
 */
export class StatsTracer {
  private readonly pc: RTCPeerConnection;
  private readonly peerType: PeerType;
  private readonly trackIdToTrackType: Map<string, TrackType>;

  private costOverrides?: Map<TrackType, number>;

  private previousStats: Record<string, RTCStats> = {};
  private frameTimeHistory: number[] = [];
  private fpsHistory: number[] = [];

  /**
   * Creates a new StatsTracer instance.
   */
  constructor(
    pc: RTCPeerConnection,
    peerType: PeerType,
    trackIdToTrackType: Map<string, TrackType>,
  ) {
    this.pc = pc;
    this.peerType = peerType;
    this.trackIdToTrackType = trackIdToTrackType;
  }

  /**
   * Get the stats from the RTCPeerConnection.
   * When called, it will return the stats for the current connection.
   * It will also return the delta between the current stats and the previous stats.
   * This is used to track the performance of the connection.
   *
   * @internal
   */
  get = async (): Promise<ComputedStats> => {
    const stats = await this.pc.getStats();
    const currentStats = toObject(stats);

    const performanceStats = this.withOverrides(
      this.peerType === PeerType.SUBSCRIBER
        ? this.getDecodeStats(currentStats)
        : this.getEncodeStats(currentStats),
    );

    const delta = deltaCompression(this.previousStats, currentStats);

    // store the current data for the next iteration
    this.previousStats = currentStats;
    this.frameTimeHistory = this.frameTimeHistory.slice(-2);
    this.fpsHistory = this.fpsHistory.slice(-2);

    return { performanceStats, delta, stats };
  };

  /**
   * Collects encode stats from the RTCPeerConnection.
   */
  private getEncodeStats = (
    currentStats: Record<string, RTCStats>,
  ): PerformanceStats[] => {
    const encodeStats: PerformanceStats[] = [];
    for (const rtp of Object.values(currentStats)) {
      if (rtp.type !== 'outbound-rtp') continue;

      const {
        codecId,
        framesSent = 0,
        kind,
        id,
        totalEncodeTime = 0,
        framesPerSecond = 0,
        frameHeight = 0,
        frameWidth = 0,
        targetBitrate = 0,
        mediaSourceId,
      } = rtp as RTCOutboundRtpStreamStats;

      if (kind === 'audio' || !this.previousStats[id]) continue;
      const prevRtp = this.previousStats[id] as RTCOutboundRtpStreamStats;

      const deltaTotalEncodeTime =
        totalEncodeTime - (prevRtp.totalEncodeTime || 0);
      const deltaFramesSent = framesSent - (prevRtp.framesSent || 0);
      const framesEncodeTime =
        deltaFramesSent > 0
          ? (deltaTotalEncodeTime / deltaFramesSent) * 1000
          : 0;

      this.frameTimeHistory.push(framesEncodeTime);
      this.fpsHistory.push(framesPerSecond);

      let trackType = TrackType.VIDEO;
      if (mediaSourceId && currentStats[mediaSourceId]) {
        const mediaSource = currentStats[mediaSourceId] as RTCMediaSourceStats;
        trackType =
          this.trackIdToTrackType.get(mediaSource.trackIdentifier) || trackType;
      }

      encodeStats.push({
        trackType,
        codec: getCodecFromStats(currentStats, codecId),
        avgFrameTimeMs: average(this.frameTimeHistory),
        avgFps: average(this.fpsHistory),
        targetBitrate: Math.round(targetBitrate),
        videoDimension: { width: frameWidth, height: frameHeight },
      });
    }

    return encodeStats;
  };

  /**
   * Collects decode stats from the RTCPeerConnection.
   */
  private getDecodeStats = (
    currentStats: Record<string, RTCStats>,
  ): PerformanceStats[] => {
    let rtp: RTCInboundRtpStreamStats | undefined = undefined;
    let max = 0;
    for (const item of Object.values(currentStats)) {
      if (item.type !== 'inbound-rtp') continue;
      const rtpItem = item as RTCInboundRtpStreamStats;
      const { kind, frameWidth = 0, frameHeight = 0 } = rtpItem;
      const area = frameWidth * frameHeight;
      if (kind === 'video' && area > max) {
        rtp = rtpItem;
        max = area;
      }
    }

    if (!rtp || !this.previousStats[rtp.id]) return [];
    const prevRtp = this.previousStats[rtp.id] as RTCInboundRtpStreamStats;

    const {
      framesDecoded = 0,
      framesPerSecond = 0,
      totalDecodeTime = 0,
      trackIdentifier,
    } = rtp;
    const deltaTotalDecodeTime =
      totalDecodeTime - (prevRtp.totalDecodeTime || 0);
    const deltaFramesDecoded = framesDecoded - (prevRtp.framesDecoded || 0);

    const framesDecodeTime =
      deltaFramesDecoded > 0
        ? (deltaTotalDecodeTime / deltaFramesDecoded) * 1000
        : 0;

    this.frameTimeHistory.push(framesDecodeTime);
    this.fpsHistory.push(framesPerSecond);

    const trackType =
      this.trackIdToTrackType.get(trackIdentifier) || TrackType.VIDEO;

    return [
      PerformanceStats.create({
        trackType,
        codec: getCodecFromStats(currentStats, rtp.codecId),
        avgFrameTimeMs: average(this.frameTimeHistory),
        avgFps: average(this.fpsHistory),
        videoDimension: { width: rtp.frameWidth, height: rtp.frameHeight },
      }),
    ];
  };

  /**
   * Applies cost overrides to the performance stats.
   * This is used to override the default encode/decode times with custom values.
   * This is useful for testing and debugging purposes, and it shouldn't be used in production.
   */
  private withOverrides = (
    performanceStats: PerformanceStats[],
  ): PerformanceStats[] => {
    if (this.costOverrides) {
      for (const s of performanceStats) {
        const override = this.costOverrides.get(s.trackType);
        if (override !== undefined) {
          // override the average encode/decode time with the provided cost.
          // format: [override].[original-frame-time]
          s.avgFrameTimeMs = override + (s.avgFrameTimeMs || 0) / 1000;
        }
      }
    }
    return performanceStats;
  };

  /**
   * Set the encode/decode cost for a specific track type.
   * This is used to override the default encode/decode times with custom values.
   * This is useful for testing and debugging purposes, and it shouldn't be used in production.
   *
   * @internal
   */
  setCost = (cost: number, trackType = TrackType.VIDEO) => {
    if (!this.costOverrides) this.costOverrides = new Map();
    this.costOverrides.set(trackType, cost);
  };
}

/**
 * Convert the stat report to an object.
 *
 * @param report the stat report to convert.
 */
const toObject = (report: RTCStatsReport): Record<string, RTCStats> => {
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
const deltaCompression = (
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
  const values = Object.values(newStats);
  for (const report of values) {
    if (report.timestamp > timestamp) {
      timestamp = report.timestamp;
    }
  }
  for (const report of values) {
    if (report.timestamp === timestamp) {
      report.timestamp = 0;
    }
  }
  newStats.timestamp = timestamp;
  return newStats;
};

/**
 * Calculates an average value.
 */
const average = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

/**
 * Create a Codec object from the codec stats.
 *
 * @param stats the stats report.
 * @param codecId the codec ID to look for.
 */
const getCodecFromStats = (
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
