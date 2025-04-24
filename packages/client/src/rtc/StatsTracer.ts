import {
  Codec,
  PeerType,
  PerformanceStats,
  TrackType,
} from '../gen/video/sfu/models/models';
import type { RTCCodecStats, RTCMediaSourceStats } from '../stats';

export class StatsTracer {
  private readonly pc: RTCPeerConnection;
  private readonly peerType: PeerType;
  private readonly trackIdToTrackType: Map<string, TrackType>;

  private costOverrides?: Map<TrackType, number>;

  private previousStats: Record<string, RTCStats> = {};
  private lastPerformanceStats: PerformanceStats[] = [];
  private iteration = 1;

  constructor(
    pc: RTCPeerConnection,
    peerType: PeerType,
    trackIdToTrackType: Map<string, TrackType>,
  ) {
    this.pc = pc;
    this.peerType = peerType;
    this.trackIdToTrackType = trackIdToTrackType;
  }

  get = async () => {
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
    this.lastPerformanceStats = performanceStats;

    return { performanceStats, delta, stats };
  };

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

      let trackType = TrackType.VIDEO;
      if (mediaSourceId && currentStats[mediaSourceId]) {
        const mediaSource = currentStats[mediaSourceId] as RTCMediaSourceStats;
        trackType =
          this.trackIdToTrackType.get(mediaSource.trackIdentifier) || trackType;
      }

      const { avgFrameTimeMs = 0, avgFps = framesPerSecond } =
        this.lastPerformanceStats.find((s) => s.trackType === trackType) || {};
      encodeStats.push({
        trackType,
        codec: getCodecFromStats(currentStats, codecId),
        avgFrameTimeMs: average(
          avgFrameTimeMs,
          framesEncodeTime,
          this.iteration,
        ),
        avgFps: average(avgFps, framesPerSecond, this.iteration),
        videoDimension: { width: frameWidth, height: frameHeight },
      });
    }

    return encodeStats;
  };

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

    const trackType =
      this.trackIdToTrackType.get(trackIdentifier) || TrackType.VIDEO;
    const { avgFrameTimeMs = 0, avgFps = framesPerSecond } =
      this.lastPerformanceStats.find((s) => s.trackType === trackType) || {};

    return [
      PerformanceStats.create({
        trackType,
        codec: getCodecFromStats(currentStats, rtp.codecId),
        avgFrameTimeMs: average(
          avgFrameTimeMs,
          framesDecodeTime,
          this.iteration,
        ),
        avgFps: average(avgFps, framesPerSecond, this.iteration),
        videoDimension: { width: rtp.frameWidth, height: rtp.frameHeight },
      }),
    ];
  };

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
const average = (currentAverage: number, currentValue: number, n: number) =>
  currentAverage + (currentValue - currentAverage) / n;

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
