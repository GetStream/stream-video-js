export type BaseStats = {
  bytesSent?: number;
  bytesReceived?: number;
  codec?: string;
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
  qualityLimitationReasons: string;
  highestFrameWidth: number;
  highestFrameHeight: number;
  highestFramesPerSecond: number;
  timestamp: number;
};

export type ParticipantsStatsReport = {
  [sessionId: string]: StatsReport[] | undefined;
};

export type CallStatsReport = {
  datacenter: string;
  latencyInMs: number;
  publisherStats: AggregatedStatsReport;
  subscriberStats: AggregatedStatsReport;
  participants: ParticipantsStatsReport;
  timestamp: number;
};
