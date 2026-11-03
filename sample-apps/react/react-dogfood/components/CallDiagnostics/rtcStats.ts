export type LiveCallStatsMessage = {
  type: 'heartbeat' | 'snapshot' | 'stats' | 'warning';
  sfu_id?: string;
  user_id?: string;
  user_session_id?: string;
  unified_user_session_id?: string;
  payload?: string;
  timestamp: number;
};

export type AudioDiagnosticEventType =
  | 'audio-context'
  | 'bluetooth-profile'
  | 'capture-lifecycle'
  | 'input-device'
  | 'microphone-capture'
  | 'noise-cancellation'
  | 'output-device'
  | 'playback'
  | 'receiver-stall';

export type AudioDiagnosticEvent = {
  id: string;
  type: AudioDiagnosticEventType;
  label: string;
  detail?: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
};

export type InboundAudioDiagnostics = {
  publisherUserId: string;
  publisherSessionId: string;
  publisherUnifiedSessionId?: string;
  ssrc: number;
  bitrate?: number;
  packetsPerSecond?: number;
  packetLossPercent?: number;
  jitterMs?: number;
  audioLevel?: number;
  audioEnergyDelta?: number;
  concealedSamplesDelta?: number;
  concealmentEventsDelta?: number;
  jitterBufferDelayMs?: number;
  updatedAt: number;
};

export type PlaybackAudioDiagnostics = {
  publisherSessionId: string;
  route?: string;
  trackId?: string;
  trackSampleRate?: number;
  channelCount?: number;
  contextState?: string;
  contextSampleRate?: number;
  contextCurrentTime?: number;
  contextOutputLatency?: number;
  elementCurrentTime?: number;
  elementClockAdvance?: number;
  elementClockStalledRatio?: number;
  longestClockStallMs?: number;
  elementPaused?: boolean;
  elementReadyState?: number;
  averageLevel?: number;
  peakLevel?: number;
  silentRatio?: number;
  longestSilenceMs?: number;
  updatedAt: number;
};

export type BluetoothProfileDiagnostics = {
  state: 'call-audio' | 'media-playback' | 'transitioning';
  confidence: number;
  deviceLabel: string;
  evidence: string[];
  observedAt: number;
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
  publishAudioBitrate?: number;
  publishAudioPacketsPerSecond?: number;
  publishAudioLevel?: number;
  publishAudioEnergyDelta?: number;
  micCapturesAudio?: boolean;
  microphoneDeviceId?: string;
  microphoneLabel?: string;
  microphoneSampleRate?: number;
  microphoneCaptureState?: string;
  noiseCancellationEnabled?: boolean;
  noiseCancellationState?: string;
  krispAudioContextState?: string;
  krispAudioContextSampleRate?: number;
  playbackAudioContextState?: string;
  playbackAudioContextSampleRate?: number;
  playbackAudioContextOutputLatency?: number;
  bluetoothProfile?: BluetoothProfileDiagnostics;
  outputDeviceId?: string;
  inboundAudioByPublisher: Record<string, InboundAudioDiagnostics>;
  playbackAudioByPublisher: Record<string, PlaybackAudioDiagnostics>;
  audioEvents: AudioDiagnosticEvent[];
};

export const getParticipantDiagnosticsKey = (
  userId: string,
  userSessionId: string,
) => JSON.stringify([userId, userSessionId]);

export const getInboundAudioForPublisher = (
  report: ParticipantDiagnostics | undefined,
  publisherUserId: string,
  publisherSessionId: string,
) => {
  if (!report) return undefined;
  const direct =
    report.inboundAudioByPublisher[
      getParticipantDiagnosticsKey(publisherUserId, publisherSessionId)
    ];
  if (direct) return direct;
  return Object.values(report.inboundAudioByPublisher).find(
    (audio) =>
      audio.publisherUserId === publisherUserId &&
      (audio.publisherSessionId === publisherSessionId ||
        audio.publisherUnifiedSessionId === publisherSessionId),
  );
};

