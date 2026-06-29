import type { PerformanceStats } from '../../gen/video/sfu/models/models';

export type RTCStatsDataType =
  | RTCConfiguration
  | RTCIceCandidate
  | RTCSignalingState
  | RTCIceConnectionState
  | RTCIceGatheringState
  | RTCPeerConnectionState
  | [number | null | string] // RTCDataChannelEvent
  | string
  | boolean
  | RTCOfferOptions
  | [string | RTCDataChannelInit | undefined] // createDataChannel
  | (RTCOfferOptions | undefined) // createOffer | createAnswer
  | RTCSessionDescriptionInit
  | (RTCIceCandidateInit | RTCIceCandidate) // addIceCandidate
  | object
  | number
  | null
  | undefined;

export type TraceKey = 'device-enumeration' | (string & {});
export type Trace = (tag: string, data: RTCStatsDataType) => void;

export type TraceRecord = [
  tag: string,
  id: string | null,
  data: RTCStatsDataType,
  timestamp: number,
];

export type TraceSlice = {
  snapshot: TraceRecord[];
  rollback: () => void;
};

export type ComputedStats = {
  /**
   * Current stats from the RTCPeerConnection.
   */
  stats: RTCStatsReport;
  /**
   * The current iteration of the stats.
   */
  performanceStats: PerformanceStats[];
};

/**
 * A single, not-yet-delivered delta-compressed stats sample.
 * The `delta` is computed against the immediately preceding sample, so a
 * sequence of `PendingDelta`s forms a chain that the server applies in order
 * onto its running accumulator. `ts` is the wall-clock time the sample was taken.
 */
export type PendingDelta = {
  delta: Record<any, any>;
  ts: number;
};
