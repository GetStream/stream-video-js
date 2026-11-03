import {
  getParticipantDiagnosticsKey,
  ParticipantDiagnostics,
} from './rtcStats';

export type DiagnosticsHistory = Record<string, ParticipantDiagnostics[]>;

export const diagnosticsWindowMs = 5 * 60 * 1000;
const maxSamplesPerParticipant = 300;

export const appendDiagnosticsSample = (
  history: DiagnosticsHistory,
  sample: ParticipantDiagnostics,
): DiagnosticsHistory => {
  const key = getParticipantDiagnosticsKey(sample.userId, sample.userSessionId);
  const samples = history[key] ?? [];
  const latest = samples.at(-1);

  // Snapshots are replayed after a reconnect. Do not draw them twice or move
  // the chart backwards in time.
  if (latest && latest.updatedAt >= sample.updatedAt) return history;

  const cutoff = sample.updatedAt - diagnosticsWindowMs;
  const nextSamples = [
    ...samples.filter(({ updatedAt }) => updatedAt >= cutoff),
    sample,
  ].slice(-maxSamplesPerParticipant);

  return { ...history, [key]: nextSamples };
};

export const pruneDiagnosticsHistory = (
  history: DiagnosticsHistory,
  participantKeys: Set<string>,
): DiagnosticsHistory => {
  const entries = Object.entries(history).filter(([key]) =>
    participantKeys.has(key),
  );
  if (entries.length === Object.keys(history).length) return history;
  return Object.fromEntries(entries);
};
