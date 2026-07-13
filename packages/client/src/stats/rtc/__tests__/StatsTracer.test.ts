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

    await tracer.takeSample();
    const { delta } = tracer.getPendingDeltas().at(-1)!;

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

    await tracer.takeSample();
    const { delta } = tracer.getPendingDeltas().at(-1)!;

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

    await tracer.takeSample();
    const { delta } = tracer.getPendingDeltas().at(-1)!;

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

    await tracer.takeSample();
    const { delta } = tracer.getPendingDeltas().at(-1)!;

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

    await tracer.takeSample();
    const { delta } = tracer.getPendingDeltas().at(-1)!;

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

    await tracer.takeSample();
    const { delta } = tracer.getPendingDeltas().at(-1)!;

    expect(delta.timestamp).toBe(WALL_NOW + 99_999);
  });
});

// Builds an RTCStatsReport from rich per-report fields (id is added for you).
const richReport = (
  entries: Record<string, Record<string, unknown>>,
): RTCStatsReport => {
  const map = new Map<string, RTCStats>();
  for (const [id, fields] of Object.entries(entries)) {
    map.set(id, { id, ...fields } as unknown as RTCStats);
  }
  return map as unknown as RTCStatsReport;
};

// A pc mock whose getStats() returns a different report on each successive call.
const makeSeqPc = (reports: RTCStatsReport[]): RTCPeerConnection => {
  const getStats = vi.fn();
  for (const r of reports) getStats.mockResolvedValueOnce(r);
  return { getStats } as unknown as RTCPeerConnection;
};

// Mirrors the server-side accumulator: applies chained deltas in order,
// un-zeroing each report's hoisted timestamp.
const applyChain = (
  baseline: Record<string, any>,
  deltas: Array<Record<string, any>>,
): Record<string, any> => {
  const acc: Record<string, any> = JSON.parse(JSON.stringify(baseline));
  for (const delta of deltas) {
    const top = delta.timestamp;
    for (const [id, report] of Object.entries(delta)) {
      if (id === 'timestamp') continue;
      const target = (acc[id] ??= {});
      for (const [k, v] of Object.entries(report as Record<string, unknown>)) {
        target[k] = k === 'timestamp' && v === 0 ? top : v;
      }
    }
  }
  return acc;
};

