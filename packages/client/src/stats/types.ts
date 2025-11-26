import { TrackType } from '../gen/video/sfu/models/models';

export type BaseStats = {
  audioLevel?: number;
  bytesSent?: number;
  bytesReceived?: number;
  codec?: string;
  currentRoundTripTime?: number;
  frameWidth?: number;
  frameHeight?: number;
  framesPerSecond?: number;
  jitter?: number;
  kind?: string;
  mediaSourceId?: string;
  qualityLimitationReason?: string;
  rid?: string;
  ssrc?: number;
  trackType?: TrackType;
  concealedSamples?: number;
  concealmentEvents?: number;
  packetsReceived?: number;
  packetsLost?: number;
};

export type StatsReport = {
  rawStats?: RTCStatsReport;
  streams: BaseStats[];
  timestamp: number;
};

export type AudioAggregatedStats = {
  totalBytesSent: number;
  totalBytesReceived: number;
  averageJitterInMs: number;
  averageRoundTripTimeInMs: number;
  codec: string;
  codecPerTrackType: Partial<Record<TrackType, string>>;
  timestamp: number;
  totalConcealedSamples: number;
  totalConcealmentEvents: number;
  totalPacketsReceived: number;
  totalPacketsLost: number;
};

export type AggregatedStatsReport = {
  totalBytesSent: number;
  totalBytesReceived: number;
  averageJitterInMs: number;
  averageRoundTripTimeInMs: number;
  qualityLimitationReasons: string;
  highestFrameWidth: number;
  highestFrameHeight: number;
  highestFramesPerSecond: number;
  codec: string;
  codecPerTrackType: Partial<Record<TrackType, string>>;
  timestamp: number;
  rawReport: StatsReport;
};

export type ParticipantsStatsReport = {
  // sessionId -> stats for every available MediaStreamTrack
  [sessionId: string]: StatsReport[] | undefined;
};

export type CallStatsReport = {
  /**
   * The data center where the current participant is connected to.
   */
  datacenter: string;
  /**
   * Aggregated video stats for the publisher, which is the local participant.
   * Note: For audio stats, see publisherAudioStats.
   */
  publisherStats: AggregatedStatsReport;
  /**
   * Aggregated audio stats for the publisher, which is the local participant.
   * Includes bandwidth, latency, jitter, and codec information.
   */
  publisherAudioStats: AudioAggregatedStats;
  /**
   * Raw stats for the publisher, which is the local participant.
   * Holds the raw RTCStatsReport object provided by the WebRTC API.
   */
  publisherRawStats?: RTCStatsReport;
  /**
   * Aggregated video stats for the subscribers, which are all remote participants.
   * Note: For audio stats, see subscriberAudioStats.
   */
  subscriberStats: AggregatedStatsReport;
  /**
   * Aggregated audio stats for the subscribers, which are all remote participants.
   * Includes bandwidth, latency, jitter, and codec information.
   */
  subscriberAudioStats: AudioAggregatedStats;
  /**
   * Raw stats for the subscribers, which are all remote participants.
   * Holds the raw RTCStatsReport object provided by the WebRTC API.
   */
  subscriberRawStats?: RTCStatsReport;
  /**
   * Optional stats for individual participants.
   * Gets populated when an integrator asks for this through
   * `call.startReportingStatsFor(sessionId)` API.
   */
  participants: ParticipantsStatsReport;
  /**
   * Timestamp of the stats report.
   */
  timestamp: number;
};

// shim for RTCMediaSourceStats, not yet available in the standard types
// https://www.w3.org/TR/webrtc-stats/#mediasourcestats-dict*
export interface RTCMediaSourceStats {
  id: string;
  type: 'media-source';
  timestamp: number;
  kind: string;
  trackIdentifier: string;
  audioLevel?: number;
}

// shim for RTCCodecStats, not yet available in the standard types
export type RTCCodecStats = {
  id: string;
  timestamp: number;
  type: 'codec';
  clockRate?: number;
  mimeType: string;
  payloadType: number;
  sdpFmtpLine?: string;
  transportId?: string;
};
