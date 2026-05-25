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
