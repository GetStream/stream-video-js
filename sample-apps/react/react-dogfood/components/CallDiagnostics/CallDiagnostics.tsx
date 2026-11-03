import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

import {
  appendDiagnosticsSample,
  DiagnosticsHistory,
  diagnosticsWindowMs,
  pruneDiagnosticsHistory,
} from './diagnosticsHistory';
import AudioEventTimeline from './AudioEventTimeline';
import { OwnedAudioDiagnosticEvent } from './audioEventClusters';
import {
  createRtcStatsProcessor,
  getInboundAudioForPublisher,
  getParticipantDiagnosticsKey,
  getPlaybackAudioForPublisher,
  InboundAudioDiagnostics,
  LiveCallStatsMessage,
  ParticipantDiagnostics,
  PlaybackAudioDiagnostics,
} from './rtcStats';

const AudioFanoutChart = lazy(() => import('./AudioFanoutChart'));
const AudioReceiverChart = lazy(() => import('./AudioReceiverChart'));
const LiveMetricsChart = lazy(() => import('./LiveMetricsChart'));

export type CallDiagnosticsParticipant = {
  userId: string;
  userSessionId: string;
  name?: string;
};

export type CallDiagnosticsProps = {
  appId: number;
  callCID: string;
  callSessionId: string;
  participants: CallDiagnosticsParticipant[];
};

type StreamStatus = 'connecting' | 'live' | 'reconnecting' | 'error';

