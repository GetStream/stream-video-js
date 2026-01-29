import { afterEach, describe, expect, it, Mock, vi } from 'vitest';
import { SfuStatsReporter } from './SfuStatsReporter';
import {
  ClientDetails,
  SdkType,
  WebsocketReconnectStrategy,
} from '../gen/video/sfu/models/models';
import { Tracer } from './rtc';
import { StreamClient } from '../coordinator/connection/client';
import { Publisher, Subscriber } from '../rtc';
import { StreamSfuClient } from '../StreamSfuClient';

describe('SfuStatsReporter', () => {
  const clientDetails: ClientDetails = {
    sdk: { type: SdkType.REACT, major: '1', minor: '0', patch: '0' },
    browser: { name: 'Chrome', version: '99' },
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends legacy stats via sfuClient.sendStats when useLegacyStats=true', async () => {
    const sfuClient = createSfuClient();
    const streamClient = createStreamClient();
    const subscriber = createSubscriber();
    const publisher = createPublisher();
    const tracer = new Tracer(null);

    const reporter = new SfuStatsReporter(sfuClient, streamClient, {
      options: { reporting_interval_ms: 1000, enable_rtc_stats: true },
      clientDetails,
      subscriber,
      publisher,
      tracer,
      unifiedSessionId: 'unified-1',
      basePath: '/base',
      useLegacyStats: true,
    });

    // @ts-expect-error private api
    await reporter.run();

    expect(sfuClient.sendStats).toHaveBeenCalledTimes(1);
    expect(streamClient.doAxiosRequest).not.toHaveBeenCalled();
    expect(sfuClient.sendMetrics).not.toHaveBeenCalled();

    const payload = (sfuClient.sendStats as Mock).mock.calls[0][0];
    expect(payload.sessionId).toBe('user-session-1');
    expect(payload.sdk).toBe('stream-react');
    expect(payload.sdkVersion).toBe('1.0.0');
    expect(payload.webrtcVersion).toBe('Chrome-99');
    expect(payload.unifiedSessionId).toBe('unified-1');
    expect(payload.rtcStats).toBeDefined();

    expect(payload.encodeStats).toBeDefined();
    expect(payload.decodeStats).toBeDefined();
    expect(payload.deviceState).toBeDefined();

    expect(payload.subscriberStats).toBe(JSON.stringify([{ id: 's1' }]));
    expect(payload.publisherStats).toBe(JSON.stringify([{ id: 's1' }]));
  });

  it('sends coordinator stats and metrics when useLegacyStats=false', async () => {
    const sfuClient = createSfuClient();
    const streamClient = createStreamClient();
    const subscriber = createSubscriber();
    const publisher = createPublisher();
    const tracer = new Tracer(null);

    const reporter = new SfuStatsReporter(sfuClient, streamClient, {
      options: { reporting_interval_ms: 1000, enable_rtc_stats: true },
      clientDetails,
      subscriber,
      publisher,
      tracer,
      unifiedSessionId: 'unified-2',
      basePath: '',
      useLegacyStats: false,
    });

    reporter.sendConnectionTime(12);

    // Wait for the internal async run() to complete
    await vi.waitUntil(
      () =>
        (streamClient.doAxiosRequest as Mock).mock.calls.length === 1 &&
        (sfuClient.sendMetrics as Mock).mock.calls.length === 1,
      { timeout: 500 },
    );
    expect(streamClient.doAxiosRequest).toHaveBeenCalledTimes(1);
    expect(sfuClient.sendStats).not.toHaveBeenCalled();

    const args = (streamClient.doAxiosRequest as Mock).mock.calls[0];
    expect(args[0]).toBe('post');
    expect(args[1]).toBe('/stats');

    const payload = args[2];
    expect(payload.sdk).toBe('stream-react');
    expect(payload.sdk_version).toBe('1.0.0');
    expect(payload.sfu_id).toBe('sfu-edge-1');
    expect(payload.user_session_id).toBe('user-session-1');
    expect(payload.unified_session_id).toBe('unified-2');
    expect(payload.webrtc_version).toBe('Chrome-99');
    expect(payload.telemetry).toEqual({ connection_time_seconds: 12 });

    expect(payload.rtc_stats).toBeInstanceOf(Blob);
    const text = await (payload.rtc_stats as Blob).text();
    expect(text).toBeDefined();

    expect(sfuClient.sendMetrics).toHaveBeenCalledTimes(1);
    const metrics = (sfuClient.sendMetrics as Mock).mock.calls[0][0];
    expect(metrics.unifiedSessionId).toBe('unified-2');
    expect(metrics.inbound).toEqual([{ id: 'in1' }]);
    expect(metrics.outbound).toEqual([{ id: 'out1' }]);
    expect(metrics.remoteInbound).toEqual([{ id: 'rin1' }]);
    expect(metrics.remoteOutbound).toEqual([]);
  });

  it('sends reconnection telemetry using sendReconnectionTime (non-legacy path)', async () => {
    const sfuClient = createSfuClient();
    const streamClient = createStreamClient();
    const subscriber = createSubscriber();
    const publisher = createPublisher();
    const tracer = new Tracer(null);

    const reporter = new SfuStatsReporter(sfuClient, streamClient, {
      options: { reporting_interval_ms: 1000, enable_rtc_stats: true },
      clientDetails,
      subscriber,
      publisher,
      tracer: tracer,
      unifiedSessionId: 'unified-3',
      basePath: '',
      useLegacyStats: false,
    });

    reporter.sendReconnectionTime(WebsocketReconnectStrategy.REJOIN, 3);
    await vi.waitUntil(
      () =>
        (streamClient.doAxiosRequest as Mock).mock.calls.length === 1 &&
        (sfuClient.sendMetrics as Mock).mock.calls.length === 1,
      { timeout: 500 },
    );

    expect(streamClient.doAxiosRequest).toHaveBeenCalledTimes(1);
    expect(sfuClient.sendStats).not.toHaveBeenCalled();
    expect(sfuClient.sendMetrics).toHaveBeenCalledTimes(1);

    const [, , payload] = (streamClient.doAxiosRequest as Mock).mock.calls[0];
    expect(payload.sdk).toBe('stream-react');
    expect(payload.unified_session_id).toBe('unified-3');
    expect(payload.telemetry).toEqual({
      reconnection: { strategy: 'REJOIN', time_seconds: 3 },
    });
  });

  it('start() sets up periodic reporting and stop() clears it', async () => {
    vi.useFakeTimers();
    const sfuClient = createSfuClient();
    const streamClient = createStreamClient();
    const subscriber = createSubscriber();
    const tracer = new Tracer(null);

    const reporter = new SfuStatsReporter(sfuClient, streamClient, {
      options: { reporting_interval_ms: 200, enable_rtc_stats: true },
      clientDetails,
      subscriber,
      tracer,
      unifiedSessionId: 'u-3',
      basePath: '/b',
      useLegacyStats: false,
    });

    reporter.start();
    await vi.advanceTimersByTimeAsync(450);
    expect(streamClient.doAxiosRequest).toHaveBeenCalledTimes(2);

    reporter.stop();
    await vi.advanceTimersByTimeAsync(500);
    expect(streamClient.doAxiosRequest).toHaveBeenCalledTimes(2); // no more calls
  });

  it('scheduleOne() schedules a single delayed report', async () => {
    vi.useFakeTimers();
    const sfuClient = createSfuClient();
    const streamClient = createStreamClient();
    const subscriber = createSubscriber();
    const tracer = new Tracer(null);

    const reporter = new SfuStatsReporter(sfuClient, streamClient, {
      options: { reporting_interval_ms: 1000, enable_rtc_stats: true },
      clientDetails,
      subscriber,
      tracer,
      unifiedSessionId: 'u-4',
      basePath: '/b',
      useLegacyStats: false,
    });

    reporter.scheduleOne(300);
    expect(streamClient.doAxiosRequest).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(299);
    expect(streamClient.doAxiosRequest).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(streamClient.doAxiosRequest).toHaveBeenCalledTimes(1);
  });

  it('rolls back tracer snapshots on API failure (legacy path)', async () => {
    const sfuClient = createSfuClient();
    const streamClient = createStreamClient();
    const subscriber = createSubscriber();
    const publisher = createPublisher();
    const tracer = new Tracer(null);

    // Pre-fill reporter and sfu tracers so we can verify rollback restores them
    tracer.trace('before-run', { x: 1 });
    sfuClient.tracer?.trace('sfu-before-run', { y: 2 });

    // Force the legacy API to fail
    (sfuClient.sendStats as Mock).mockRejectedValueOnce(
      new Error('fail-legacy'),
    );

    const reporter = new SfuStatsReporter(sfuClient, streamClient, {
      options: { reporting_interval_ms: 1000, enable_rtc_stats: true },
      clientDetails,
      subscriber,
      publisher,
      tracer,
      unifiedSessionId: 'u-rollback',
      basePath: '/base',
      useLegacyStats: true,
    });

    // @ts-expect-error private api
    await expect(reporter.run()).rejects.toThrow('fail-legacy');

    // After failure, all tracers should have their snapshots rolled back into buffers
    const subSlice = subscriber.tracer!.take();
    const pubSlice = publisher.tracer!.take();
    const repSlice = tracer.take();
    const sfuSlice = sfuClient.tracer!.take();

    // Subscriber/publisher should contain the 'getstats' traces collected during run()
    expect(subSlice.snapshot.length).toBeGreaterThan(0);
    expect(subSlice.snapshot.some((r) => r[0] === 'getstats')).toBe(true);
    expect(pubSlice.snapshot.length).toBeGreaterThan(0);
    expect(pubSlice.snapshot.some((r) => r[0] === 'getstats')).toBe(true);

    // Reporter tracer should still have the pre-existing trace we added
    expect(repSlice.snapshot.some((r) => r[0] === 'before-run')).toBe(true);

    // SFU client tracer should also retain its pre-existing trace
    expect(sfuSlice.snapshot.some((r) => r[0] === 'sfu-before-run')).toBe(true);
  });
});

