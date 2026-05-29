import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StatsTracer } from '../StatsTracer';
import { PeerType } from '../../../gen/video/sfu/models/models';

const WALL_NOW = 1_700_000_000_000;
const THRESHOLD_MS = 5000;

const makeReport = (
  entries: Array<{ id: string; timestamp: number }>,
): RTCStatsReport => {
  const map = new Map<string, RTCStats>();
  for (const e of entries) {
    map.set(e.id, { id: e.id, timestamp: e.timestamp, type: 'codec' });
  }
  return map as unknown as RTCStatsReport;
};

const makePc = (report: RTCStatsReport) => {
  return {
    getStats: vi.fn().mockResolvedValue(report),
  } as unknown as RTCPeerConnection;
};

describe('StatsTracer timestamp drift correction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(WALL_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps original timestamps when no entry drifts past the threshold', async () => {
    const report = makeReport([
      { id: 'a', timestamp: WALL_NOW - 1000 },
      { id: 'b', timestamp: WALL_NOW + 2000 },
    ]);
    const tracer = new StatsTracer(
      makePc(report),
      PeerType.SUBSCRIBER,
      new Map(),
      THRESHOLD_MS,
    );

    const { delta } = await tracer.get();

    expect(delta.timestamp).toBe(WALL_NOW + 2000);
  });

  it('replaces drifted timestamps with wall time', async () => {
    const report = makeReport([
      { id: 'a', timestamp: WALL_NOW },
      { id: 'b', timestamp: WALL_NOW + 10_000 },
    ]);
    const tracer = new StatsTracer(
      makePc(report),
      PeerType.SUBSCRIBER,
      new Map(),
      THRESHOLD_MS,
    );

    const { delta } = await tracer.get();

    expect(delta.timestamp).toBe(WALL_NOW);
  });

  it('clamps stale timestamps to wall time (past drift)', async () => {
    const report = makeReport([
      { id: 'a', timestamp: WALL_NOW + 2000 },
      { id: 'b', timestamp: WALL_NOW - 10_000 },
    ]);
    const tracer = new StatsTracer(
      makePc(report),
      PeerType.SUBSCRIBER,
      new Map(),
      THRESHOLD_MS,
    );

    const { delta } = await tracer.get();

    expect(delta['b'].timestamp).toBe(WALL_NOW);
    expect(delta.timestamp).toBe(WALL_NOW + 2000);
  });

  it('keeps timestamps with drift exactly at the threshold (exclusive boundary)', async () => {
    const report = makeReport([
      { id: 'a', timestamp: WALL_NOW },
      { id: 'b', timestamp: WALL_NOW + THRESHOLD_MS },
    ]);
    const tracer = new StatsTracer(
      makePc(report),
      PeerType.SUBSCRIBER,
      new Map(),
      THRESHOLD_MS,
    );

    const { delta } = await tracer.get();

    expect(delta.timestamp).toBe(WALL_NOW + THRESHOLD_MS);
  });

  it('clamps remote-sourced stat types like any other stat (no special handling)', async () => {
    const map = new Map<string, RTCStats>([
      ['anchor', { id: 'anchor', timestamp: WALL_NOW + 2000, type: 'codec' }],
      [
        'remote-in',
        {
          id: 'remote-in',
          timestamp: WALL_NOW - 30_000,
          type: 'remote-inbound-rtp',
        },
      ],
      [
        'remote-out',
        {
          id: 'remote-out',
          timestamp: WALL_NOW + 30_000,
          type: 'remote-outbound-rtp',
        },
      ],
    ]);
    const tracer = new StatsTracer(
      makePc(map as unknown as RTCStatsReport),
      PeerType.SUBSCRIBER,
      new Map(),
      THRESHOLD_MS,
    );

    const { delta } = await tracer.get();

    // both stale and future drift get clamped to wall time, while the
    // within-threshold anchor stays the delta's top-level timestamp.
    expect(delta['remote-in'].timestamp).toBe(WALL_NOW);
    expect(delta['remote-out'].timestamp).toBe(WALL_NOW);
    expect(delta.timestamp).toBe(WALL_NOW + 2000);
  });

  it('does not correct when the threshold is disabled (0)', async () => {
    const report = makeReport([
      { id: 'a', timestamp: WALL_NOW },
      { id: 'b', timestamp: WALL_NOW + 99_999 },
    ]);
    const tracer = new StatsTracer(
      makePc(report),
      PeerType.SUBSCRIBER,
      new Map(),
      0,
    );

    const { delta } = await tracer.get();

    expect(delta.timestamp).toBe(WALL_NOW + 99_999);
  });
});
