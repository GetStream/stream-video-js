export type LiveCallStatsMessage = {
  type: 'heartbeat' | 'snapshot' | 'stats' | 'warning';
  sfu_id?: string;
  user_id?: string;
  user_session_id?: string;
  unified_user_session_id?: string;
  payload?: string;
  timestamp: number;
};

export type ParticipantDiagnostics = {
  userId: string;
  userSessionId: string;
  sfuId?: string;
  updatedAt: number;
  connectionState?: string;
  roundTripTimeMs?: number;
  publishBitrate?: number;
  receiveBitrate?: number;
  publishPacketLossPercent?: number;
  receivePacketLossPercent?: number;
  publishJitterMs?: number;
  receiveJitterMs?: number;
  videoCodec?: string;
  publishResolution?: string;
  receiveResolution?: string;
  publishFps?: number;
  receiveFps?: number;
  qualityLimitationReason?: string;
};

export const getParticipantDiagnosticsKey = (
  userId: string,
  userSessionId: string,
) => JSON.stringify([userId, userSessionId]);

type StatsReport = Record<string, unknown>;
type StatsById = Record<string, StatsReport>;
type TraceRecord = [string, string | null, unknown, number];

type CounterSample = {
  bytes: number;
  timestamp: number;
};

export const createRtcStatsProcessor = () => {
  const peerConnectionStats = new Map<string, Map<string, StatsById>>();
  const diagnostics = new Map<string, ParticipantDiagnostics>();
  const counters = new Map<string, CounterSample>();
  const seenRecords = new Set<string>();

  const process = (
    message: LiveCallStatsMessage,
  ): ParticipantDiagnostics | undefined => {
    const userId = message.user_id;
    const userSessionId =
      message.user_session_id || message.unified_user_session_id;
    if (!userId || !userSessionId || !message.payload) return undefined;
    const participantKey = getParticipantDiagnosticsKey(userId, userSessionId);

    const current = diagnostics.get(participantKey) ?? {
      userId,
      userSessionId,
      updatedAt: message.timestamp,
    };
    current.sfuId = message.sfu_id || current.sfuId;

    for (const line of message.payload.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const recordKey = `${participantKey}:${trimmed}`;
      if (seenRecords.has(recordKey)) continue;
      seenRecords.add(recordKey);
      if (seenRecords.size > 50_000) seenRecords.clear();

      let record: TraceRecord;
      try {
        record = JSON.parse(trimmed) as TraceRecord;
      } catch {
        continue;
      }
      const [tag, peerConnectionId, value, timestamp] = record;
      current.updatedAt = Math.max(
        current.updatedAt,
        Number(timestamp) || message.timestamp,
      );

      if (
        tag.toLowerCase() === 'connectionstatechange' &&
        typeof value === 'string'
      ) {
        current.connectionState = value;
      }
      if (
        tag.toLowerCase() !== 'getstats' ||
        !peerConnectionId ||
        !isRecord(value)
      ) {
        continue;
      }

      const participantStats =
        peerConnectionStats.get(participantKey) ?? new Map<string, StatsById>();
      peerConnectionStats.set(participantKey, participantStats);
      const base = participantStats.get(peerConnectionId) ?? {};
      participantStats.set(peerConnectionId, base);
      decompressStats(base, value);

      if (peerConnectionId.endsWith('-pub')) {
        updatePublisherDiagnostics(
          current,
          base,
          Number(timestamp) || message.timestamp,
          counters,
        );
      } else if (peerConnectionId.endsWith('-sub')) {
        updateSubscriberDiagnostics(
          current,
          base,
          Number(timestamp) || message.timestamp,
          counters,
        );
      }
    }

    diagnostics.set(participantKey, current);
    return { ...current };
  };

  return { process };
};

const decompressStats = (base: StatsById, delta: StatsReport) => {
  const envelopeTimestamp = asNumber(delta.timestamp);
  for (const [id, value] of Object.entries(delta)) {
    if (id === 'timestamp' || !isRecord(value)) continue;
    const previous = base[id] ?? {};
    const deltaTimestamp = asNumber(value.timestamp);
    const reportTimestamp =
      value.timestamp === 0
        ? envelopeTimestamp
        : deltaTimestamp || asNumber(previous.timestamp) || envelopeTimestamp;
    base[id] = {
      ...previous,
      ...value,
      ...(reportTimestamp ? { timestamp: reportTimestamp } : {}),
    };
  }
};

