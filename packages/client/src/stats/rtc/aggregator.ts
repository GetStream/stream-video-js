import {
  Codec,
  DecodeStats,
  EncodeStats,
  TrackType,
} from '../../gen/video/sfu/models/models';

// not yet part of the TS Library
type RTCCodecStats = {
  id: string;
  timestamp: number;
  type: 'codec';
  clockRate?: number;
  mimeType: string;
  payloadType: number;
  sdpFmtpLine?: string;
  transportId?: string;
};

/**
 * Prepares EncodeStats data from the provided RTCStats.
 *
 * @param lastStats the last-reported stats.
 * @param stats the RTCStats to process.
 * @param lastEncodeStats the last-reported encode stats.
 * @param iteration the current iteration number.
 */
export const getEncodeStats = (
  lastStats: Record<string, RTCStats>,
  stats: Record<string, RTCStats>,
  lastEncodeStats: EncodeStats[],
  iteration: number,
): EncodeStats[] => {
  const encodeStats: EncodeStats[] = [];
  for (const rtp of Object.values(stats)) {
    if (rtp.type !== 'outbound-rtp') continue;

    const {
      codecId,
      framesSent = 0,
      kind,
      id,
      totalEncodeTime = 0,
      framesPerSecond = 0,
    } = rtp as RTCOutboundRtpStreamStats;
    if (kind === 'audio') continue;

    const prevRtp = lastStats[id] as RTCOutboundRtpStreamStats | undefined;
    if (!prevRtp) continue;

    const deltaTotalEncodeTime =
      totalEncodeTime - (prevRtp.totalEncodeTime || 0);
    const deltaFramesSent = framesSent - (prevRtp.framesSent || 0);
    const framesEncodeTime =
      deltaFramesSent > 0 ? (deltaTotalEncodeTime / deltaFramesSent) * 1000 : 0;

    const { avgFrameEncodeTimeMs: encodeTime = 0, avgFps = framesPerSecond } =
      lastEncodeStats.find((s) => s.trackType === TrackType.VIDEO) || {};
    encodeStats.push({
      trackType: TrackType.VIDEO,
      codec: getCodec(stats, codecId),
      avgFrameEncodeTimeMs: average(encodeTime, framesEncodeTime, iteration),
      avgFps: average(avgFps, framesPerSecond, iteration),
    });
  }

  return encodeStats;
};

/**
 * Prepares DecodeStats data from the provided RTCStats.
 *
 * @param lastStats the last-reported stats.
 * @param stats the RTCStats to process.
 * @param lastDecodeStats the last-reported decode stats.
 * @param iteration the current iteration number.
 */
export const getDecodeStats = (
  lastStats: Record<string, RTCStats>,
  stats: Record<string, RTCStats>,
  lastDecodeStats: DecodeStats[],
  iteration: number,
): DecodeStats[] => {
  let rtp: RTCInboundRtpStreamStats | undefined = undefined;
  let max = 0;
  for (const item of Object.values(stats)) {
    if (item.type !== 'inbound-rtp') continue;
    const rtpItem = item as RTCInboundRtpStreamStats;
    const { kind, frameWidth = 0, frameHeight = 0 } = rtpItem;
    const area = frameWidth * frameHeight;
    if (kind === 'video' && area > max) {
      rtp = rtpItem;
      max = area;
    }
  }
  if (!rtp) return [];

  const prevRtp = lastStats[rtp.id] as RTCInboundRtpStreamStats | undefined;
  if (!prevRtp) return [];

  const { framesDecoded = 0, framesPerSecond = 0, totalDecodeTime = 0 } = rtp;
  const deltaTotalDecodeTime = totalDecodeTime - (prevRtp.totalDecodeTime || 0);
  const deltaFramesDecoded = framesDecoded - (prevRtp.framesDecoded || 0);

  const framesDecodeTime =
    deltaFramesDecoded > 0
      ? (deltaTotalDecodeTime / deltaFramesDecoded) * 1000
      : 0;

  const { avgFrameDecodeTimeMs: decodeTime = 0, avgFps = framesPerSecond } =
    lastDecodeStats.find((s) => s.trackType === TrackType.VIDEO) || {};

  return [
    DecodeStats.create({
      trackType: TrackType.VIDEO,
      codec: getCodec(stats, rtp.codecId),
      avgFrameDecodeTimeMs: average(decodeTime, framesDecodeTime, iteration),
      avgFps: average(avgFps, framesPerSecond, iteration),
      videoDimension: { width: rtp.frameWidth, height: rtp.frameHeight },
    }),
  ];
};

/**
 * Based on Welford’s method for calculating variance of an infinite sequence.
 *
 * @param currentAverage current average.
 * @param currentValue current value.
 * @param n current sequence index.
 */
const average = (currentAverage: number, currentValue: number, n: number) => {
  return currentAverage + (currentValue - currentAverage) / n;
};

const getCodec = (
  stats: Record<string, RTCStats>,
  codecId: string | undefined,
): Codec | undefined => {
  if (!codecId || !stats[codecId]) return undefined;
  const codecStats = stats[codecId] as RTCCodecStats;
  return Codec.create({
    name: codecStats.mimeType,
    clockRate: codecStats.clockRate,
    payloadType: codecStats.payloadType,
    fmtp: codecStats.sdpFmtpLine,
  });
};
