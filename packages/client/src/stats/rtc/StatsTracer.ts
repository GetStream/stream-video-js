import {
  Codec,
  InboundRtp,
  OutboundRtp,
  PerformanceStats,
  RemoteInboundRtp,
  RemoteOutboundRtp,
  TrackType,
} from '../../gen/video/sfu/models/models';
import type {
  RTCCodecStats,
  RTCMediaSourceStats,
  RTCRemoteInboundRtpStreamStats,
  RTCRemoteOutboundRtpStreamStats,
} from '../types';
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
  private readonly trackIdToTrackType: Map<string, TrackType>;

  private previousStats: Record<string, RTCStats> = {};
  private frameTimeHistory: number[] = [];
  private fpsHistory: number[] = [];

  /**
   * Creates a new StatsTracer instance.
   */
  constructor(
    pc: RTCPeerConnection,
    trackIdToTrackType: Map<string, TrackType>,
  ) {
    this.pc = pc;
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
    const previousStats = this.previousStats;
    const delta = deltaCompression(previousStats, currentStats);

    // store the current data for the next iteration
    this.previousStats = currentStats;
    this.frameTimeHistory = this.frameTimeHistory.slice(-2);
    this.fpsHistory = this.fpsHistory.slice(-2);

    return { delta, stats, currentStats, previousStats };
  };

  /**
   * Collects encode stats from the RTCPeerConnection.
   *
   * @deprecated replaced with the new sendMetrics endpoint.
   */
  getEncodeStats = (
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
   *
   * @deprecated replaced with the new sendMetrics endpoint.
   */
  getDecodeStats = (
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
   * Get metrics for the SendMetricsRequest.
   * Returns populated SendMetricsRequest with outbound-rtp and remote-inbound-rtp.
   * Collects both stat types in a single loop for optimal performance.
   *
   * @internal
   */
  getPublisherMetrics = (
    currentStats: Record<string, RTCStats>,
    previousStats: Record<string, RTCStats>,
  ) => {
    const outbound: OutboundRtp[] = [];
    const remoteInbound: RemoteInboundRtp[] = [];
    for (const rtp of Object.values(currentStats)) {
      if (rtp.type === 'outbound-rtp') {
        outbound.push(
          processOutboundRtpStat(
            rtp as RTCOutboundRtpStreamStats,
            previousStats,
          ),
        );
      } else if (rtp.type === 'remote-inbound-rtp') {
        remoteInbound.push(
          processRemoteInboundRtpStat(rtp as RTCRemoteInboundRtpStreamStats),
        );
      }
    }
    return { outbound, remoteInbound };
  };

  /**
   * Get metrics for the SendMetricsRequest.
   * Returns populated SendMetricsRequest with inbound-rtp and remote-outbound-rtp stats.
   * Collects both stat types in a single loop for optimal performance.
   *
   * @internal
   */
  getSubscriberMetrics = (
    currentStats: Record<string, RTCStats>,
    previousStats: Record<string, RTCStats>,
  ) => {
    const inbound: InboundRtp[] = [];
    const remoteOutbound: RemoteOutboundRtp[] = [];
    for (const rtp of Object.values(currentStats)) {
      if (rtp.type === 'inbound-rtp') {
        inbound.push(
          processInboundRtpStat(rtp as RTCInboundRtpStreamStats, previousStats),
        );
      } else if (rtp.type === 'remote-outbound-rtp') {
        remoteOutbound.push(
          processRemoteOutboundRtpStat(rtp as RTCRemoteOutboundRtpStreamStats),
        );
      }
    }
    return { inbound, remoteOutbound };
  };
}

/**
 * Process an outbound-rtp stat and return the OutboundRtp object.
 *
 * @param stat the outbound RTP stream stats.
 * @param previousStats the previous stats to calculate deltas.
 */
const processOutboundRtpStat = (
  stat: RTCOutboundRtpStreamStats,
  previousStats: Record<string, RTCStats>,
): OutboundRtp => {
  const {
    kind,
    ssrc,
    timestamp,
    bytesSent = 0,
    framesEncoded = 0,
    totalEncodeTime = 0,
    frameWidth = 0,
    frameHeight = 0,
    id,
  } = stat;

  let fps = 0;
  if (previousStats[id]) {
    const prevStat = previousStats[id] as RTCOutboundRtpStreamStats;
    const deltaFrames = framesEncoded - (prevStat.framesEncoded || 0);
    const deltaTime = (timestamp - prevStat.timestamp) / 1000;
    // Spec: delta(framesEncoded)/delta(time); ignore if deltaTime <= 0 or counters decreased
    fps = Math.round(
      deltaTime > 0 && deltaFrames >= 0 ? deltaFrames / deltaTime : 0,
    );
  }

  // Spec: totalEncodeTime / max(1, framesEncoded)
  const avgEncodeTimeSeconds = totalEncodeTime / Math.max(1, framesEncoded);

  let bitrateBps = 0;
  if (previousStats[id]) {
    const prevStat = previousStats[id] as RTCOutboundRtpStreamStats;
    const deltaBytes = bytesSent - (prevStat.bytesSent || 0);
    const deltaTime = (timestamp - prevStat.timestamp) / 1000;
    // Spec: delta(bytesSent)*8 / delta(timeSeconds); ignore if delta <= 0
    bitrateBps = Math.round(
      deltaTime > 0 && deltaBytes > 0 ? (deltaBytes * 8) / deltaTime : 0,
    );
  }

  // Calculate min dimension
  const minDimensionPx =
    kind === 'video' ? Math.min(frameWidth, frameHeight) : 0;

  return {
    base: { ssrc, kind, timestampMs: timestamp },
    fps,
    avgEncodeTimeSeconds,
    bitrateBps,
    minDimensionPx,
  };
};

/**
 * Process an inbound-rtp stat and return the InboundRtp object.
 *
 * @param stat the inbound RTP stream stats.
 * @param previousStats the previous stats to calculate deltas.
 */
const processInboundRtpStat = (
  stat: RTCInboundRtpStreamStats,
  previousStats: Record<string, RTCStats>,
): InboundRtp => {
  const {
    kind,
    ssrc,
    timestamp,
    jitter = 0,
    packetsReceived = 0,
    packetsLost = 0,
    concealmentEvents = 0,
    concealedSamples = 0,
    totalSamplesReceived = 0,
    framesDecoded = 0,
    totalDecodeTime = 0,
    totalFreezesDuration = 0,
    frameWidth = 0,
    frameHeight = 0,
    id,
  } = stat;

  // Spec: (packets_lost / (packets_received + packets_lost)) * 100;
  // skip if denominator <= 0 or counters decreased
  const totalPackets = packetsReceived + packetsLost;
  let countersDecreased = false;
  if (previousStats[id]) {
    const prev = previousStats[id] as RTCInboundRtpStreamStats;
    countersDecreased =
      packetsReceived < (prev.packetsReceived || 0) ||
      packetsLost < (prev.packetsLost || 0);
  }
  const packetLossPercent =
    totalPackets > 0 && !countersDecreased
      ? (packetsLost / totalPackets) * 100
      : 0;

  // Calculate concealment percentage (only if sufficient samples)
  const concealmentPercent =
    totalSamplesReceived >= 96000
      ? (concealedSamples / totalSamplesReceived) * 100
      : 0;

  // Spec: use delta(framesDecoded)/delta(time) with prev sample
  let fps = 0;
  if (previousStats[id]) {
    const prevStat = previousStats[id] as RTCInboundRtpStreamStats;
    const deltaFrames = framesDecoded - (prevStat.framesDecoded || 0);
    const deltaTime = (timestamp - prevStat.timestamp) / 1000;
    fps = Math.round(
      deltaTime > 0 && deltaFrames >= 0 ? deltaFrames / deltaTime : 0,
    );
  }

  // Spec: totalDecodeTime / max(1, framesDecoded)
  const avgDecodeTimeSeconds = totalDecodeTime / Math.max(1, framesDecoded);

  const minDimensionPx =
    kind === 'video' ? Math.min(frameWidth, frameHeight) : 0;

  return {
    base: { ssrc, kind, timestampMs: timestamp },
    jitterSeconds: jitter,
    packetsReceived: packetsReceived.toString(),
    packetsLost: packetsLost.toString(),
    packetLossPercent,
    concealmentEvents,
    concealmentPercent,
    fps,
    freezeDurationSeconds: totalFreezesDuration,
    avgDecodeTimeSeconds,
    minDimensionPx,
  };
};

/**
 * Process a remote-inbound-rtp stat and return the RemoteInboundRtp object.
 *
 * @param stat the remote inbound RTP stream stats.
 */
const processRemoteInboundRtpStat = (
  stat: RTCRemoteInboundRtpStreamStats,
): RemoteInboundRtp => {
  const { kind, ssrc, timestamp, jitter = 0, roundTripTime = 0 } = stat;
  return {
    base: { ssrc, kind, timestampMs: timestamp },
    jitterSeconds: jitter,
    roundTripTimeS: roundTripTime,
  };
};

/**
 * Process a remote-outbound-rtp stat and return the RemoteOutboundRtp object.
 *
 * @param stat the remote outbound RTP stream stats.
 */
const processRemoteOutboundRtpStat = (
  stat: RTCRemoteOutboundRtpStreamStats,
): RemoteOutboundRtp => {
  const { kind, ssrc, timestamp, roundTripTime = 0 } = stat;
  return {
    base: { ssrc, kind, timestampMs: timestamp },
    jitterSeconds: 0, // Remote outbound may not have jitter
    roundTripTimeS: roundTripTime,
  };
};

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