export const getPlaybackAudioForPublisher = (
  report: ParticipantDiagnostics | undefined,
  publisherUserId: string,
  publisherSessionId: string,
) => {
  if (!report) return undefined;
  const direct = report.playbackAudioByPublisher[publisherSessionId];
  if (direct) return direct;
  const inbound = getInboundAudioForPublisher(
    report,
    publisherUserId,
    publisherSessionId,
  );
  return (
    report.playbackAudioByPublisher[inbound?.publisherSessionId ?? ''] ??
    report.playbackAudioByPublisher[inbound?.publisherUnifiedSessionId ?? '']
  );
};

type StatsReport = Record<string, unknown>;
type StatsById = Record<string, StatsReport>;
type TraceRecord = [string, string | null, unknown, number];

type CounterSample = {
  value: number;
  timestamp: number;
};

type TrackMapping = {
  direction: string;
  ssrc: number;
  trackType: string;
  participant: {
    userId: string;
    sessionId: string;
    unifiedSessionId?: string;
  };
};

export const createRtcStatsProcessor = () => {
  const peerConnectionStats = new Map<string, Map<string, StatsById>>();
  const diagnostics = new Map<string, ParticipantDiagnostics>();
  const counters = new Map<string, CounterSample>();
  const trackMappings = new Map<string, Map<number, TrackMapping>>();
  const seenRecords = new Set<string>();

  const process = (
    message: LiveCallStatsMessage,
  ): ParticipantDiagnostics | undefined => {
    const userId = message.user_id;
    const userSessionId =
      message.user_session_id || message.unified_user_session_id;
    if (!userId || !userSessionId || !message.payload) return undefined;
    const participantKey = getParticipantDiagnosticsKey(userId, userSessionId);
    const previous = diagnostics.get(participantKey);
    const current: ParticipantDiagnostics = {
      ...(previous ?? {
        userId,
        userSessionId,
        updatedAt: message.timestamp,
      }),
      inboundAudioByPublisher: {
        ...(previous?.inboundAudioByPublisher ?? {}),
      },
      playbackAudioByPublisher: {
        ...(previous?.playbackAudioByPublisher ?? {}),
      },
      audioEvents: [],
    };
    current.sfuId = message.sfu_id || current.sfuId;

    const records: TraceRecord[] = [];
    for (const line of message.payload.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const recordKey = `${participantKey}:${trimmed}`;
      if (seenRecords.has(recordKey)) continue;
      seenRecords.add(recordKey);
      if (seenRecords.size > 50_000) seenRecords.clear();

      try {
        records.push(JSON.parse(trimmed) as TraceRecord);
      } catch {
        // Ignore malformed trace lines without dropping the live stream.
      }
    }

    // Track mappings can be emitted after the getStats record in the same
    // payload. Consume them first so the first audio sample is attributable.
    for (const [tag, , value] of records) {
      if (tag.toLowerCase().endsWith('track.mapping') && isRecord(value)) {
        updateTrackMapping(participantKey, value, trackMappings);
      }
    }

    for (const [tag, peerConnectionId, value, timestamp] of records) {
      const recordTimestamp = Number(timestamp) || message.timestamp;
      current.updatedAt = Math.max(current.updatedAt, recordTimestamp);
      const normalizedTag = tag.toLowerCase();

      if (
        normalizedTag === 'connectionstatechange' &&
        typeof value === 'string'
      ) {
        current.connectionState = value;
      }

      if (normalizedTag !== 'getstats') {
        processAudioTrace(current, normalizedTag, value, recordTimestamp);
        continue;
      }
      if (!peerConnectionId || !isRecord(value)) continue;

      const participantStats =
        peerConnectionStats.get(participantKey) ?? new Map<string, StatsById>();
      peerConnectionStats.set(participantKey, participantStats);
      const base = participantStats.get(peerConnectionId) ?? {};
      participantStats.set(peerConnectionId, base);
      decompressStats(base, value);

      if (peerConnectionId.endsWith('-pub')) {
        updatePublisherDiagnostics(current, base, recordTimestamp, counters);
      } else if (peerConnectionId.endsWith('-sub')) {
        updateSubscriberDiagnostics(
          current,
          base,
          recordTimestamp,
          counters,
          trackMappings.get(participantKey),
        );
      }
    }

    diagnostics.set(participantKey, current);
    return { ...current };
  };

  return { process };
};

