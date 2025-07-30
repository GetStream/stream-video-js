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
   * Delta between the current stats and the previous stats.
   */
  delta: Record<any, any>;
  /**
   * The current iteration of the stats.
   */
  performanceStats: PerformanceStats[];
};
