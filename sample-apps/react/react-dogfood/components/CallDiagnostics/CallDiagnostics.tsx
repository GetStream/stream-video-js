import { useEffect, useMemo, useState } from 'react';

import {
  createRtcStatsProcessor,
  getParticipantDiagnosticsKey,
  LiveCallStatsMessage,
  ParticipantDiagnostics,
} from './rtcStats';

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
  const [diagnostics, setDiagnostics] = useState<
    Record<string, ParticipantDiagnostics>
  >({});
  const [status, setStatus] = useState<StreamStatus>('connecting');
  const [error, setError] = useState<string>();
  const [now, setNow] = useState(0);
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
              setDiagnostics((current) => ({
                ...current,
                [getParticipantDiagnosticsKey(
                  report.userId,
                  report.userSessionId,
                )]: report,
              }));
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

    setDiagnostics({});
    connect().catch(console.error);
    return () => {
      controller.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [appId, callCID, callSessionId, participants, participantsKey]);

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

      <section className="rd__call-diagnostics__grid">
        {participants.map((participant) => {
          const report =
            diagnostics[
              getParticipantDiagnosticsKey(
                participant.userId,
                participant.userSessionId,
              )
            ];
          const age = report ? Math.max(0, now - report.updatedAt) : undefined;
          const health = getHealth(report, age);
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
                <span className={`rd__call-diagnostics__health is-${health}`}>
                  {health}
                </span>
              </div>

              <div className="rd__call-diagnostics__metrics">
                <Metric label="RTT" value={formatMs(report?.roundTripTimeMs)} />
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

              <footer>
                {age === undefined
                  ? 'Waiting for the first RTC stats report…'
                  : `Updated ${formatAge(age)} ago`}
              </footer>
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