const updateTrackMapping = (
  participantKey: string,
  value: StatsReport,
  trackMappings: Map<string, Map<number, TrackMapping>>,
) => {
  const ssrc = asNumber(value.ssrc);
  const participant = isRecord(value.participant) ? value.participant : {};
  const userId = asString(participant.user_id);
  const sessionId = asString(participant.session_id);
  if (!ssrc || !userId || !sessionId) return;

  const mappings = trackMappings.get(participantKey) ?? new Map();
  trackMappings.set(participantKey, mappings);
  mappings.set(ssrc, {
    direction: asString(value.direction) ?? '',
    ssrc,
    trackType: asString(value.track_type) ?? '',
    participant: {
      userId,
      sessionId,
      unifiedSessionId: asString(participant.unified_session_id),
    },
  });
};

const processAudioTrace = (
  current: ParticipantDiagnostics,
  tag: string,
  value: unknown,
  timestamp: number,
) => {
  if (tag.endsWith('track.mapping')) return;

  if (tag === 'audioplayback.report' && isRecord(value)) {
    const publisherSessionId = asString(value.sessionId);
    if (!publisherSessionId) return;
    const track = isRecord(value.track) ? value.track : {};
    const context = isRecord(value.context) ? value.context : {};
    const element = isRecord(value.element) ? value.element : {};
    const signal = isRecord(value.signal) ? value.signal : {};
    const contextState = asString(context.state);
    const contextSampleRate = asOptionalNumber(context.sampleRate);
    const contextOutputLatency = asOptionalNumber(context.outputLatency);
    current.playbackAudioByPublisher[publisherSessionId] = {
      publisherSessionId,
      route: asString(value.route),
      trackId: asString(track.id),
      trackSampleRate: asOptionalNumber(track.sampleRate),
      channelCount: asOptionalNumber(track.channelCount),
      contextState,
      contextSampleRate,
      contextCurrentTime: asOptionalNumber(context.currentTime),
      contextOutputLatency,
      elementCurrentTime: asOptionalNumber(element.currentTime),
      elementClockAdvance: asOptionalNumber(element.clockAdvance),
      elementClockStalledRatio: asOptionalNumber(element.clockStalledRatio),
      longestClockStallMs: asOptionalNumber(element.longestClockStallMs),
      elementPaused: asBoolean(element.paused),
      elementReadyState: asOptionalNumber(element.readyState),
      averageLevel: asOptionalNumber(signal.averageLevel),
      peakLevel: asOptionalNumber(signal.peakLevel),
      silentRatio: asOptionalNumber(signal.silentRatio),
      longestSilenceMs: asOptionalNumber(signal.longestSilenceMs),
      updatedAt: timestamp,
    };
    if (contextState) current.playbackAudioContextState = contextState;
    if (contextSampleRate) {
      current.playbackAudioContextSampleRate = contextSampleRate;
      current.playbackAudioContextOutputLatency = contextOutputLatency;
      updateBluetoothProfileFromAudioContext(
        current,
        contextSampleRate,
        contextOutputLatency,
        timestamp,
        tag,
        value,
      );
    }
    return;
  }

  if (tag === 'audioplayback.bound' && isRecord(value)) {
    const trackSampleRate = asOptionalNumber(value.trackSampleRate);
    const contextSampleRate = asOptionalNumber(value.contextSampleRate);
    const mismatch =
      trackSampleRate !== undefined &&
      contextSampleRate !== undefined &&
      trackSampleRate !== contextSampleRate;
    pushAudioEvent(current, {
      type: 'playback',
      label: mismatch
        ? 'Playback sample-rate mismatch'
        : 'Remote audio bound to playback',
      detail:
        trackSampleRate || contextSampleRate
          ? `${formatSampleRate(trackSampleRate)} → ${formatSampleRate(contextSampleRate)}`
          : asString(value.route),
      severity: mismatch ? 'warning' : 'info',
      timestamp,
      tag,
      value,
    });
    return;
  }

  if (tag === 'audioplayback.unbound' && isRecord(value)) {
    pushAudioEvent(current, {
      type: 'playback',
      label: 'Remote audio unbound from playback',
      detail: asString(value.sessionId),
      severity: 'warning',
      timestamp,
      tag,
      value,
    });
    return;
  }

  if (tag === 'audioplayback.state' && isRecord(value)) {
    const event = asString(value.event) ?? 'changed';
    pushAudioEvent(current, {
      type: 'playback',
      label: `Remote playback ${event}`,
      detail: asString(value.sessionId),
      severity:
        event === 'playing'
          ? 'info'
          : event === 'stalled' || event === 'ended'
            ? 'critical'
            : 'warning',
      timestamp,
      tag,
      value,
    });
    return;
  }

  if (tag === 'media.capture.lifecycle' && isRecord(value)) {
    if (asString(value.trackType)?.toLowerCase() !== 'audio') return;
    const state = asString(value.state) ?? 'changed';
    current.microphoneCaptureState = state;
    const tracks = Array.isArray(value.tracks) ? value.tracks : [];
    const track = tracks.find(isRecord);
    if (track) {
      current.microphoneDeviceId = asString(track.deviceId);
      current.microphoneLabel = asString(track.label);
      current.microphoneSampleRate = asOptionalNumber(track.sampleRate);
    }
    updateBluetoothProfile(current, state, track, timestamp, tag, value);
    const severity =
      state === 'ended' ? 'critical' : state === 'stopped' ? 'warning' : 'info';
    pushAudioEvent(current, {
      type: 'capture-lifecycle',
      label: `Microphone capture ${state}`,
      detail: [
        current.microphoneLabel,
        formatSampleRate(current.microphoneSampleRate),
      ]
        .filter(Boolean)
        .join(' · '),
      severity,
      timestamp,
      tag,
      value,
    });
    return;
  }

  if (tag === 'mic.capture_report' && isRecord(value)) {
    const capturesAudio = asBoolean(value.capturesAudio);
    current.micCapturesAudio = capturesAudio;
    current.microphoneDeviceId = asString(value.deviceId);
    current.microphoneLabel = asString(value.label);
    pushAudioEvent(current, {
      type: 'microphone-capture',
      label: capturesAudio
        ? 'Microphone audio resumed'
        : 'Microphone went silent',
      detail: current.microphoneLabel,
      severity: capturesAudio ? 'info' : 'critical',
      timestamp,
      tag,
      value,
    });
    return;
  }

  if (tag === 'noisecancellation.enabled' && typeof value === 'boolean') {
    current.noiseCancellationEnabled = value;
    current.noiseCancellationState = value ? 'enabled' : 'disabled';
    pushAudioEvent(current, {
      type: 'noise-cancellation',
      label: `Krisp ${value ? 'enabled' : 'disabled'}`,
      severity: 'info',
      timestamp,
      tag,
      value,
    });
    return;
  }

  if (tag === 'noisecancellation.overload') {
    const willRestore = isRecord(value) && value.willRestore === true;
    current.noiseCancellationState = willRestore ? 'suspended' : 'overloaded';
    pushAudioEvent(current, {
      type: 'noise-cancellation',
      label: 'Krisp processing overloaded',
      detail: willRestore ? 'Automatic restoration scheduled' : undefined,
      severity: willRestore ? 'warning' : 'critical',
      timestamp,
      tag,
      value,
    });
    return;
  }

  if (
    tag === 'noisecancellation.bufferdropped' ||
    tag === 'noisecancellation.error'
  ) {
    current.noiseCancellationState = 'error';
    pushAudioEvent(current, {
      type: 'noise-cancellation',
      label:
        tag === 'noisecancellation.bufferdropped'
          ? 'Krisp dropped an audio buffer'
          : 'Krisp error',
      detail: typeof value === 'string' ? value : undefined,
      severity: 'critical',
      timestamp,
      tag,
      value,
    });
    return;
  }

  if (tag === 'noisecancellation.audiocontextstate') {
    const state =
      typeof value === 'string'
        ? value
        : isRecord(value)
          ? asString(value.state)
          : undefined;
    const sampleRate = isRecord(value)
      ? asOptionalNumber(value.sampleRate)
      : undefined;
    current.krispAudioContextState = state;
    current.krispAudioContextSampleRate = sampleRate;
    pushAudioEvent(current, {
      type: 'audio-context',
      label: `Krisp AudioContext ${state ?? 'changed'}`,
      detail: formatSampleRate(sampleRate),
      severity: state === 'running' ? 'info' : 'warning',
      timestamp,
      tag,
      value,
    });
    return;
  }

  if (
    (tag === 'audiocontext.shared.state' ||
      tag === 'audiocontext.shared.create' ||
      tag === 'audiocontext.state' ||
      tag === 'audiocontext.create') &&
    (isRecord(value) || typeof value === 'string')
  ) {
    const state = typeof value === 'string' ? value : asString(value.state);
    const sampleRate = isRecord(value)
      ? asOptionalNumber(value.sampleRate)
      : undefined;
    const outputLatency = isRecord(value)
      ? asOptionalNumber(value.outputLatency)
      : undefined;
    current.playbackAudioContextState = state;
    current.playbackAudioContextSampleRate = sampleRate;
    current.playbackAudioContextOutputLatency = outputLatency;
    if (sampleRate !== undefined) {
      updateBluetoothProfileFromAudioContext(
        current,
        sampleRate,
        outputLatency,
        timestamp,
        tag,
        value,
      );
    }
    pushAudioEvent(current, {
      type: 'audio-context',
      label: `Playback AudioContext ${state ?? 'changed'}`,
      detail: formatSampleRate(sampleRate),
      severity: state === 'running' ? 'info' : 'warning',
      timestamp,
      tag,
      value,
    });
    return;
  }

  if (tag === 'navigator.mediadevices.setsinkid') {
    current.outputDeviceId = typeof value === 'string' ? value : undefined;
    pushAudioEvent(current, {
      type: 'output-device',
      label: 'Output endpoint changed',
      detail: formatDevice(current.outputDeviceId),
      severity: 'info',
      timestamp,
      tag,
      value,
    });
    return;
  }

  if (
    tag.startsWith('navigator.mediadevices.getusermedia.') &&
    tag.endsWith('.onsuccess') &&
    isRecord(value)
  ) {
    const tracks = Array.isArray(value.tracks) ? value.tracks : [];
    const audioTrack = tracks.find(
      (track) => isRecord(track) && track.kind === 'audio',
    );
    if (isRecord(audioTrack)) {
      current.microphoneLabel = asString(audioTrack.label);
      const settings = isRecord(audioTrack.settings) ? audioTrack.settings : {};
      current.microphoneDeviceId = asString(settings.deviceId);
      current.microphoneSampleRate = asOptionalNumber(settings.sampleRate);
      pushAudioEvent(current, {
        type: 'input-device',
        label: 'Input endpoint activated',
        detail: [
          current.microphoneLabel,
          formatSampleRate(current.microphoneSampleRate),
        ]
          .filter(Boolean)
          .join(' · '),
        severity: 'info',
        timestamp,
        tag,
        value,
      });
    }
    return;
  }

  if (tag === 'device.disconnected' && isRecord(value)) {
    const kind = asString(value.kind);
    if (kind !== 'audioinput' && kind !== 'audiooutput') return;
    pushAudioEvent(current, {
      type: kind === 'audioinput' ? 'input-device' : 'output-device',
      label: `${kind === 'audioinput' ? 'Input' : 'Output'} endpoint disconnected`,
      detail: asString(value.label),
      severity: 'critical',
      timestamp,
      tag,
      value,
    });
    return;
  }

  if (tag === 'inboundaudio.stalled') {
    pushAudioEvent(current, {
      type: 'receiver-stall',
      label: 'Inbound audio packets stalled',
      severity: 'critical',
      timestamp,
      tag,
      value,
    });
  } else if (tag === 'inboundaudio.stallended') {
    pushAudioEvent(current, {
      type: 'receiver-stall',
      label: 'Inbound audio packets resumed',
      severity: 'info',
      timestamp,
      tag,
      value,
    });
  }
};

