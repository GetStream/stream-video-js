import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import {
  ClientEventReporter,
  type ClientEventReporterOptions,
} from '../ClientEventReporter';
import type { StreamClient } from '../../coordinator/connection/client';

const flushMicrotasks = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};

const makeReporter = (
  overrides: Partial<ClientEventReporterOptions> = {},
): { reporter: ClientEventReporter; post: MockInstance } => {
  const post = vi.fn().mockResolvedValue({});
  const streamClient = { post } as unknown as StreamClient;
  const reporter = new ClientEventReporter({
    streamClient,
    callType: 'default',
    callId: 'abc123',
    getUserId: () => 'alice',
    getCallSessionId: () => '',
    sdkVersion: '1.22.2',
    userAgent: 'stream-video-js/1.22.2',
    ...overrides,
  });
  return { reporter, post };
};

describe('ClientEventReporter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('track', () => {
    it('fires initiated with the common envelope on first attempt', async () => {
      const { reporter, post } = makeReporter();

      await reporter.track('CoordinatorJoin', async () => undefined);
      await flushMicrotasks();

      expect(post).toHaveBeenCalledTimes(2);
      const [path, init] = post.mock.calls[0];
      expect(path).toBe('/call_client_event');
      expect(init).toMatchObject({
        user_id: 'alice',
        type: 'default',
        id: 'abc123',
        stage: 'CoordinatorJoin',
        event_type: 'initiated',
        user_agent: 'stream-video-js/1.22.2',
        sdk_version: '1.22.2',
      });
      expect(typeof init.event_session_id).toBe('string');
      expect(typeof init.timestamp).toBe('string');
    });

    it('reuses one event_session_id across retries and succeeds with retry_count_attempt', async () => {
      const { reporter, post } = makeReporter();

      await expect(
        reporter.track('CoordinatorJoin', async () => {
          throw new Error('first');
        }),
      ).rejects.toThrow('first');
      await expect(
        reporter.track('CoordinatorJoin', async () => {
          throw new Error('second');
        }),
      ).rejects.toThrow('second');
      await reporter.track('CoordinatorJoin', async () => 'ok');
      await flushMicrotasks();

      expect(post).toHaveBeenCalledTimes(2);
      const [, init] = post.mock.calls[0];
      const [, completion] = post.mock.calls[1];
      expect(completion.event_session_id).toBe(init.event_session_id);
      expect(completion).toMatchObject({
        stage: 'CoordinatorJoin',
        event_type: 'completed',
        outcome: 'success',
        retry_count_attempt: 2,
      });
      expect(completion.retry_failure_reason).toBeUndefined();
      expect(completion.retry_failure_code).toBeUndefined();
    });

    it('tracks WSJoin success with a paired event_session_id', async () => {
      const { reporter, post } = makeReporter();

      await reporter.track('WSJoin', async () => undefined);
      await flushMicrotasks();

      expect(post).toHaveBeenCalledTimes(2);
      const [, init] = post.mock.calls[0];
      const [, completion] = post.mock.calls[1];
      expect(init.event_session_id).toBe(completion.event_session_id);
      expect(completion).toMatchObject({
        stage: 'WSJoin',
        event_type: 'completed',
        outcome: 'success',
        retry_count_attempt: 0,
      });
    });

    it('tracks PeerConnectionConnect success with peer_connection', async () => {
      const { reporter, post } = makeReporter();

      reporter.beginPeerConnectionAttempt('subscribe', {
        wasPreviouslyConnected: false,
      });
      reporter.succeedPeerConnection('subscribe', {
        wasPreviouslyConnected: false,
      });
      await flushMicrotasks();

      expect(post).toHaveBeenCalledTimes(2);
      const [, init] = post.mock.calls[0];
      const [, completion] = post.mock.calls[1];
      expect(init.event_session_id).toBe(completion.event_session_id);
      expect(init).toMatchObject({
        stage: 'PeerConnectionConnect',
        peer_connection: 'subscribe',
        was_previously_connected: false,
        event_type: 'initiated',
      });
      expect(completion).toMatchObject({
        stage: 'PeerConnectionConnect',
        peer_connection: 'subscribe',
        was_previously_connected: false,
        event_type: 'completed',
        outcome: 'success',
        retry_count_attempt: 0,
      });
    });
  });

  describe('close', () => {
    it('maps the bubbled error onto the open coordinator pair', async () => {
      const { reporter, post } = makeReporter();

      await expect(
        reporter.track('CoordinatorJoin', async () => {
          throw new Error('first');
        }),
      ).rejects.toThrow('first');
      await expect(
        reporter.track('CoordinatorJoin', async () => {
          throw new Error('second');
        }),
      ).rejects.toThrow('second');

      reporter.close({
        callSessionId: '',
        sfuId: '',
        error: new Error('third error'),
      });
      await flushMicrotasks();

      const [, completion] = post.mock.calls[1];
      expect(completion).toMatchObject({
        stage: 'CoordinatorJoin',
        event_type: 'completed',
        outcome: 'failure',
        retry_count_attempt: 1,
        retry_failure_reason: 'third error',
        retry_failure_code: 'REQUEST_TIMEOUT',
      });
    });

    it('maps the bubbled error onto the open WS pair', async () => {
      const { reporter, post } = makeReporter();

      await expect(
        reporter.track('WSJoin', async () => {
          throw new Error('ws closed 1006');
        }),
      ).rejects.toThrow('ws closed 1006');
      await expect(
        reporter.track('WSJoin', async () => {
          throw new Error('ws closed again');
        }),
      ).rejects.toThrow('ws closed again');

      reporter.close({
        callSessionId: 'sess-abc',
        sfuId: 'sfu-fra-07',
        error: new Error('ws closed 1006'),
      });
      await flushMicrotasks();

      const [, completion] = post.mock.calls[1];
      expect(completion).toMatchObject({
        stage: 'WSJoin',
        event_type: 'completed',
        outcome: 'failure',
        retry_count_attempt: 1,
        call_session_id: 'sess-abc',
        sfu_id: 'sfu-fra-07',
        retry_failure_reason: 'ws closed 1006',
        retry_failure_code: 'REQUEST_TIMEOUT',
      });
    });
  });

  describe('abort', () => {
    it('fires CLIENT_ABORTED failure for any open coord/WS pair', async () => {
      const { reporter, post } = makeReporter();

      await expect(
        reporter.track('CoordinatorJoin', async () => {
          throw new Error('still retrying');
        }),
      ).rejects.toThrow('still retrying');
      await expect(
        reporter.track('WSJoin', async () => {
          throw new Error('still retrying');
        }),
      ).rejects.toThrow('still retrying');

      await flushMicrotasks();
      expect(post).toHaveBeenCalledTimes(2);

      reporter.abort({
        callSessionId: 'sess-abc',
        sfuId: 'sfu-fra-07',
      });
      await flushMicrotasks();

      expect(post).toHaveBeenCalledTimes(4);
      const [, coordCompletion] = post.mock.calls[2];
      const [, wsCompletion] = post.mock.calls[3];

      expect(coordCompletion).toMatchObject({
        stage: 'CoordinatorJoin',
        event_type: 'completed',
        outcome: 'failure',
        retry_failure_code: 'REQUEST_TIMEOUT',
      });
      expect(wsCompletion).toMatchObject({
        stage: 'WSJoin',
        event_type: 'completed',
        outcome: 'failure',
        retry_failure_code: 'REQUEST_TIMEOUT',
        call_session_id: 'sess-abc',
        sfu_id: 'sfu-fra-07',
      });
    });

    it('is a no-op when no pairs are open', async () => {
      const { reporter, post } = makeReporter();
      reporter.abort({ callSessionId: '', sfuId: '' });
      await flushMicrotasks();
      expect(post).not.toHaveBeenCalled();
    });
  });

  describe('startCorrelation', () => {
    it('drops open pairs and a fresh attempt gets a new event_session_id', async () => {
      const { reporter, post } = makeReporter();

      await expect(
        reporter.track('CoordinatorJoin', async () => {
          throw new Error('retry later');
        }),
      ).rejects.toThrow('retry later');
      await flushMicrotasks();
      const [, firstInit] = post.mock.calls[0];

      reporter.startCorrelation('migration');
      await reporter.track('CoordinatorJoin', async () => undefined);
      await flushMicrotasks();

      const [, secondInit] = post.mock.calls[1];
      expect(firstInit.event_session_id).not.toBe(secondInit.event_session_id);
    });
  });

  describe('migrate', () => {
    it('closes the open WS pair and rotates join_success_id for the next attempt', async () => {
      const { reporter, post } = makeReporter();

      reporter.startCorrelation('initial');
      await expect(
        reporter.track('WSJoin', async () => {
          throw new Error('sfu full');
        }),
      ).rejects.toThrow('sfu full');
      await flushMicrotasks();

      const [, init] = post.mock.calls[0];
      reporter.migrate({
        callSessionId: 'sess-abc',
        sfuId: 'sfu-fra-07',
        error: new Error('sfu full'),
      });
      await flushMicrotasks();

      const [, failure] = post.mock.calls[1];
      await reporter.track('CoordinatorJoin', async () => undefined);
      await flushMicrotasks();
      const [, nextInit] = post.mock.calls[2];

      expect(failure).toMatchObject({
        stage: 'WSJoin',
        event_type: 'completed',
        outcome: 'failure',
      });
      expect(init.join_success_id).toBe(failure.join_success_id);
      expect(nextInit.join_success_id).not.toBe(init.join_success_id);
    });
  });

  describe('retry semantics', () => {
    it('retries on 5xx until success', async () => {
      const post = vi
        .fn()
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockResolvedValue({});
      const streamClient = { post } as unknown as StreamClient;
      const reporter = new ClientEventReporter({
        streamClient,
        callType: 'default',
        callId: 'abc',
        getUserId: () => 'alice',
        getCallSessionId: () => '',
        sdkVersion: '1.22.2',
        userAgent: 'ua',
      });

      await reporter.track('CoordinatorJoin', async () => undefined);
      await vi.runAllTimersAsync();
      expect(post).toHaveBeenCalledTimes(4);
    });

    it('does not retry on 4xx', async () => {
      const post = vi.fn().mockRejectedValue({ response: { status: 400 } });
      const streamClient = { post } as unknown as StreamClient;
      const reporter = new ClientEventReporter({
        streamClient,
        callType: 'default',
        callId: 'abc',
        getUserId: () => 'alice',
        getCallSessionId: () => '',
        sdkVersion: '1.22.2',
        userAgent: 'ua',
      });

      await reporter.track('CoordinatorJoin', async () => undefined);
      await vi.runAllTimersAsync();
      expect(post).toHaveBeenCalledTimes(2);
    });

    it('caps total attempts at 5 on persistent 5xx', async () => {
      const post = vi.fn().mockRejectedValue({ response: { status: 502 } });
      const streamClient = { post } as unknown as StreamClient;
      const reporter = new ClientEventReporter({
        streamClient,
        callType: 'default',
        callId: 'abc',
        getUserId: () => 'alice',
        getCallSessionId: () => '',
        sdkVersion: '1.22.2',
        userAgent: 'ua',
      });

      await reporter.track('CoordinatorJoin', async () => undefined);
      await vi.runAllTimersAsync();
      expect(post).toHaveBeenCalledTimes(10);
    });
  });

  describe('truncation and clamping', () => {
    it('clamps retry_count_attempt at 1000 when attempts are absurdly high', async () => {
      const { reporter, post } = makeReporter();

      for (let i = 0; i < 1500; i++) {
        await expect(
          reporter.track('CoordinatorJoin', async () => {
            throw new Error('retry');
          }),
        ).rejects.toThrow('retry');
      }
      await reporter.track('CoordinatorJoin', async () => undefined);
      await flushMicrotasks();

      const [, completion] = post.mock.calls[1];
      expect(completion.retry_count_attempt).toBe(1000);
    });

    it('truncates long failure reason to 2000 chars', async () => {
      const { reporter, post } = makeReporter();

      await expect(
        reporter.track('WSJoin', async () => {
          throw new Error('r'.repeat(5000));
        }),
      ).rejects.toThrow();
      reporter.close({
        callSessionId: 'sess',
        sfuId: 'sfu',
        error: new Error('r'.repeat(5000)),
      });
      await flushMicrotasks();

      const [, completion] = post.mock.calls[1];
      expect(completion.retry_failure_reason.length).toBe(2000);
    });
  });

  describe('envelope fields', () => {
    it('stamps call_cid on every event', async () => {
      const { reporter, post } = makeReporter({
        callType: 'audio_room',
        callId: 'room-7',
      });

      await reporter.track('CoordinatorJoin', async () => undefined);
      await flushMicrotasks();

      expect(post.mock.calls[0][1]).toMatchObject({
        call_cid: 'audio_room:room-7',
      });
      expect(post.mock.calls[1][1]).toMatchObject({
        call_cid: 'audio_room:room-7',
      });
    });

    it('includes elapsed_time on completed events only', async () => {
      const { reporter, post } = makeReporter();

      await reporter.track('CoordinatorJoin', async () => {
        vi.advanceTimersByTime(750);
      });
      await flushMicrotasks();

      const [, init] = post.mock.calls[0];
      const [, completion] = post.mock.calls[1];
      expect(init.elapsed_time).toBeUndefined();
      expect(completion.elapsed_time).toBeGreaterThanOrEqual(750);
    });

    it('includes elapsed_time on failure completions too', async () => {
      const { reporter, post } = makeReporter();

      const failing = reporter.track('WSJoin', async () => {
        vi.advanceTimersByTime(200);
        throw new Error('boom');
      });
      await expect(failing).rejects.toThrow('boom');
      reporter.close({
        callSessionId: 'sess',
        sfuId: 'sfu-1',
        error: new Error('boom'),
      });
      await flushMicrotasks();

      const [, completion] = post.mock.calls[1];
      expect(completion).toMatchObject({
        event_type: 'completed',
        outcome: 'failure',
      });
      expect(completion.elapsed_time).toBeGreaterThanOrEqual(200);
    });
  });

  describe('dispose', () => {
    it('aborts in-flight retries and ignores new sends', async () => {
      const post = vi.fn().mockRejectedValue({ response: { status: 503 } });
      const streamClient = { post } as unknown as StreamClient;
      const reporter = new ClientEventReporter({
        streamClient,
        callType: 'default',
        callId: 'abc',
        getUserId: () => 'alice',
        getCallSessionId: () => '',
        sdkVersion: '1.22.2',
        userAgent: 'ua',
      });

      await reporter.track('CoordinatorJoin', async () => undefined);
      await flushMicrotasks();
      reporter.dispose();
      await vi.runAllTimersAsync();

      expect(post).toHaveBeenCalledTimes(2);

      await reporter.track('CoordinatorJoin', async () => undefined);
      await flushMicrotasks();
      expect(post).toHaveBeenCalledTimes(2);
    });
  });
});
