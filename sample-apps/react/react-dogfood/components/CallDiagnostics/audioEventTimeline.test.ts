import { describe, expect, it } from 'vitest';

import {
  clusterAudioEvents,
  isEndpointAudioEvent,
  OwnedAudioDiagnosticEvent,
} from './audioEventClusters';
import { AudioDiagnosticEvent } from './rtcStats';

const event = (
  id: string,
  timestamp: number,
  type: AudioDiagnosticEvent['type'],
  severity: AudioDiagnosticEvent['severity'] = 'info',
): OwnedAudioDiagnosticEvent => ({
  event: {
    id,
    label: id,
    severity,
    timestamp,
    type,
  },
  owner: 'Alice',
});

describe('audio event timeline', () => {
  it('clusters endpoint events that happen in a short burst', () => {
    const clusters = clusterAudioEvents([
      event('input', 1_000, 'input-device'),
      event('profile', 1_600, 'bluetooth-profile', 'warning'),
      event('output', 2_100, 'output-device'),
    ]);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].entries).toHaveLength(3);
    expect(clusters[0].severity).toBe('warning');
    expect(clusters[0].timestamp).toBe(1_567);
  });

  it('keeps endpoint bursts separate when the gap is too large', () => {
    const clusters = clusterAudioEvents([
      event('first', 1_000, 'input-device'),
      event('second', 2_501, 'output-device'),
    ]);

    expect(clusters).toHaveLength(2);
  });

  it('does not merge interruption events into endpoint clusters', () => {
    const clusters = clusterAudioEvents([
      event('input', 1_000, 'input-device'),
      event('stall', 1_100, 'receiver-stall', 'critical'),
      event('profile', 1_200, 'bluetooth-profile', 'warning'),
    ]);

    expect(clusters).toHaveLength(2);
    expect(clusters[0].entries).toHaveLength(2);
    expect(clusters[1].entries[0].event.id).toBe('stall');
  });

  it('treats capture lifecycle events as endpoint evidence', () => {
    expect(
      isEndpointAudioEvent(event('capture', 1_000, 'capture-lifecycle').event),
    ).toBe(true);
  });
});