const updateBluetoothProfile = (
  current: ParticipantDiagnostics,
  captureState: string,
  track: StatsReport | undefined,
  timestamp: number,
  tag: string,
  value: unknown,
) => {
  const label = asString(track?.label) ?? current.bluetoothProfile?.deviceLabel;
  if (!label || !isBluetoothAudioDevice(label)) return;

  const microphoneActive =
    captureState === 'acquired' || captureState === 'reused';
  const microphoneReleased =
    captureState === 'stopped' || captureState === 'ended';
  if (!microphoneActive && !microphoneReleased) return;

  const state = microphoneActive ? 'call-audio' : 'transitioning';
  if (current.bluetoothProfile?.state === state) return;

  const sampleRate = asOptionalNumber(track?.sampleRate);
  const channelCount = asOptionalNumber(track?.channelCount);
  const evidence = [
    microphoneActive
      ? 'Bluetooth microphone capture activated'
      : 'Bluetooth microphone capture released',
  ];
  if (sampleRate !== undefined) {
    evidence.push(`Capture sample rate ${sampleRate} Hz`);
  }
  if (channelCount !== undefined) {
    evidence.push(`Capture channel count ${channelCount}`);
  }
  if (current.playbackAudioContextSampleRate !== undefined) {
    evidence.push(
      `Playback context ${current.playbackAudioContextSampleRate} Hz`,
    );
  }
  const hasPlaybackBinding =
    Object.keys(current.playbackAudioByPublisher).length > 0;
  if (microphoneReleased && hasPlaybackBinding) {
    evidence.push('Remote playback binding remains active');
  }
  if (microphoneReleased) {
    evidence.push('Awaiting output sample-rate recovery');
  }

  const hasCallProfileShape =
    microphoneActive &&
    ((sampleRate !== undefined && sampleRate <= 32_000) || channelCount === 1);
  const confidence = microphoneActive ? (hasCallProfileShape ? 0.9 : 0.7) : 0.5;
  current.bluetoothProfile = {
    state,
    confidence,
    deviceLabel: label,
    evidence,
    observedAt: timestamp,
  };
  pushAudioEvent(current, {
    type: 'bluetooth-profile',
    label: microphoneActive
      ? 'Probable Bluetooth call profile'
      : 'Bluetooth profile change pending',
    detail: `${label} · ${Math.round(confidence * 100)}% confidence`,
    severity: 'warning',
    timestamp,
    tag: `${tag}.${state}`,
    value: { trace: value, evidence },
  });
};

