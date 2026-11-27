import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HlsStatsReporter } from '../HlsStatsReporter';
import { HlsStatsTracer } from '../HlsStatsTracer';

type Call = { body: any };

/** The reporter's options, with the given `stats_options`. */
const reporterOptions = (tracer: HlsStatsTracer, options: object) => ({
  options: options as any,
  statsToken: 'token',
  callSessionId: 'session',
  callType: 'livestream',
  callId: 'test',
  unifiedSessionId: 'unified',
  clientDetails: {} as any,
  tracer,
  sample: () => tracer.sample(),
});

/**
 * A started reporter and its tracer. `respond` decides each request's outcome:
 * resolve, or throw a network error or an HTTP status.
 */
const setup = (
  respond: (body: any, n: number) => 'ok' | 'network' | number = () => 'ok',
  // an hour: no `stats` report within a test unless it asks for one
  reportingIntervalMs = 3_600_000,
) => {
  const calls: Call[] = [];
  const streamClient = {
    doAxiosRequest: vi.fn(async (_m: string, _u: string, body: any) => {
      const copy = JSON.parse(JSON.stringify(body));
      calls.push({ body: copy });
      const outcome = respond(copy, calls.length);
      if (outcome === 'network') throw new Error('Network Error');
      if (typeof outcome === 'number')
        throw Object.assign(new Error('HTTP'), { status: outcome });
      return {};
    }),
  };
  const tracer = new HlsStatsTracer();
  const reporter = new HlsStatsReporter(
    streamClient as any,
    reporterOptions(tracer, { reporting_hls_interval_ms: reportingIntervalMs }),
  );
  reporter.start();
  const types = () => calls.map((c) => c.body.type);
  return { calls, types, tracer, reporter };
};