export const CallDiagnostics = ({
  appId,
  callCID,
  callSessionId,
  participants,
}: CallDiagnosticsProps) => {
  const [history, setHistory] = useState<DiagnosticsHistory>({});
  const [status, setStatus] = useState<StreamStatus>('connecting');
  const [error, setError] = useState<string>();
  const [now, setNow] = useState(0);
  const [selectedSourceKey, setSelectedSourceKey] = useState('');
  const [selectedReceiverKey, setSelectedReceiverKey] = useState('');
  const [expandedParticipantKey, setExpandedParticipantKey] = useState('');
  const participantsKey = useMemo(
    () =>
      participants
        .map(({ userId, userSessionId }) => `${userId}:${userSessionId}`)
        .sort()
        .join('|'),
    [participants],
  );

  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    updateNow();
    const interval = window.setInterval(updateNow, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      participants.some(
        (participant) => participantKey(participant) === selectedSourceKey,
      )
    ) {
      return;
    }
    setSelectedSourceKey(
      participants[0] ? participantKey(participants[0]) : '',
    );
  }, [participants, selectedSourceKey]);

  useEffect(() => {
    if (
      participants.some(
        (participant) => participantKey(participant) === selectedReceiverKey,
      )
    ) {
      return;
    }
    setSelectedReceiverKey(
      participants[0] ? participantKey(participants[0]) : '',
    );
  }, [participants, selectedReceiverKey]);

  useEffect(() => {
    const participantKeys = new Set(
      participants.map(({ userId, userSessionId }) =>
        getParticipantDiagnosticsKey(userId, userSessionId),
      ),
    );
    setHistory((current) => pruneDiagnosticsHistory(current, participantKeys));
  }, [participantsKey, participants]);

  useEffect(() => {
    if (participants.length === 0) return;
    const controller = new AbortController();
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let connectedOnce = false;

    const connect = async () => {
      const processor = createRtcStatsProcessor();
      setStatus(connectedOnce ? 'reconnecting' : 'connecting');
      setError(undefined);
      try {
        const response = await fetch('/api/live-call-stats', {
          method: 'POST',
          headers: {
            Accept: 'application/x-ndjson',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            app_id: appId,
            call_cid: callCID,
            call_session_id: callSessionId,
            participants: participants.map(
              ({ userId: user_id, userSessionId: user_session_id }) => ({
                user_id,
                user_session_id,
              }),
            ),
          }),
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          const body = await response.text();
          throw new Error(body || `${response.status} ${response.statusText}`);
        }

        connectedOnce = true;
        setStatus('live');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!controller.signal.aborted) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const message = JSON.parse(line) as LiveCallStatsMessage;
            if (message.type === 'warning') {
              setError(message.payload);
              continue;
            }
            const report = processor.process(message);
            if (report) {
              setHistory((current) => appendDiagnosticsSample(current, report));
            }
          }
          if (done) break;
        }
      } catch (streamError) {
        if (controller.signal.aborted) return;
        setStatus('error');
        setError(
          streamError instanceof Error
            ? streamError.message
            : 'Live diagnostics stream failed',
        );
      }

      if (!controller.signal.aborted) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect().catch(console.error);
    return () => {
      controller.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [appId, callCID, callSessionId, participants, participantsKey]);

  const selectedSource =
    participants.find(
      (participant) => participantKey(participant) === selectedSourceKey,
    ) ?? participants[0];
  const sourceSamples = selectedSource
    ? (history[participantKey(selectedSource)] ?? [])
    : [];
  const sourceReport = sourceSamples.at(-1);
  const fanoutReceivers = selectedSource
    ? participants.filter(
        (participant) =>
          participantKey(participant) !== participantKey(selectedSource),
      )
    : [];
  const receiverRows = selectedSource
    ? fanoutReceivers.map((participant) => {
        const samples = history[participantKey(participant)] ?? [];
        const report = samples.at(-1);
        const audio = getInboundAudioForPublisher(
          report,
          selectedSource.userId,
          selectedSource.userSessionId,
        );
        return {
          participant,
          samples,
          report,
          audio,
          status: getAudioPathStatus(audio, now),
        };
      })
    : [];
  const diagnosis = getFanoutDiagnosis(sourceReport, receiverRows);
  const selectedReceiver =
    participants.find(
      (participant) => participantKey(participant) === selectedReceiverKey,
    ) ?? participants[0];
  const selectedReceiverSamples = selectedReceiver
    ? (history[participantKey(selectedReceiver)] ?? [])
    : [];
  const selectedReceiverReport = selectedReceiverSamples.at(-1);
  const receiverPublishers = selectedReceiver
    ? participants.filter(
        (participant) =>
          participantKey(participant) !== participantKey(selectedReceiver),
      )
    : [];
  const publisherRows = receiverPublishers.map((participant) => {
    const inbound = getInboundAudioForPublisher(
      selectedReceiverReport,
      participant.userId,
      participant.userSessionId,
    );
    const playback = getPlaybackAudioForPublisher(
      selectedReceiverReport,
      participant.userId,
      participant.userSessionId,
    );
    return {
      participant,
      inbound,
      playback,
      status: getReceiverPlaybackStatus(inbound, playback, now),
    };
  });
  const receiverDiagnosis = getReceiverDiagnosis(
    selectedReceiverReport,
    publisherRows,
  );

  return (
    <main className="rd__call-diagnostics">
      <header className="rd__call-diagnostics__header">
        <div>
          <p className="rd__call-diagnostics__eyebrow">Live RTC diagnostics</p>
          <h1>{callCID}</h1>
          <p>
            Session <code>{callSessionId}</code>
          </p>
        </div>
        <div className={`rd__call-diagnostics__status is-${status}`}>
          <span aria-hidden="true" />
          {status === 'live' ? 'Live' : status}
        </div>
      </header>

      {error && <div className="rd__call-diagnostics__warning">{error}</div>}

      <section className="rd__call-diagnostics__summary">
        <strong>{participants.length}</strong>
        <span>participants in the current call session</span>
      </section>

      {selectedSource && (
        <section className="rd__call-diagnostics__fanout">
          <header className="rd__call-diagnostics__fanout-header">
            <div>
              <p className="rd__call-diagnostics__eyebrow">
                One source → every receiver
              </p>
              <h2>Audio fan-out</h2>
              <p>
                Detect shared interruptions first, then compare every delivery
                path on one clock.
              </p>
            </div>
            <label>
              Audio source
              <select
                onChange={(event) => setSelectedSourceKey(event.target.value)}
                value={participantKey(selectedSource)}
              >
                {participants.map((participant) => (
                  <option
                    key={participantKey(participant)}
                    value={participantKey(participant)}
                  >
                    {participant.name || participant.userId}
                  </option>
                ))}
              </select>
            </label>
          </header>

          <div
            className={`rd__call-diagnostics__fanout-verdict is-${diagnosis.severity}`}
          >
            <strong>{diagnosis.title}</strong>
            <span>{diagnosis.detail}</span>
          </div>

          <div className="rd__call-diagnostics__source-path">
            <AudioStage
              detail={sourceReport?.microphoneLabel || 'No endpoint event yet'}
              label="Microphone capture"
              status={
                sourceReport?.micCapturesAudio === false
                  ? 'critical'
                  : sourceReport?.micCapturesAudio === true
                    ? 'healthy'
                    : 'unknown'
              }
              value={
                sourceReport?.micCapturesAudio === false
                  ? 'Silent'
                  : sourceReport?.micCapturesAudio === true
                    ? 'Capturing'
                    : 'Unknown'
              }
            />
            <span aria-hidden="true">→</span>
            <AudioStage
              detail={
                sourceReport?.krispAudioContextState
                  ? `AudioContext ${sourceReport.krispAudioContextState}`
                  : 'No processing event yet'
              }
              label="Krisp processing"
              status={getKrispStatus(sourceReport)}
              value={sourceReport?.noiseCancellationState || 'Unknown'}
            />
            <span aria-hidden="true">→</span>
            <AudioStage
              detail={formatBitrate(sourceReport?.publishAudioBitrate)}
              label="Publisher RTP"
              status={
                sourceReport?.publishAudioPacketsPerSecond === 0
                  ? 'critical'
                  : sourceReport?.publishAudioPacketsPerSecond === undefined
                    ? 'unknown'
                    : 'healthy'
              }
              value={formatPacketRate(
                sourceReport?.publishAudioPacketsPerSecond,
              )}
            />
            <span aria-hidden="true">→</span>
            <AudioStage
              detail={`${receiverRows.filter(({ audio }) => audio).length} mapped receiver paths`}
              label="Receiver fan-out"
              status={diagnosis.severity}
              value={`${receiverRows.filter(({ status: pathStatus }) => pathStatus === 'interrupted').length} interrupted`}
            />
          </div>

          {sourceSamples.length === 0 ? (
            <div className="rd__call-diagnostics__chart-placeholder">
              Waiting for audio RTC stats and track mappings…
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="rd__call-diagnostics__chart-placeholder">
                  Loading audio fan-out chart…
                </div>
              }
            >
              <AudioFanoutChart
                receivers={receiverRows.map(({ participant, samples }) => ({
                  label: participant.name || participant.userId,
                  userId: participant.userId,
                  userSessionId: participant.userSessionId,
                  samples,
                }))}
                source={{
                  label: selectedSource.name || selectedSource.userId,
                  userId: selectedSource.userId,
                  userSessionId: selectedSource.userSessionId,
                  samples: sourceSamples,
                }}
              />
            </Suspense>
          )}

          <div className="rd__call-diagnostics__receiver-table-wrap">
            <table className="rd__call-diagnostics__receiver-table">
              <thead>
                <tr>
                  <th>Receiver</th>
                  <th>Path</th>
                  <th>Packets</th>
                  <th>Bitrate</th>
                  <th>Jitter</th>
                  <th>Loss</th>
                  <th>Concealment</th>
                  <th>Audio level</th>
                </tr>
              </thead>
              <tbody>
                {receiverRows.map(
                  ({ participant, audio, status: pathStatus }) => (
                    <tr key={participantKey(participant)}>
                      <th>{participant.name || participant.userId}</th>
                      <td>
                        <span
                          className={`rd__call-diagnostics__path-status is-${pathStatus}`}
                        >
                          {formatPathStatus(pathStatus)}
                        </span>
                      </td>
                      <td>{formatPacketRate(audio?.packetsPerSecond)}</td>
                      <td>{formatBitrate(audio?.bitrate)}</td>
                      <td>{formatMs(audio?.jitterMs)}</td>
                      <td>{formatPercent(audio?.packetLossPercent)}</td>
                      <td>
                        {audio?.concealmentEventsDelta === undefined
                          ? '—'
                          : `${audio.concealmentEventsDelta} events`}
                      </td>
                      <td>{formatAudioLevel(audio?.audioLevel)}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          <p className="rd__call-diagnostics__fanout-caveat">
            “Publisher → SFU” and “SFU → receiver” remain one inferred segment
            until periodic SFU ingress and per-downtrack egress metrics are
            added.
          </p>
        </section>
      )}

      {selectedReceiver && (
        <section className="rd__call-diagnostics__fanout">
          <header className="rd__call-diagnostics__fanout-header">
            <div>
              <p className="rd__call-diagnostics__eyebrow">
                Every source → one receiver
              </p>
              <h2>Receiver playback</h2>
              <p>
                Separate network delivery, decoder signal and browser playout
                for every publisher heard by one participant.
              </p>
            </div>
            <label>
              Receiver under investigation
              <select
                onChange={(event) => setSelectedReceiverKey(event.target.value)}
                value={participantKey(selectedReceiver)}
              >
                {participants.map((participant) => (
                  <option
                    key={participantKey(participant)}
                    value={participantKey(participant)}
                  >
                    {participant.name || participant.userId}
                  </option>
                ))}
              </select>
            </label>
          </header>

          <div
            className={`rd__call-diagnostics__fanout-verdict is-${receiverDiagnosis.severity}`}
          >
            <strong>{receiverDiagnosis.title}</strong>
            <span>{receiverDiagnosis.detail}</span>
          </div>

          <div className="rd__call-diagnostics__source-path">
            <AudioStage
              detail={`${publisherRows.filter(({ inbound }) => (inbound?.packetsPerSecond ?? 0) > 0).length}/${publisherRows.length} publisher paths active`}
              label="Receiver downlink"
              status={getReceiverStageStatus(publisherRows, 'network')}
              value={`${publisherRows.filter(({ inbound }) => inbound).length} mapped`}
            />
            <span aria-hidden="true">→</span>
            <AudioStage
              detail="WebRTC inbound-rtp audioLevel"
              label="Decoder signal"
              status={getReceiverStageStatus(publisherRows, 'decoder')}
              value={`${publisherRows.filter(({ inbound }) => (inbound?.audioLevel ?? 0) > 0.005).length} active`}
            />
            <span aria-hidden="true">→</span>
            <AudioStage
              detail={
                selectedReceiverReport?.playbackAudioContextSampleRate
                  ? `${formatSampleRate(selectedReceiverReport.playbackAudioContextSampleRate)} context${selectedReceiverReport.playbackAudioContextOutputLatency === undefined ? '' : ` · ${Math.round(selectedReceiverReport.playbackAudioContextOutputLatency * 1000)} ms output`}`
                  : 'Waiting for playback telemetry'
              }
              label="Browser playback"
              status={getReceiverStageStatus(publisherRows, 'playback')}
              value={`${publisherRows.filter(({ playback }) => playback).length} observed`}
            />
            <span aria-hidden="true">→</span>
            <AudioStage
              detail={
                selectedReceiverReport?.bluetoothProfile
                  ? `${selectedReceiverReport.bluetoothProfile.deviceLabel} · ${selectedReceiverReport.bluetoothProfile.state === 'transitioning' ? 'profile transition pending' : `probable ${selectedReceiverReport.bluetoothProfile.state}`} (${Math.round(selectedReceiverReport.bluetoothProfile.confidence * 100)}%)`
                  : selectedReceiverReport?.outputDeviceId
                    ? `Device ${formatDeviceId(selectedReceiverReport.outputDeviceId)}`
                    : 'Browser default or unreported'
              }
              label="Output route"
              status="unknown"
              value="OS / hardware"
            />
          </div>

          {selectedReceiverSamples.length === 0 ? (
            <div className="rd__call-diagnostics__chart-placeholder">
              Waiting for receiver RTC and playback telemetry…
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="rd__call-diagnostics__chart-placeholder">
                  Loading receiver playback chart…
                </div>
              }
            >
              <AudioReceiverChart
                publishers={receiverPublishers.map((participant) => ({
                  label: participant.name || participant.userId,
                  userId: participant.userId,
                  userSessionId: participant.userSessionId,
                }))}
                receiverLabel={selectedReceiver.name || selectedReceiver.userId}
                samples={selectedReceiverSamples}
              />
            </Suspense>
          )}

          <div className="rd__call-diagnostics__receiver-table-wrap">
            <table className="rd__call-diagnostics__receiver-table">
              <thead>
                <tr>
                  <th>Publisher</th>
                  <th>Verdict</th>
                  <th>Packets</th>
                  <th>Decoded level</th>
                  <th>Playback level</th>
                  <th>Silent window</th>
                  <th>Track → context</th>
                  <th>Playback route</th>
                </tr>
              </thead>
              <tbody>
                {publisherRows.map(
                  ({ participant, inbound, playback, status: pathStatus }) => (
                    <tr key={participantKey(participant)}>
                      <th>{participant.name || participant.userId}</th>
                      <td>
                        <span
                          className={`rd__call-diagnostics__path-status is-${pathStatus}`}
                        >
                          {formatReceiverPlaybackStatus(pathStatus)}
                        </span>
                      </td>
                      <td>{formatPacketRate(inbound?.packetsPerSecond)}</td>
                      <td>{formatAudioLevel(inbound?.audioLevel)}</td>
                      <td>{formatAudioLevel(playback?.averageLevel)}</td>
                      <td>
                        {formatMs(
                          playback?.longestSilenceMs ??
                            playback?.longestClockStallMs,
                        )}
                      </td>
                      <td>{formatSampleRatePair(playback)}</td>
                      <td>{playback?.route || '—'}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          <p className="rd__call-diagnostics__fanout-caveat">
            Playback signal is measured before the browser’s destination. If it
            remains healthy while the user hears silence, the remaining suspect
            is the browser-to-OS route, Bluetooth profile, AirPods or physical
            output. The browser cannot directly prove that final hop.
          </p>
        </section>
      )}

      <section className="rd__call-diagnostics__grid">
        {participants.map((participant, participantIndex) => {
          const samples =
            history[
              getParticipantDiagnosticsKey(
                participant.userId,
                participant.userSessionId,
              )
            ] ?? [];
          const report = samples.at(-1);
          const age = report ? Math.max(0, now - report.updatedAt) : undefined;
          const health = getHealth(report, age);
          const key = participantKey(participant);
          const detailsId = `participant-audio-details-${participantIndex}`;
          const detailsExpanded = expandedParticipantKey === key;
          return (
            <article
              className="rd__call-diagnostics__participant"
              key={`${participant.userId}:${participant.userSessionId}`}
            >
              <div className="rd__call-diagnostics__participant-header">
                <div>
                  <h2>{participant.name || participant.userId}</h2>
                  <code>
                    {participant.userId} · {participant.userSessionId}
                  </code>
                </div>
                <div className="rd__call-diagnostics__participant-actions">
                  <span className={`rd__call-diagnostics__health is-${health}`}>
                    {health}
                  </span>
                  <button
                    aria-controls={detailsId}
                    aria-expanded={detailsExpanded}
                    onClick={() =>
                      setExpandedParticipantKey(detailsExpanded ? '' : key)
                    }
                    type="button"
                  >
                    {detailsExpanded ? 'Hide details' : 'Details'}
                  </button>
                </div>
              </div>

              {detailsExpanded && (
                <div
                  className="rd__call-diagnostics__participant-details"
                  id={detailsId}
                >
                  <ParticipantAudioDetails
                    participant={participant}
                    report={report}
                    samples={samples}
                  />

                  <div className="rd__call-diagnostics__metrics">
                    <Metric
                      label="RTT"
                      value={formatMs(report?.roundTripTimeMs)}
                    />
                    <Metric
                      label="Publish bitrate"
                      value={formatBitrate(report?.publishBitrate)}
                    />
                    <Metric
                      label="Receive bitrate"
                      value={formatBitrate(report?.receiveBitrate)}
                    />
                    <Metric
                      label="Publish loss"
                      value={formatPercent(report?.publishPacketLossPercent)}
                    />
                    <Metric
                      label="Receive loss"
                      value={formatPercent(report?.receivePacketLossPercent)}
                    />
                    <Metric
                      label="Jitter (send / receive)"
                      value={`${formatMs(report?.publishJitterMs)} / ${formatMs(
                        report?.receiveJitterMs,
                      )}`}
                    />
                    <Metric
                      label="Video sent"
                      value={formatVideo(
                        report?.publishResolution,
                        report?.publishFps,
                      )}
                    />
                    <Metric
                      label="Video received"
                      value={formatVideo(
                        report?.receiveResolution,
                        report?.receiveFps,
                      )}
                    />
                    <Metric label="Codec" value={report?.videoCodec || '—'} />
                    <Metric
                      label="Quality limitation"
                      value={report?.qualityLimitationReason || '—'}
                    />
                    <Metric
                      label="Connection"
                      value={report?.connectionState || '—'}
                    />
                    <Metric label="SFU" value={report?.sfuId || '—'} />
                  </div>

                  <div className="rd__call-diagnostics__timeline-header">
                    <div>
                      <h3>Live performance</h3>
                      <p>
                        Rolling {diagnosticsWindowMs / 60_000}-minute window ·{' '}
                        {samples.length}{' '}
                        {samples.length === 1 ? 'sample' : 'samples'}
                      </p>
                    </div>
                  </div>

                  {samples.length === 0 ? (
                    <div className="rd__call-diagnostics__chart-placeholder">
                      Waiting for the first RTC stats report…
                    </div>
                  ) : (
                    <Suspense
                      fallback={
                        <div className="rd__call-diagnostics__chart-placeholder">
                          Loading charts…
                        </div>
                      }
                    >
                      <div className="rd__call-diagnostics__charts">
                        <LiveMetricsChart metric="bitrate" samples={samples} />
                        <LiveMetricsChart metric="latency" samples={samples} />
                        <LiveMetricsChart
                          metric="packet-loss"
                          samples={samples}
                        />
                        <LiveMetricsChart metric="fps" samples={samples} />
                      </div>
                    </Suspense>
                  )}

                  <footer>
                    {age === undefined
                      ? 'Waiting for the first RTC stats report…'
                      : `Updated ${formatAge(age)} ago`}
                  </footer>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rd__call-diagnostics__metric">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

type AudioPathStatus =
  'degraded' | 'healthy' | 'interrupted' | 'stale' | 'unmapped' | 'waiting';

type AudioStageStatus = 'critical' | 'degraded' | 'healthy' | 'unknown';

type ReceiverPlaybackStatus =
  | 'degraded'
  | 'healthy'
  | 'network-stall'
  | 'playback-stall'
  | 'stale'
  | 'waiting';

type ReceiverPublisherRow = {
  inbound: InboundAudioDiagnostics | undefined;
  playback: PlaybackAudioDiagnostics | undefined;
  status: ReceiverPlaybackStatus;
};

const AudioStage = ({
  detail,
  label,
  status,
  value,
}: {
  detail: string;
  label: string;
  status: AudioStageStatus;
  value: string;
}) => (
  <div className={`rd__call-diagnostics__audio-stage is-${status}`}>
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{detail}</small>
  </div>
);

const ParticipantAudioDetails = ({
  participant,
  report,
  samples,
}: {
  participant: CallDiagnosticsParticipant;
  report: ParticipantDiagnostics | undefined;
  samples: ParticipantDiagnostics[];
}) => {
  const eventEntries = useMemo(() => {
    const unique = new Map<string, OwnedAudioDiagnosticEvent>();
    samples
      .flatMap(({ audioEvents }) => audioEvents)
      .forEach((event) => unique.set(event.id, { event }));
    return [...unique.values()].sort(
      (left, right) => left.event.timestamp - right.event.timestamp,
    );
  }, [samples]);
  const playback = Object.values(report?.playbackAudioByPublisher ?? {});
  const longestPlaybackSilence = Math.max(
    0,
    ...playback.map(
      ({ longestClockStallMs, longestSilenceMs }) =>
        longestSilenceMs ?? longestClockStallMs ?? 0,
    ),
  );
  const playbackStatus: AudioStageStatus =
    report?.playbackAudioContextState &&
    report.playbackAudioContextState !== 'running'
      ? 'critical'
      : longestPlaybackSilence >= 2_000
        ? 'degraded'
        : playback.length > 0
          ? 'healthy'
          : 'unknown';
  const timestamps = [
    ...samples.map(({ updatedAt }) => updatedAt),
    ...eventEntries.map(({ event }) => event.timestamp),
  ];

  return (
    <section className="rd__call-diagnostics__participant-audio-details">
      <header>
        <h3>Audio phases</h3>
        <p>Current phase state and endpoint changes on the same clock.</p>
      </header>
      <div className="rd__call-diagnostics__source-path">
        <AudioStage
          detail={report?.microphoneLabel || 'No input endpoint observed'}
          label="Capture"
          status={
            report?.micCapturesAudio === false
              ? 'critical'
              : report?.micCapturesAudio === true
                ? 'healthy'
                : 'unknown'
          }
          value={
            report?.micCapturesAudio === false
              ? 'Silent'
              : report?.micCapturesAudio === true
                ? 'Healthy'
                : 'Unknown'
          }
        />
        <span aria-hidden="true">→</span>
        <AudioStage
          detail={
            report?.krispAudioContextState
              ? `AudioContext ${report.krispAudioContextState}`
              : 'No processing event observed'
          }
          label="Krisp"
          status={getKrispStatus(report)}
          value={report?.noiseCancellationState || 'Unknown'}
        />
        <span aria-hidden="true">→</span>
        <AudioStage
          detail={formatBitrate(report?.publishAudioBitrate)}
          label="Publisher RTP"
          status={
            report?.publishAudioPacketsPerSecond === 0
              ? 'critical'
              : report?.publishAudioPacketsPerSecond === undefined
                ? 'unknown'
                : 'healthy'
          }
          value={formatPacketRate(report?.publishAudioPacketsPerSecond)}
        />
        <span aria-hidden="true">→</span>
        <AudioStage
          detail={
            longestPlaybackSilence > 0
              ? `${formatMs(longestPlaybackSilence)} longest silence`
              : report?.playbackAudioContextSampleRate
                ? `${formatSampleRate(report.playbackAudioContextSampleRate)} context`
                : 'No playback evidence observed'
          }
          label="Browser playback"
          status={playbackStatus}
          value={
            playbackStatus === 'critical'
              ? 'Stopped'
              : playbackStatus === 'degraded'
                ? 'Interrupted'
                : playback.length > 0
                  ? `${playback.length} active`
                  : 'Unknown'
          }
        />
      </div>
      {timestamps.length > 0 ? (
        <AudioEventTimeline
          ariaLabel={`Audio events for ${participant.name || participant.userId}`}
          entries={eventEntries}
          maxTimestamp={Math.max(...timestamps)}
          minTimestamp={Math.min(...timestamps)}
        />
      ) : (
        <div className="rd__call-diagnostics__participant-audio-empty">
          Waiting for audio phase and endpoint telemetry…
        </div>
      )}
    </section>
  );
};

const participantKey = (participant: CallDiagnosticsParticipant) =>
  getParticipantDiagnosticsKey(participant.userId, participant.userSessionId);

const getAudioPathStatus = (
  audio: InboundAudioDiagnostics | undefined,
  now: number,
): AudioPathStatus => {
  if (!audio) return 'unmapped';
  if (now - audio.updatedAt > 20_000) return 'stale';
  if (audio.packetsPerSecond === undefined) return 'waiting';
  if (audio.packetsPerSecond === 0) return 'interrupted';
  if (
    (audio.packetLossPercent ?? 0) > 5 ||
    (audio.jitterMs ?? 0) > 50 ||
    (audio.concealmentEventsDelta ?? 0) > 0
  ) {
    return 'degraded';
  }
  return 'healthy';
};

const getReceiverPlaybackStatus = (
  inbound: InboundAudioDiagnostics | undefined,
  playback: PlaybackAudioDiagnostics | undefined,
  now: number,
): ReceiverPlaybackStatus => {
  if (!inbound || inbound.packetsPerSecond === undefined) return 'waiting';
  if (now - inbound.updatedAt > 20_000) return 'stale';
  if (inbound.packetsPerSecond === 0) return 'network-stall';
  if (!playback) return 'waiting';
  if (now - playback.updatedAt > 10_000) return 'playback-stall';
  if (playback.contextState && playback.contextState !== 'running') {
    return 'playback-stall';
  }
  if (
    playback.route === 'media-element' &&
    (playback.elementPaused || (playback.elementReadyState ?? 4) < 2)
  ) {
    return 'playback-stall';
  }

  const decoderHasSignal =
    (inbound.audioLevel ?? 0) > 0.01 || (inbound.audioEnergyDelta ?? 0) > 0;
  const playbackIsSilent =
    playback.averageLevel !== undefined &&
    playback.averageLevel < 0.005 &&
    (playback.silentRatio ?? 0) > 0.8;
  const mediaElementClockStalled =
    playback.route === 'media-element' &&
    (playback.elementClockStalledRatio ?? 0) > 0.8;
  if (decoderHasSignal && (playbackIsSilent || mediaElementClockStalled)) {
    return 'playback-stall';
  }
  if (
    (inbound.packetLossPercent ?? 0) > 5 ||
    (inbound.concealmentEventsDelta ?? 0) > 0
  ) {
    return 'degraded';
  }
  return 'healthy';
};

const getReceiverDiagnosis = (
  receiver: ParticipantDiagnostics | undefined,
  publishers: ReceiverPublisherRow[],
): { title: string; detail: string; severity: AudioStageStatus } => {
  const mapped = publishers.filter(({ inbound }) => inbound);
  if (mapped.length === 0) {
    return {
      title: 'Waiting for receiver track mappings',
      detail:
        'No inbound audio SSRC has been attributed to a publisher on this receiver yet.',
      severity: 'unknown',
    };
  }
  const networkStalls = mapped.filter(
    ({ status }) => status === 'network-stall',
  );
  const playbackStalls = mapped.filter(
    ({ status }) => status === 'playback-stall',
  );
  if (playbackStalls.length >= 2) {
    return {
      title: `Receiver-wide playback failure: ${playbackStalls.length}/${mapped.length} sources affected`,
      detail:
        receiver?.playbackAudioContextState === 'running'
          ? 'Packets and decoder signal continue, but multiple playback bindings are silent. Investigate the shared Safari output graph, output route and sample-rate transition.'
          : `The shared playback AudioContext is ${receiver?.playbackAudioContextState || 'not reporting'}.`,
      severity: 'critical',
    };
  }
  if (playbackStalls.length === 1) {
    return {
      title: 'Publisher-specific playback failure detected',
      detail:
        'This receiver decodes that publisher while its browser playback binding is silent. Investigate per-track binding and sample-rate conversion, not the SFU.',
      severity: 'critical',
    };
  }
  if (networkStalls.length > 0) {
    return {
      title: `${networkStalls.length} receiver downlink path${networkStalls.length === 1 ? '' : 's'} stalled`,
      detail:
        'Packets stopped before browser playout. Investigate SFU downtrack, receiver network and subscription state.',
      severity: 'critical',
    };
  }
  const degraded = mapped.filter(({ status }) => status === 'degraded');
  if (degraded.length > 0) {
    return {
      title: `${degraded.length} decoded-to-playback path${degraded.length === 1 ? '' : 's'} suspicious`,
      detail:
        'Audio still flows, but packet loss or concealment needs correlation with the endpoint and sample-rate event timeline.',
      severity: 'degraded',
    };
  }
  if (mapped.some(({ status }) => status === 'waiting')) {
    return {
      title: 'Waiting for browser playback reports',
      detail:
        'Receiver RTP is mapped. The Web SDK has not delivered enough output-side samples for a verdict yet.',
      severity: 'unknown',
    };
  }
  return {
    title: `Decode and browser playback agree for ${mapped.length}/${publishers.length} mapped sources`,
    detail:
      'No decoded-to-playback divergence is visible in the latest receiver sample.',
    severity: 'healthy',
  };
};

const getReceiverStageStatus = (
  rows: ReceiverPublisherRow[],
  stage: 'decoder' | 'network' | 'playback',
): AudioStageStatus => {
  if (rows.length === 0) return 'unknown';
  if (stage === 'network') {
    if (rows.some(({ status }) => status === 'network-stall'))
      return 'critical';
    return rows.some(({ inbound }) => inbound) ? 'healthy' : 'unknown';
  }
  if (stage === 'decoder') {
    if (
      rows.some(
        ({ inbound }) =>
          (inbound?.packetsPerSecond ?? 0) > 0 &&
          inbound?.audioLevel === undefined,
      )
    ) {
      return 'degraded';
    }
    return rows.some(({ inbound }) => inbound?.audioLevel !== undefined)
      ? 'healthy'
      : 'unknown';
  }
  if (rows.some(({ status }) => status === 'playback-stall')) return 'critical';
  if (rows.some(({ status }) => status === 'degraded')) return 'degraded';
  return rows.some(({ playback }) => playback) ? 'healthy' : 'unknown';
};

const getFanoutDiagnosis = (
  source: ParticipantDiagnostics | undefined,
  receivers: Array<{
    audio: InboundAudioDiagnostics | undefined;
    status: AudioPathStatus;
  }>,
): { title: string; detail: string; severity: AudioStageStatus } => {
  const mapped = receivers.filter(({ audio }) => audio);
  const interrupted = mapped.filter(({ status }) => status === 'interrupted');
  if (mapped.length === 0) {
    return {
      title: 'Waiting for receiver track mappings',
      detail:
        'The live stream is connected, but no receiver audio SSRC has been attributed to this source yet.',
      severity: 'unknown',
    };
  }
  if (mapped.every(({ status }) => status === 'waiting')) {
    return {
      title: 'Waiting for a second audio sample',
      detail:
        'The receiver paths are mapped. One more RTC stats report is required to calculate packet deltas.',
      severity: 'unknown',
    };
  }
  if (interrupted.length >= 2) {
    if (source?.publishAudioPacketsPerSecond === 0) {
      return {
        title: `Shared interruption: ${interrupted.length}/${mapped.length} receivers affected`,
        detail:
          'The publisher also stopped producing RTP packets. The failure is before SFU fan-out, but pre/post-Krisp energy is still required to isolate capture from processing.',
        severity: 'critical',
      };
    }
    return {
      title: `Shared interruption: ${interrupted.length}/${mapped.length} receivers affected`,
      detail:
        'Publisher RTP continued. The failure is between publisher output and the affected receivers; SFU ingress/egress metrics are required for a hard verdict.',
      severity: 'critical',
    };
  }
  if (interrupted.length === 1) {
    return {
      title: 'Receiver-specific interruption detected',
      detail:
        'Other mapped receivers continued receiving the source, so investigate this receiver’s downlink, browser playback and output route.',
      severity: 'degraded',
    };
  }
  const degraded = mapped.filter(({ status }) => status === 'degraded');
  if (degraded.length > 0) {
    return {
      title: `${degraded.length} receiver path${degraded.length === 1 ? '' : 's'} degraded`,
      detail:
        'Packets still flow, but loss, jitter or concealment crossed the diagnostic threshold.',
      severity: 'degraded',
    };
  }
  return {
    title: `Audio is reaching ${mapped.length}/${receivers.length} mapped receivers`,
    detail:
      'No packet stall or concealment event is visible in the latest sample.',
    severity: 'healthy',
  };
};

const getKrispStatus = (
  report: ParticipantDiagnostics | undefined,
): AudioStageStatus => {
  if (!report?.noiseCancellationState) return 'unknown';
  if (
    report.noiseCancellationState === 'overloaded' ||
    report.noiseCancellationState === 'error'
  ) {
    return 'critical';
  }
  if (report.noiseCancellationState === 'suspended') return 'degraded';
  return 'healthy';
};

const formatPathStatus = (status: AudioPathStatus) =>
  status === 'unmapped'
    ? 'No mapped stream'
    : status === 'waiting'
      ? 'Waiting for delta'
      : status === 'interrupted'
        ? 'Interrupted'
        : status;

const formatReceiverPlaybackStatus = (status: ReceiverPlaybackStatus) =>
  status === 'network-stall'
    ? 'Downlink stalled'
    : status === 'playback-stall'
      ? 'Browser playout stalled'
      : status;

const formatPacketRate = (value?: number) =>
  value === undefined ? '—' : `${value.toFixed(1)} pkt/s`;

const formatAudioLevel = (value?: number) =>
  value === undefined ? '—' : `${Math.round(value * 100)}%`;

const formatSampleRate = (value?: number) =>
  value === undefined ? '—' : `${value / 1000} kHz`;

const formatSampleRatePair = (playback?: PlaybackAudioDiagnostics) =>
  !playback
    ? '—'
    : `${formatSampleRate(playback.trackSampleRate)} → ${formatSampleRate(
        playback.contextSampleRate,
      )}`;

const formatDeviceId = (deviceId: string) =>
  deviceId.length <= 12
    ? deviceId
    : `${deviceId.slice(0, 6)}…${deviceId.slice(-4)}`;

const getHealth = (
  report: ParticipantDiagnostics | undefined,
  age: number | undefined,
) => {
  if (!report || age === undefined) return 'waiting';
  if (age > 20_000) return 'stale';
  if (
    (report.roundTripTimeMs ?? 0) > 400 ||
    (report.receivePacketLossPercent ?? 0) > 5 ||
    (report.publishPacketLossPercent ?? 0) > 5
  ) {
    return 'poor';
  }
  if (
    (report.roundTripTimeMs ?? 0) > 150 ||
    (report.receivePacketLossPercent ?? 0) > 2 ||
    (report.publishPacketLossPercent ?? 0) > 2
  ) {
    return 'degraded';
  }
  return 'healthy';
};

const formatMs = (value?: number) =>
  value === undefined ? '—' : `${Math.round(value)} ms`;

const formatBitrate = (value?: number) => {
  if (value === undefined) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} Mbps`;
  return `${Math.round(value / 1000)} kbps`;
};

const formatPercent = (value?: number) =>
  value === undefined ? '—' : `${value.toFixed(2)}%`;

const formatVideo = (resolution?: string, fps?: number) => {
  if (!resolution && fps === undefined) return '—';
  return `${resolution || '—'}${fps === undefined ? '' : ` @ ${Math.round(fps)} fps`}`;
};

const formatAge = (age: number) =>
  age < 1000 ? 'less than a second' : `${Math.floor(age / 1000)}s`;
