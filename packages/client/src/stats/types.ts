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
};

export type StatsReport = {
  rawStats?: RTCStatsReport;
  streams: BaseStats[];
  timestamp: number;
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
  datacenter: string;
  publisherStats: AggregatedStatsReport;
  publisherRawStats?: RTCStatsReport;
  subscriberStats: AggregatedStatsReport;
  subscriberRawStats?: RTCStatsReport;
  participants: ParticipantsStatsReport;
  timestamp: number;
};

// shim for RTCMediaSourceStats, not yet available in the standard types
// https://www.w3.org/TR/webrtc-stats/#mediasourcestats-dict*
export interface RTCMediaSourceStats {
  kind: string;
  trackIdentifier: string;
}