const updatePublisherDiagnostics = (
  current: ParticipantDiagnostics,
  stats: StatsById,
  timestamp: number,
  counters: Map<string, CounterSample>,
) => {
  const reports = Object.values(stats);
  const outbound = reports.filter((report) => report.type === 'outbound-rtp');
  const video = outbound.filter((report) => report.kind === 'video');
  const remoteInbound = reports.filter(
    (report) => report.type === 'remote-inbound-rtp',
  );

  current.publishBitrate = calculateBitrate(
    `${getParticipantDiagnosticsKey(current.userId, current.userSessionId)}:publish`,
    sum(outbound, 'bytesSent'),
    timestamp,
    counters,
    current.publishBitrate,
  );
  current.publishPacketLossPercent = packetLossPercent(remoteInbound);
  current.publishJitterMs = max(remoteInbound, 'jitter', 1000);
  current.roundTripTimeMs =
    max(remoteInbound, 'roundTripTime', 1000) ??
    candidateRoundTripTime(reports) ??
    current.roundTripTimeMs;
  current.publishResolution = resolution(video) ?? current.publishResolution;
  current.publishFps = max(video, 'framesPerSecond') ?? current.publishFps;
  current.videoCodec = codec(video, stats) ?? current.videoCodec;
  current.qualityLimitationReason =
    asString(
      video.find((report) => report.qualityLimitationReason)
        ?.qualityLimitationReason,
    ) ?? current.qualityLimitationReason;
};

const updateSubscriberDiagnostics = (
  current: ParticipantDiagnostics,
  stats: StatsById,
  timestamp: number,
  counters: Map<string, CounterSample>,
) => {
  const reports = Object.values(stats);
  const inbound = reports.filter((report) => report.type === 'inbound-rtp');
  const video = inbound.filter((report) => report.kind === 'video');

  current.receiveBitrate = calculateBitrate(
    `${getParticipantDiagnosticsKey(current.userId, current.userSessionId)}:receive`,
    sum(inbound, 'bytesReceived'),
    timestamp,
    counters,
    current.receiveBitrate,
  );
  current.receivePacketLossPercent = packetLossPercent(inbound);
  current.receiveJitterMs = max(inbound, 'jitter', 1000);
  current.roundTripTimeMs =
    candidateRoundTripTime(reports) ?? current.roundTripTimeMs;
  current.receiveResolution = resolution(video) ?? current.receiveResolution;
  current.receiveFps = max(video, 'framesPerSecond') ?? current.receiveFps;
};

const calculateBitrate = (
  key: string,
  bytes: number,
  timestamp: number,
  counters: Map<string, CounterSample>,
  previousBitrate?: number,
) => {
  const previous = counters.get(key);
  counters.set(key, { bytes, timestamp });
  if (!previous || timestamp <= previous.timestamp || bytes < previous.bytes) {
    return previousBitrate;
  }
  return (
    ((bytes - previous.bytes) * 8 * 1000) / (timestamp - previous.timestamp)
  );
};

const packetLossPercent = (reports: StatsReport[]) => {
  const lost = sum(reports, 'packetsLost');
  const received = sum(reports, 'packetsReceived');
  const total = lost + received;
  return total > 0 ? (lost / total) * 100 : undefined;
};

const candidateRoundTripTime = (reports: StatsReport[]) => {
  const candidate = reports.find(
    (report) =>
      report.type === 'candidate-pair' &&
      (report.nominated === true ||
        report.selected === true ||
        report.state === 'succeeded'),
  );
  return candidate
    ? asNumber(candidate.currentRoundTripTime) * 1000
    : undefined;
};

const resolution = (reports: StatsReport[]) => {
  let best: StatsReport | undefined;
  for (const report of reports) {
    if (
      asNumber(report.frameWidth) * asNumber(report.frameHeight) >
      asNumber(best?.frameWidth) * asNumber(best?.frameHeight)
    ) {
      best = report;
    }
  }
  const width = asNumber(best?.frameWidth);
  const height = asNumber(best?.frameHeight);
  return width && height ? `${width}×${height}` : undefined;
};

const codec = (reports: StatsReport[], stats: StatsById) => {
  for (const report of reports) {
    const codecId = asString(report.codecId);
    const mimeType = codecId && asString(stats[codecId]?.mimeType);
    if (mimeType) return mimeType.replace(/^video\//, '').toUpperCase();
  }
  return undefined;
};

const sum = (reports: StatsReport[], field: string) =>
  reports.reduce((total, report) => total + asNumber(report[field]), 0);

const max = (reports: StatsReport[], field: string, multiplier = 1) => {
  const values = reports
    .map((report) => asNumber(report[field]) * multiplier)
    .filter((value) => Number.isFinite(value) && value > 0);
  return values.length > 0 ? Math.max(...values) : undefined;
};

const asNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const asString = (value: unknown) =>
  typeof value === 'string' && value ? value : undefined;

const isRecord = (value: unknown): value is StatsReport =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