const updateBluetoothProfileFromAudioContext = (
  current: ParticipantDiagnostics,
  sampleRate: number,
  outputLatency: number | undefined,
  timestamp: number,
  tag: string,
  value: unknown,
) => {
  const previous = current.bluetoothProfile;
  if (
    previous?.state !== 'transitioning' ||
    sampleRate < 44_100 ||
    outputLatency === undefined ||
    outputLatency < 0.05 ||
    (current.microphoneCaptureState !== 'stopped' &&
      current.microphoneCaptureState !== 'ended')
  ) {
    return;
  }

  const confidence = 0.85;
  const evidence = [
    ...previous.evidence,
    `Playback context recovered to ${sampleRate} Hz`,
    `Output latency recovered to ${Math.round(outputLatency * 1000)} ms`,
  ];
  current.bluetoothProfile = {
    state: 'media-playback',
    confidence,
    deviceLabel: previous.deviceLabel,
    evidence,
    observedAt: timestamp,
  };
  pushAudioEvent(current, {
    type: 'bluetooth-profile',
    label: 'Probable Bluetooth media profile',
    detail: `${previous.deviceLabel} · ${Math.round(confidence * 100)}% confidence`,
    severity: 'info',
    timestamp,
    tag: `${tag}.media-playback`,
    value: { trace: value, evidence },
  });
};