describe('HlsStatsReporter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps `started` ahead of `ended` while retrying', async () => {
    const { types, tracer, reporter } = setup((body, n) =>
      body.type === 'started' && n === 1 ? 'network' : 'ok',
    );
    tracer.onState('playing');
    await vi.advanceTimersByTimeAsync(0); // `started` failed, retry in 1 s

    const ended = reporter.stop(); // the viewer leaves meanwhile
    await vi.advanceTimersByTimeAsync(1_000);
    await ended;

    expect(types()).toEqual(['started', 'started', 'ended']);
  });

  it('does not start once stopped', async () => {
    const types: string[] = [];
    const streamClient = {
      doAxiosRequest: vi.fn(async (_m: string, _u: string, body: any) => {
        types.push(body.type);
      }),
    };
    const tracer = new HlsStatsTracer();
    const reporter = new HlsStatsReporter(
      streamClient as any,
      reporterOptions(tracer, { reporting_hls_interval_ms: 10_000 }),
    );
    reporter.start();

    // e.g. the app unregistered the player as it started
    await reporter.stop();
    tracer.onState('playing');
    await vi.advanceTimersByTimeAsync(30_000);

    expect(types).toEqual([]);
  });

  it('retries `ended` three times, with the same timestamp', async () => {
    const { calls, types, tracer, reporter } = setup((body) =>
      body.type === 'ended' ? 'network' : 'ok',
    );
    tracer.onState('playing');
    await vi.advanceTimersByTimeAsync(0);

    const ended = reporter.stop();
    await vi.advanceTimersByTimeAsync(10_000);
    await ended;

    expect(types()).toEqual(['started', 'ended', 'ended', 'ended', 'ended']);
    expect(calls[4].body.timestamp).toBe(calls[1].body.timestamp);
  });

  it('skips a `stats` report while one is sending', async () => {
    const types: string[] = [];
    const streamClient = {
      // a slow network: each report takes 25 s
      doAxiosRequest: vi.fn(async (_m: string, _u: string, body: any) => {
        types.push(body.type);
        await new Promise((resolve) => setTimeout(resolve, 25_000));
      }),
    };
    const tracer = new HlsStatsTracer();
    const reporter = new HlsStatsReporter(
      streamClient as any,
      reporterOptions(tracer, { reporting_hls_interval_ms: 10_000 }),
    );
    reporter.start();
    tracer.onState('playing');
    // `started` sends until 25 s: the 10 and 20 s ticks are skipped
    await vi.advanceTimersByTimeAsync(60_000);

    expect(types).toEqual(['started', 'stats', 'stats']);
    const ended = reporter.stop();
    await vi.advanceTimersByTimeAsync(50_000);
    await ended;
    expect(types).toEqual(['started', 'stats', 'stats', 'ended']);
  });

  it('sends the events of a failed `stats` with the next one', async () => {
    const { calls, types, tracer, reporter } = setup(
      (body, n) => (body.type === 'stats' && n === 2 ? 'network' : 'ok'),
      10_000,
    );
    tracer.onState('playing');
    tracer.onState('buffering'); // stall_start
    await vi.advanceTimersByTimeAsync(10_000); // stats fails
    await vi.advanceTimersByTimeAsync(10_000); // next stats

    expect(types()).toEqual(['started', 'stats', 'stats']);
    expect(calls[2].body.events.map((e: any) => e.type)).toEqual([
      'stall_start',
    ]);
    await reporter.stop();
  });

  it('drops the events of a rejected report', async () => {
    const { calls, tracer, reporter } = setup(
      (body, n) => (body.type === 'stats' && n === 2 ? 400 : 'ok'),
      10_000,
    );
    tracer.onState('playing');
    tracer.onState('buffering'); // stall_start
    await vi.advanceTimersByTimeAsync(10_000); // rejected
    await vi.advanceTimersByTimeAsync(10_000);

    expect(calls[1].body.events.map((e: any) => e.type)).toEqual([
      'stall_start',
    ]);
    expect(calls[2].body.events).toBeUndefined();
    await reporter.stop();
  });

  it('stops reporting when the stats token is refused', async () => {
    const { types, tracer, reporter } = setup(
      (body) => (body.type === 'started' ? 403 : 'ok'),
      10_000,
    );
    tracer.onState('playing');
    await vi.advanceTimersByTimeAsync(30_000);
    await reporter.stop();

    expect(types()).toEqual(['started']);
  });

  it('keeps reporting after a failure and ends with its code', async () => {
    const { calls, types, tracer, reporter } = setup(() => 'ok', 10_000);
    tracer.onState('playing');
    await vi.advanceTimersByTimeAsync(5_000);

    await reporter.fail('fragLoadError 404');
    // a stall once playback failed is not counted
    tracer.onState('buffering');
    await vi.advanceTimersByTimeAsync(20_000);
    await reporter.stop();

    expect(types()).toEqual(['started', 'stats', 'stats', 'ended']);
    expect(calls[1].body.events).toEqual([
      expect.objectContaining({
        type: 'error',
        data: { code: 'fragLoadError 404' },
      }),
    ]);
    expect(calls[2].body.events).toBeUndefined();
    expect(calls[3].body).toMatchObject({
      type: 'ended',
      end_reason: 'error',
      error_code: 'fragLoadError 404',
      stats: { watch_duration_ms: 5_000, stall_count: 0 },
    });
  });

  it('sends only HLS events when the event buffer overflows', async () => {
    const { calls, tracer, reporter } = setup();
    tracer.onState('playing');
    await vi.advanceTimersByTimeAsync(0);
    for (let i = 0; i < 60; i++) {
      tracer.onState('buffering');
      tracer.onState('playing');
    }
    await reporter.stop();

    const types = calls[1].body.events.map((e: any) => e.type);
    expect(types).not.toContain('traceBufferOverflow');
    expect(types.length).toBeGreaterThan(90);
  });

  it('sends nothing when stopped before the first frame', async () => {
    const { types, reporter } = setup();
    await reporter.stop();
    expect(types()).toEqual([]);
  });

  it('ends at once when playback fails before the first frame', async () => {
    const { calls, types, reporter } = setup(() => 'ok', 10_000);
    await reporter.fail('levelParsingError');
    await vi.advanceTimersByTimeAsync(20_000);
    await reporter.stop();

    expect(types()).toEqual(['ended']);
    expect(calls[0].body).toMatchObject({
      end_reason: 'error',
      error_code: 'levelParsingError',
    });
  });
});

describe('HlsStatsReporter interval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** The `stats` reports sent in a minute of playback, with these options. */
  const statsInAMinute = async (options: object) => {
    const types: string[] = [];
    const streamClient = {
      doAxiosRequest: vi.fn(async (_m: string, _u: string, body: any) => {
        types.push(body.type);
      }),
    };
    const tracer = new HlsStatsTracer();
    const reporter = new HlsStatsReporter(
      streamClient as any,
      reporterOptions(tracer, options),
    );
    reporter.start();
    tracer.onState('playing');
    await vi.advanceTimersByTimeAsync(60_000);
    await reporter.stop();
    return types.filter((type) => type === 'stats').length;
  };

  it('uses the HLS interval, then the WebRTC one, then 10 s', async () => {
    expect(
      await statsInAMinute({
        reporting_hls_interval_ms: 5_000,
        reporting_interval_ms: 20_000,
      }),
    ).toBe(12);
    expect(await statsInAMinute({ reporting_interval_ms: 20_000 })).toBe(3);
    expect(await statsInAMinute({})).toBe(6);
  });
});
