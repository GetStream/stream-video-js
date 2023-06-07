export type BaseStats = {
  bytesSent?: number;
  bytesReceived?: number;
  codec?: string;
  currentRoundTripTime?: number;
  frameWidth?: number;
  frameHeight?: number;
  framesPerSecond?: number;
  jitter?: number;
  kind?: string;
  qualityLimitationReason?: string;
  rid?: string;
  ssrc?: number;
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