describe('StatsTracer pending delta chain', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(WALL_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accumulates one delta per get() in the pending chain', async () => {
    const pc = makeSeqPc([
      makeReport([{ id: 'a', timestamp: WALL_NOW }]),
      makeReport([{ id: 'a', timestamp: WALL_NOW + 1000 }]),
    ]);
    const tracer = new StatsTracer(pc, PeerType.SUBSCRIBER, new Map(), 0);

    await tracer.takeSample();
    await tracer.takeSample();

    expect(tracer.getPendingDeltas()).toHaveLength(2);
  });

  it('commitDeltas removes exactly the committed deltas by identity', async () => {
    const pc = makeSeqPc([
      makeReport([{ id: 'a', timestamp: WALL_NOW }]),
      makeReport([{ id: 'a', timestamp: WALL_NOW + 1000 }]),
    ]);
    const tracer = new StatsTracer(pc, PeerType.SUBSCRIBER, new Map(), 0);

    await tracer.takeSample();
    await tracer.takeSample();
    const sent = tracer.getPendingDeltas();
    tracer.commitDeltas(sent.slice(0, 1));

    const remaining = tracer.getPendingDeltas();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toBe(sent[1]);
  });

  it('clearPendingDeltas empties the chain', async () => {
    const pc = makeSeqPc([
      makeReport([{ id: 'a', timestamp: WALL_NOW }]),
      makeReport([{ id: 'a', timestamp: WALL_NOW + 1000 }]),
    ]);
    const tracer = new StatsTracer(pc, PeerType.SUBSCRIBER, new Map(), 0);

    await tracer.takeSample();
    await tracer.takeSample();
    tracer.clearPendingDeltas();

    expect(tracer.getPendingDeltas()).toHaveLength(0);
  });

  it('reconstructs every sample by applying the un-acked chain in order', async () => {
    const s0 = richReport({ a: { timestamp: WALL_NOW, bytes: 100 } });
    const s1 = richReport({ a: { timestamp: WALL_NOW + 1000, bytes: 200 } });
    const s2 = richReport({ a: { timestamp: WALL_NOW + 2000, bytes: 350 } });
    const tracer = new StatsTracer(
      makeSeqPc([s0, s1, s2]),
      PeerType.SUBSCRIBER,
      new Map(),
      0,
    );

    await tracer.takeSample();
    await tracer.takeSample();
    await tracer.takeSample();
    const chain = tracer.getPendingDeltas().map((p) => p.delta);

    expect(applyChain({}, chain)).toEqual({
      a: { timestamp: WALL_NOW + 2000, bytes: 350 },
    });
  });

  it('re-anchors with a full snapshot when the chain exceeds the cap', async () => {
    const s0 = richReport({ a: { timestamp: WALL_NOW, bytes: 100 } });
    const s1 = richReport({ a: { timestamp: WALL_NOW + 1000, bytes: 200 } });
    const s2 = richReport({ a: { timestamp: WALL_NOW + 2000, bytes: 350 } });
    const tracer = new StatsTracer(
      makeSeqPc([s0, s1, s2]),
      PeerType.SUBSCRIBER,
      new Map(),
      0,
      2, // maxPendingDeltas
    );

    await tracer.takeSample();
    await tracer.takeSample(); // chain now at the cap
    await tracer.takeSample(); // exceeds cap -> re-anchor

    const chain = tracer.getPendingDeltas();
    expect(chain).toHaveLength(1);
    // the single re-anchored delta is a full snapshot of S2
    expect(applyChain({}, [chain[0].delta])).toEqual({
      a: { timestamp: WALL_NOW + 2000, bytes: 350 },
    });
  });

  it('keeps a re-anchored keyframe when a stale commit lands afterwards', async () => {
    const s0 = richReport({ a: { timestamp: WALL_NOW, bytes: 100 } });
    const s1 = richReport({ a: { timestamp: WALL_NOW + 1000, bytes: 200 } });
    const s2 = richReport({ a: { timestamp: WALL_NOW + 2000, bytes: 350 } });
    const tracer = new StatsTracer(
      makeSeqPc([s0, s1, s2]),
      PeerType.SUBSCRIBER,
      new Map(),
      0,
      2,
    );

    await tracer.takeSample();
    await tracer.takeSample();
    const sent = tracer.getPendingDeltas(); // captured before re-anchor
    await tracer.takeSample(); // re-anchors, dropping `sent`
    tracer.commitDeltas(sent); // stale commit, must be a no-op

    expect(tracer.getPendingDeltas()).toHaveLength(1);
  });
});

const deferred = <T>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe('StatsTracer concurrent sampling', () => {
  it('serializes overlapping get() calls so the chain stays in call order', async () => {
    const dA = deferred<RTCStatsReport>();
    const dB = deferred<RTCStatsReport>();
    const getStats = vi
      .fn()
      .mockReturnValueOnce(dA.promise)
      .mockReturnValueOnce(dB.promise);
    const pc = { getStats } as unknown as RTCPeerConnection;
    const tracer = new StatsTracer(pc, PeerType.SUBSCRIBER, new Map(), 0);

    const pA = tracer.takeSample();
    const pB = tracer.takeSample();

    // the second sample must not start until the first completes
    expect(getStats).toHaveBeenCalledTimes(1);

    // resolve the first sample; only then should the second getStats fire
    dA.resolve(richReport({ a: { timestamp: 1000, bytes: 100 } }));
    await pA;
    expect(getStats).toHaveBeenCalledTimes(2);

    dB.resolve(richReport({ a: { timestamp: 2000, bytes: 200 } }));
    await pB;

    // chain applied in call order reconstructs the second (newer) sample
    const chain = tracer.getPendingDeltas().map((p) => p.delta);
    expect(chain).toHaveLength(2);
    expect(applyChain({}, chain)).toEqual({
      a: { timestamp: 2000, bytes: 200 },
    });
  });
});