const createComputedStats = () => {
  const rtcStatsArray = [{ id: 's1' }];
  const rtcReport = {
    // Mimic RTCStatsReport shape used by utils.flatten(report)
    forEach: (cb) => rtcStatsArray.forEach((s) => cb(s, s.id, rtcReport)),
  } as RTCStatsReport;
  return {
    delta: { some: 'delta' },
    currentStats: { now: 1 },
    previousStats: { prev: 0 },
    stats: rtcReport,
  };
};

const createSubscriber = () => {
  const computed = createComputedStats();
  return {
    stats: {
      get: vi.fn(async () => computed),
      getDecodeStats: vi.fn(() => [{ decodedFrames: 123 }]),
      getSubscriberMetrics: vi.fn(() => ({
        inbound: [{ id: 'in1' }],
        remoteOutbound: [],
      })),
    },
    tracer: new Tracer(null),
  } as unknown as Subscriber;
};

const createPublisher = () => {
  const computed = createComputedStats();
  return {
    stats: {
      get: vi.fn(async () => computed),
      getEncodeStats: vi.fn(() => [{ encodedFrames: 321 }]),
      getPublisherMetrics: vi.fn(() => ({
        outbound: [{ id: 'out1' }],
        remoteInbound: [{ id: 'rin1' }],
      })),
    },
    tracer: new Tracer(null),
  } as unknown as Publisher;
};

const createSfuClient = () => {
  return {
    sessionId: 'user-session-1',
    edgeName: 'sfu-edge-1',
    tracer: new Tracer(null),
    sendStats: vi.fn(async () => ({})),
    sendMetrics: vi.fn(async () => ({})),
  } as unknown as StreamSfuClient;
};

const createStreamClient = () =>
  ({
    doAxiosRequest: vi.fn(async () => ({ status: 'ok' })),
  }) as unknown as StreamClient;
