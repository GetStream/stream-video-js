import { describe, expect, it } from 'vitest';

import {
  appendDiagnosticsSample,
  diagnosticsWindowMs,
  pruneDiagnosticsHistory,
} from './diagnosticsHistory';
import {
  getParticipantDiagnosticsKey,
  ParticipantDiagnostics,
} from './rtcStats';

const sample = (
  updatedAt: number,
  userId = 'user-1',
): ParticipantDiagnostics => ({
  userId,
  userSessionId: 'session-1',
  updatedAt,
  roundTripTimeMs: updatedAt,
  inboundAudioByPublisher: {},
  playbackAudioByPublisher: {},
  audioEvents: [],
});

describe('diagnosticsHistory', () => {
  it('keeps ordered samples and ignores replayed reports', () => {
    const first = appendDiagnosticsSample({}, sample(1_000));
    const second = appendDiagnosticsSample(first, sample(2_000));
    const replayed = appendDiagnosticsSample(second, sample(2_000));
    const key = getParticipantDiagnosticsKey('user-1', 'session-1');

    expect(second[key].map(({ updatedAt }) => updatedAt)).toEqual([
      1_000, 2_000,
    ]);
    expect(replayed).toBe(second);
  });

  it('retains only the rolling diagnostics window', () => {
    const key = getParticipantDiagnosticsKey('user-1', 'session-1');
    const old = sample(1_000);
    const recent = sample(diagnosticsWindowMs + 999);
    const latest = sample(diagnosticsWindowMs + 1_001);
    const history = appendDiagnosticsSample(
      appendDiagnosticsSample(appendDiagnosticsSample({}, old), recent),
      latest,
    );

    expect(history[key]).toEqual([recent, latest]);
  });

  it('removes participants that are no longer in the call', () => {
    const firstKey = getParticipantDiagnosticsKey('user-1', 'session-1');
    const secondKey = getParticipantDiagnosticsKey('user-2', 'session-1');
    const history = appendDiagnosticsSample(
      appendDiagnosticsSample({}, sample(1_000)),
      sample(1_000, 'user-2'),
    );

    expect(pruneDiagnosticsHistory(history, new Set([secondKey]))).toEqual({
      [secondKey]: history[secondKey],
    });
    expect(history[firstKey]).toHaveLength(1);
  });
});
