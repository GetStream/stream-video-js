import { describe, expect, it, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { SfuStatsReporter } from '../SfuStatsReporter';
import { promiseWithResolvers } from '../../helpers/promise';

// A FinishedUnaryCall-shaped success (no application-layer error).
const okResponse = { response: {} };

const makeSlice = () => ({ snapshot: [] as unknown[], rollback: vi.fn() });

const makeStats = (pending: Array<{ delta: object; ts: number }>) => ({
  takeSample: vi.fn().mockResolvedValue({
    performanceStats: [],
    stats: new Map(),
  }),
  getPendingDeltas: vi.fn(() => pending),
  commitDeltas: vi.fn(),
  clearPendingDeltas: vi.fn(),
});

const makeTracer = (id: string) => ({
  take: vi.fn(makeSlice),
  trace: vi.fn(),
  traceId: id,
});

const build = (
  opts: { withTracer?: boolean; withPublisher?: boolean } = {},
) => {
  const withTracer = opts.withTracer ?? true;
  const subPending = [{ delta: { sub: 1 }, ts: 111 }];
  const pubPending = [{ delta: { pub: 1 }, ts: 222 }];

  const subStats = makeStats(subPending);
  const subTracer = withTracer ? makeTracer('sub-id') : undefined;
  const subscriber = { stats: subStats, tracer: subTracer };

  let publisher: unknown;
  let pubStats: ReturnType<typeof makeStats> | undefined;
  if (opts.withPublisher) {
    pubStats = makeStats(pubPending);
    publisher = {
      stats: pubStats,
      tracer: withTracer ? makeTracer('pub-id') : undefined,
    };
  }

  const sendStats = vi.fn().mockResolvedValue(okResponse);
  const sfuClient = { sendStats, getTrace: vi.fn(() => undefined) };
  const callTracer = { take: vi.fn(makeSlice), setEnabled: vi.fn() };

  // device permission is 'denied' so observeDevice() doesn't reach listDevices()
  const microphone = {
    state: { browserPermissionState$: new BehaviorSubject('denied') },
  };
  const camera = {
    state: { browserPermissionState$: new BehaviorSubject('denied') },
  };
  const state = { ownCapabilities$: new BehaviorSubject([]) };

  const reporter = new SfuStatsReporter(sfuClient as never, {
    options: { reporting_interval_ms: 1000, enable_rtc_stats: true } as never,
    clientDetails: { sdk: undefined, browser: undefined } as never,
    subscriber: subscriber as never,
    publisher: publisher as never,
    microphone: microphone as never,
    camera: camera as never,
    state: state as never,
    tracer: callTracer as never,
    unifiedSessionId: 'unified',
  });

  return {
    reporter,
    sendStats,
    subStats,
    subTracer,
    pubStats,
    callTracer,
    subPending,
    pubPending,
  };
};

describe('SfuStatsReporter delta delivery', () => {
  it('commits the un-acked chain after a successful send', async () => {
    const t = build();
    t.reporter.flush();
    await vi.waitFor(() => expect(t.subStats.commitDeltas).toHaveBeenCalled());
    expect(t.subStats.commitDeltas).toHaveBeenCalledWith(t.subPending);
  });

  it('does not re-trace the delta into the peer-connection tracer', async () => {
    const t = build();
    t.reporter.flush();
    await vi.waitFor(() => expect(t.sendStats).toHaveBeenCalled());
    expect(t.subTracer!.trace).not.toHaveBeenCalled();
  });

  it('ships the un-acked chain as getstats records inside rtcStats', async () => {
    const t = build();
    t.reporter.flush();
    await vi.waitFor(() => expect(t.sendStats).toHaveBeenCalled());
    const traces = JSON.parse(t.sendStats.mock.calls[0][0].rtcStats);
    expect(traces).toContainEqual(['getstats', 'sub-id', { sub: 1 }, 111]);
  });

  it('retains the chain and rolls back generic traces on send failure', async () => {
    const t = build();
    const slice = makeSlice();
    t.callTracer.take.mockReturnValue(slice);
    t.sendStats.mockRejectedValue(new Error('network down'));

    t.reporter.flush();
    await vi.waitFor(() => expect(slice.rollback).toHaveBeenCalled());
    expect(t.subStats.commitDeltas).not.toHaveBeenCalled();
  });

  it('treats an SFU application error as a failed send (no commit, rolls back)', async () => {
    const t = build();
    const slice = makeSlice();
    t.callTracer.take.mockReturnValue(slice);
    t.sendStats.mockResolvedValue({
      response: { error: { code: 1, message: 'rejected', shouldRetry: false } },
    });

    t.reporter.flush();
    await vi.waitFor(() => expect(slice.rollback).toHaveBeenCalled());
    expect(t.subStats.commitDeltas).not.toHaveBeenCalled();
  });

  it('flush() resolves once the sample is taken, without awaiting the send', async () => {
    const t = build();
    const dGet = promiseWithResolvers<object>();
    t.subStats.takeSample.mockReturnValue(dGet.promise); // sampling hangs
    t.sendStats.mockReturnValue(promiseWithResolvers<object>().promise); // send would hang too

    let resolved = false;
    const flushed = Promise.resolve(t.reporter.flush()).then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false); // still sampling -> flush not resolved

    dGet.resolve({ delta: {}, performanceStats: [], stats: new Map() });
    await flushed;
    expect(resolved).toBe(true); // resolves after the sample, not the send
  });

  it('samples on an explicit flush even while a previous send is in flight', async () => {
    const t = build();
    const d = promiseWithResolvers<object>();
    t.sendStats.mockReturnValueOnce(d.promise).mockResolvedValue(okResponse);

    t.reporter.flush(); // flush #1: samples, fires the slow send
    await vi.waitFor(() => expect(t.sendStats).toHaveBeenCalledTimes(1));

    await t.reporter.flush(); // flush #2: must sample now, not wait for send #1
    expect(t.subStats.takeSample).toHaveBeenCalledTimes(2);

    d.resolve(okResponse);
  });

  it('does not sample after stop()', async () => {
    const t = build();
    t.reporter.stop();
    await t.reporter.flush();
    expect(t.subStats.takeSample).not.toHaveBeenCalled();
  });

  it('skips overlapping scheduled reports while a run is in flight', async () => {
    vi.useFakeTimers();
    try {
      const t = build();
      const d = promiseWithResolvers<object>();
      t.sendStats.mockReturnValue(d.promise); // first scheduled send hangs

      t.reporter.start();
      await vi.advanceTimersByTimeAsync(1500); // first scheduled tick -> run in flight
      expect(t.subStats.takeSample).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(3000); // next tick must be skipped
      expect(t.subStats.takeSample).toHaveBeenCalledTimes(1);

      d.resolve(okResponse);
      t.reporter.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears the chain instead of sending it when delta tracing is disabled', async () => {
    const t = build({ withTracer: false });
    t.reporter.flush();
    await vi.waitFor(() => expect(t.sendStats).toHaveBeenCalled());

    expect(t.subStats.clearPendingDeltas).toHaveBeenCalled();
    expect(t.subStats.commitDeltas).not.toHaveBeenCalled();
    const traces = JSON.parse(t.sendStats.mock.calls[0][0].rtcStats);
    expect(traces.some((r: unknown[]) => r[0] === 'getstats')).toBe(false);
  });
});