const isBluetoothAudioDevice = (label: string) =>
  /airpods|bluetooth|beats|freebuds|galaxy buds|pixel buds|bose|jabra|(?:sony )?wh-\d|(?:sony )?wf-\d/i.test(
    label,
  );

const formatSampleRate = (sampleRate?: number) =>
  sampleRate === undefined ? undefined : `${sampleRate / 1000} kHz`;

const pushAudioEvent = (
  current: ParticipantDiagnostics,
  event: Omit<AudioDiagnosticEvent, 'id'> & {
    tag: string;
    value: unknown;
  },
) => {
  const { tag, value, ...diagnosticEvent } = event;
  current.audioEvents.push({
    ...diagnosticEvent,
    id: `${current.userSessionId}:${event.timestamp}:${tag}:${stableValue(value)}`,
  });
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
  const audio = outbound.filter((report) => report.kind === 'audio');
  const video = outbound.filter((report) => report.kind === 'video');
  const remoteInbound = reports.filter(
    (report) => report.type === 'remote-inbound-rtp',
  );
  const participantKey = getParticipantDiagnosticsKey(
    current.userId,
    current.userSessionId,
  );

  current.publishBitrate = calculateRate(
    `${participantKey}:publish:bytes`,
    sum(outbound, 'bytesSent') * 8,
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

  if (audio.length === 0) return;
  current.publishAudioBitrate = calculateRate(
    `${participantKey}:publish-audio:bytes`,
    sum(audio, 'bytesSent') * 8,
    timestamp,
    counters,
    current.publishAudioBitrate,
  );
  current.publishAudioPacketsPerSecond = calculateRate(
    `${participantKey}:publish-audio:packets`,
    sum(audio, 'packetsSent'),
    timestamp,
    counters,
    current.publishAudioPacketsPerSecond,
  );

  const mediaSources = audio
    .map((report) => asString(report.mediaSourceId))
    .flatMap((id) => (id && stats[id] ? [stats[id]] : []));
  current.publishAudioLevel =
    maxIncludingZero(mediaSources, 'audioLevel') ??
    maxIncludingZero(audio, 'audioLevel') ??
    current.publishAudioLevel;
  const energy = sum(mediaSources, 'totalAudioEnergy');
  if (energy > 0) {
    const energyDelta = calculateDelta(
      `${participantKey}:publish-audio:energy`,
      energy,
      timestamp,
      counters,
    );
    if (energyDelta !== undefined)
      current.publishAudioEnergyDelta = energyDelta;
  }
};

const updateSubscriberDiagnostics = (
  current: ParticipantDiagnostics,
  stats: StatsById,
  timestamp: number,
  counters: Map<string, CounterSample>,
  mappings: Map<number, TrackMapping> | undefined,
) => {
  const reports = Object.values(stats);
  const inboundEntries = Object.entries(stats).filter(
    ([, report]) => report.type === 'inbound-rtp',
  );
  const inbound = inboundEntries.map(([, report]) => report);
  const video = inbound.filter((report) => report.kind === 'video');
  const participantKey = getParticipantDiagnosticsKey(
    current.userId,
    current.userSessionId,
  );

  current.receiveBitrate = calculateRate(
    `${participantKey}:receive:bytes`,
    sum(inbound, 'bytesReceived') * 8,
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

  for (const [reportId, report] of inboundEntries) {
    if (report.kind !== 'audio') continue;
    const ssrc = asNumber(report.ssrc);
    const mapping = mappings?.get(ssrc);
    if (
      !mapping ||
      mapping.direction !== 'inbound' ||
      !mapping.trackType.toLowerCase().includes('audio')
    ) {
      continue;
    }

    const publisherKey = getParticipantDiagnosticsKey(
      mapping.participant.userId,
      mapping.participant.unifiedSessionId ?? mapping.participant.sessionId,
    );
    const counterPrefix = `${participantKey}:${reportId}`;
    const bytes = calculateCounterDelta(
      `${counterPrefix}:bytes`,
      asNumber(report.bytesReceived),
      timestamp,
      counters,
    );
    const packets = calculateCounterDelta(
      `${counterPrefix}:packets`,
      asNumber(report.packetsReceived),
      timestamp,
      counters,
    );
    const lost = calculateDelta(
      `${counterPrefix}:lost`,
      asNumber(report.packetsLost),
      timestamp,
      counters,
    );
    const concealed = calculateDelta(
      `${counterPrefix}:concealed`,
      asNumber(report.concealedSamples),
      timestamp,
      counters,
    );
    const concealmentEvents = calculateDelta(
      `${counterPrefix}:concealment-events`,
      asNumber(report.concealmentEvents),
      timestamp,
      counters,
    );
    const audioEnergy = calculateDelta(
      `${counterPrefix}:audio-energy`,
      asNumber(report.totalAudioEnergy),
      timestamp,
      counters,
    );
    const jitterBufferDelay = calculateDelta(
      `${counterPrefix}:jitter-buffer-delay`,
      asNumber(report.jitterBufferDelay),
      timestamp,
      counters,
    );
    const jitterBufferEmitted = calculateDelta(
      `${counterPrefix}:jitter-buffer-emitted`,
      asNumber(report.jitterBufferEmittedCount),
      timestamp,
      counters,
    );
    const packetsTotal = (packets?.delta ?? 0) + (lost ?? 0);

    current.inboundAudioByPublisher[publisherKey] = {
      publisherUserId: mapping.participant.userId,
      publisherSessionId: mapping.participant.sessionId,
      publisherUnifiedSessionId: mapping.participant.unifiedSessionId,
      ssrc,
      bitrate:
        bytes && bytes.durationMs > 0
          ? (bytes.delta * 8 * 1000) / bytes.durationMs
          : current.inboundAudioByPublisher[publisherKey]?.bitrate,
      packetsPerSecond:
        packets && packets.durationMs > 0
          ? (packets.delta * 1000) / packets.durationMs
          : current.inboundAudioByPublisher[publisherKey]?.packetsPerSecond,
      packetLossPercent:
        packetsTotal > 0
          ? ((lost ?? 0) / packetsTotal) * 100
          : current.inboundAudioByPublisher[publisherKey]?.packetLossPercent,
      jitterMs: asOptionalNumber(report.jitter, 1000),
      audioLevel: asOptionalNumber(report.audioLevel),
      audioEnergyDelta: audioEnergy,
      concealedSamplesDelta: concealed,
      concealmentEventsDelta: concealmentEvents,
      jitterBufferDelayMs:
        jitterBufferDelay !== undefined && (jitterBufferEmitted ?? 0) > 0
          ? (jitterBufferDelay / jitterBufferEmitted!) * 1000
          : undefined,
      updatedAt: timestamp,
    };
  }
};

const calculateRate = (
  key: string,
  value: number,
  timestamp: number,
  counters: Map<string, CounterSample>,
  previousRate?: number,
) => {
  const delta = calculateCounterDelta(key, value, timestamp, counters);
  if (!delta || delta.durationMs <= 0) return previousRate;
  return (delta.delta * 1000) / delta.durationMs;
};

const calculateCounterDelta = (
  key: string,
  value: number,
  timestamp: number,
  counters: Map<string, CounterSample>,
): { delta: number; durationMs: number } | undefined => {
  const previous = counters.get(key);
  counters.set(key, { value, timestamp });
  if (!previous || timestamp <= previous.timestamp || value < previous.value) {
    return undefined;
  }
  return {
    delta: value - previous.value,
    durationMs: timestamp - previous.timestamp,
  };
};

const calculateDelta = (
  key: string,
  value: number,
  timestamp: number,
  counters: Map<string, CounterSample>,
) => calculateCounterDelta(key, value, timestamp, counters)?.delta;

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

const maxIncludingZero = (
  reports: StatsReport[],
  field: string,
  multiplier = 1,
) => {
  const values = reports.flatMap((report) => {
    const value = report[field];
    return typeof value === 'number' && Number.isFinite(value)
      ? [value * multiplier]
      : [];
  });
  return values.length > 0 ? Math.max(...values) : undefined;
};

const asNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const asOptionalNumber = (value: unknown, multiplier = 1) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value * multiplier
    : undefined;

const asString = (value: unknown) =>
  typeof value === 'string' && value ? value : undefined;

const asBoolean = (value: unknown) =>
  typeof value === 'boolean' ? value : undefined;

const isRecord = (value: unknown): value is StatsReport =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const formatDevice = (deviceId: string | undefined) => {
  if (!deviceId) return 'System default';
  return deviceId.length > 16 ? `${deviceId.slice(0, 8)}…` : deviceId;
};

const stableValue = (value: unknown) => {
  if (typeof value === 'string' || typeof value === 'number') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
};
