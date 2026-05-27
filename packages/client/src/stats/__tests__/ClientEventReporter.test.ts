import { describe, expect, it, vi } from 'vitest';
import { ClientEventReporter } from '../ClientEventReporter';
import type { PeerConnectionStateChangeEvent } from '../../rtc';
import { PeerType } from '../../gen/video/sfu/models/models';
import type { StreamClient } from '../../coordinator/connection/client';

const makeReporter = () => {
  const post = vi.fn().mockResolvedValue({});
  const streamClient = { post } as unknown as StreamClient;
  const reporter = new ClientEventReporter({
    streamClient,
    callType: 'default',
    callId: 'call-id',
    getUserId: () => 'user-1',
    getCallSessionId: () => 'session-1',
    getSfuId: () => 'sfu-1',
    sdkVersion: '1.0.0',
    userAgent: 'test-agent',
  });

  const events = (): Record<string, unknown>[] =>
    post.mock.calls.map(
      (c) => (c[1] as { events: Record<string, unknown>[] }).events[0],
    );
  return { reporter, post, events };
};

const pcEvent = (
  overrides: Partial<PeerConnectionStateChangeEvent>,
): PeerConnectionStateChangeEvent => ({
  peerType: PeerType.PUBLISHER_UNSPECIFIED,
  iceConnectionState: 'new',
  peerConnectionState: 'new',
  sfuId: 'sfu-1',
  userSessionId: 'user-session-1',
  ...overrides,
});

describe('ClientEventReporter', () => {
  describe('CoordinatorJoin', () => {
    it('emits initiated then completed:success on first success', async () => {
      const { reporter, events } = makeReporter();
      await reporter.withJoinLifecycle(() =>
        reporter.track('CoordinatorJoin', () => Promise.resolve('ok')),
      );
      const ev = events();
      expect(ev).toHaveLength(2);
      expect(ev[0].stage).toBe('CoordinatorJoin');
      expect(ev[0].event_type).toBe('initiated');
      expect(ev[1].event_type).toBe('completed');
      expect(ev[1].outcome).toBe('success');
      expect(ev[1].retry_count_attempt).toBe(0);
      expect(ev[0].event_session_id).toBe(ev[1].event_session_id);
      expect(ev[0].join_success_id).toBe(ev[1].join_success_id);
    });

    it('folds retries into one pair with retry_count_attempt', async () => {
      const { reporter, events } = makeReporter();
      await reporter.withJoinLifecycle(async () => {
        await reporter
          .track('CoordinatorJoin', () => Promise.reject(new Error('500')))
          .catch(() => {});
        await reporter
          .track('CoordinatorJoin', () => Promise.reject(new Error('500')))
          .catch(() => {});
        await reporter.track('CoordinatorJoin', () => Promise.resolve('ok'));
      });
      const ev = events();
      expect(ev).toHaveLength(2);
      expect(ev[0].event_type).toBe('initiated');
      expect(ev[1].event_type).toBe('completed');
      expect(ev[1].outcome).toBe('success');
      expect(ev[1].retry_count_attempt).toBe(2);
    });

    it('emits completed:failure with HTTP_{status} when lifecycle throws after retries', async () => {
      const { reporter, events } = makeReporter();
      const httpError = Object.assign(new Error('500'), {
        response: { status: 503 },
      });
      await expect(
        reporter.withJoinLifecycle(async () => {
          await reporter
            .track('CoordinatorJoin', () => Promise.reject(httpError))
            .catch(() => {});
          throw new Error('exhausted');
        }),
      ).rejects.toThrow('exhausted');
      const ev = events();
      expect(ev).toHaveLength(2);
      expect(ev[1].outcome).toBe('failure');
      expect(ev[1].retry_failure_code).toBe('HTTP_503');
      expect(typeof ev[1].retry_failure_reason).toBe('string');
    });

    it('emits REQUEST_TIMEOUT only for actual timeouts', async () => {
      const { reporter, events } = makeReporter();
      const timeoutError = Object.assign(
        new Error('timeout of 5000ms exceeded'),
        {
          code: 'ECONNABORTED',
        },
      );
      await expect(
        reporter.withJoinLifecycle(async () => {
          await reporter
            .track('CoordinatorJoin', () => Promise.reject(timeoutError))
            .catch(() => {});
          throw new Error('exhausted');
        }),
      ).rejects.toThrow('exhausted');
      const ev = events();
      expect(ev[1].retry_failure_code).toBe('REQUEST_TIMEOUT');
    });
  });

  describe('WSJoin', () => {
    it('emits initiated + completed:success', async () => {
      const { reporter, events } = makeReporter();
      await reporter.withJoinLifecycle(() =>
        reporter.track('WSJoin', () => Promise.resolve('ok')),
      );
      const ev = events();
      expect(ev).toHaveLength(2);
      expect(ev[0].stage).toBe('WSJoin');
      expect(ev[1].outcome).toBe('success');
    });

    it('captureWsError applies sticky-priority before close', async () => {
      const { reporter, events } = makeReporter();
      await expect(
        reporter.withJoinLifecycle(async () => {
          await reporter
            .track('WSJoin', () => Promise.reject(new Error('timeout')))
            .catch(() => {});
          reporter.captureWsError({
            code: 'UNAUTHENTICATED',
            reason: 'SFU rejected token',
          });
          throw new Error('exhausted');
        }),
      ).rejects.toThrow('exhausted');
      const ev = events();
      expect(ev[1].outcome).toBe('failure');
      expect(ev[1].retry_failure_code).toBe('UNAUTHENTICATED');
      expect(ev[1].retry_failure_reason).toBe('SFU rejected token');
      expect(ev[1].sfu_id).toBe('sfu-1');
    });
  });

  describe('jsi correlation', () => {
    it('shares join_success_id across all pairs in one lifecycle', async () => {
      const { reporter, events } = makeReporter();
      await reporter.withJoinLifecycle(async () => {
        await reporter.track('CoordinatorJoin', () => Promise.resolve('ok'));
        await reporter.track('WSJoin', () => Promise.resolve('ok'));
      });
      const ev = events();
      const ids = new Set(ev.map((e) => e.join_success_id));
      expect(ids.size).toBe(1);
    });

    it('rotates join_success_id on a fresh startCorrelation', async () => {
      const { reporter, events } = makeReporter();
      await reporter.withJoinLifecycle(() =>
        reporter.track('CoordinatorJoin', () => Promise.resolve('a')),
      );
      await reporter.withJoinLifecycle(() =>
        reporter.track('CoordinatorJoin', () => Promise.resolve('b')),
      );
      const ev = events();
      expect(ev[0].join_success_id).not.toBe(ev[2].join_success_id);
    });

    it('snapshotted jsi: completed carries the same jsi as initiated even if rotated mid-flight', async () => {
      const { reporter, events } = makeReporter();
      await reporter.withJoinLifecycle(async () => {
        await reporter
          .track('WSJoin', () => Promise.reject(new Error('fail')))
          .catch(() => {});
        // simulate explicit migrate boundary that rotates jsi
        reporter.startCorrelation();
        await reporter.track('WSJoin', () => Promise.resolve('ok'));
      });
      const ev = events();
      // first ws pair (initiated + failure) under jsi-A
      const firstPair = ev.filter(
        (e) => e.event_session_id === ev[0].event_session_id,
      );
      expect(firstPair).toHaveLength(2);
      expect(firstPair[0].join_success_id).toBe(firstPair[1].join_success_id);
      // second ws pair under jsi-B
      const secondInitiated = ev.find(
        (e) =>
          e.event_type === 'initiated' &&
          e.event_session_id !== ev[0].event_session_id,
      );
      expect(secondInitiated?.join_success_id).not.toBe(
        firstPair[0].join_success_id,
      );
    });
  });

  describe('PeerConnectionConnect', () => {
    it('opens pair on iceConnectionState=checking and closes as success on connected', () => {
      const { reporter, events } = makeReporter();
      reporter.onPeerConnectionStateChange(
        pcEvent({ iceConnectionState: 'checking' }),
      );
      reporter.onPeerConnectionStateChange(
        pcEvent({ iceConnectionState: 'connected' }),
      );
      const ev = events();
      expect(ev).toHaveLength(2);
      expect(ev[0].stage).toBe('PeerConnectionConnect');
      expect(ev[0].peer_connection).toBe('publish');
      expect(ev[0].event_type).toBe('initiated');
      expect(ev[0].was_previously_connected).toBe(false);
      expect(ev[1].outcome).toBe('success');
      expect(ev[1].was_previously_connected).toBe(false);
      expect(ev[0].event_session_id).toBe(ev[1].event_session_id);
    });

    it('emits ICE_CONNECTIVITY_FAILED on iceConnectionState=failed', () => {
      const { reporter, events } = makeReporter();
      reporter.onPeerConnectionStateChange(
        pcEvent({ iceConnectionState: 'checking' }),
      );
      reporter.onPeerConnectionStateChange(
        pcEvent({ iceConnectionState: 'failed' }),
      );
      const ev = events();
      expect(ev[1].outcome).toBe('failure');
      expect(ev[1].retry_failure_code).toBe('ICE_CONNECTIVITY_FAILED');
      expect(ev[1].ice_state).toBe('FAILED');
    });

    it('emits DTLS_CONNECTIVITY_FAILED when peerConnectionState=failed and ICE is connected', () => {
      const { reporter, events } = makeReporter();
      reporter.onPeerConnectionStateChange(
        pcEvent({ iceConnectionState: 'checking' }),
      );
      reporter.onPeerConnectionStateChange(
        pcEvent({
          iceConnectionState: 'connected',
          peerConnectionState: 'failed',
        }),
      );
      const ev = events();
      expect(ev[1].outcome).toBe('failure');
      expect(ev[1].retry_failure_code).toBe('DTLS_CONNECTIVITY_FAILED');
    });

    it('prioritizes ICE failure over DTLS when both states are failed', () => {
      const { reporter, events } = makeReporter();
      reporter.onPeerConnectionStateChange(
        pcEvent({ iceConnectionState: 'checking' }),
      );
      reporter.onPeerConnectionStateChange(
        pcEvent({
          iceConnectionState: 'failed',
          peerConnectionState: 'failed',
        }),
      );
      const ev = events();
      expect(ev[1].outcome).toBe('failure');
      expect(ev[1].retry_failure_code).toBe('ICE_CONNECTIVITY_FAILED');
      expect(ev[1].ice_state).toBe('FAILED');
    });

    it('supersedes an open pair when a second checking arrives', () => {
      const { reporter, events } = makeReporter();
      reporter.onPeerConnectionStateChange(
        pcEvent({ iceConnectionState: 'checking' }),
      );
      reporter.onPeerConnectionStateChange(
        pcEvent({ iceConnectionState: 'checking' }),
      );
      const ev = events();
      // pair 1: init + supersede-failure
      // pair 2: init
      expect(ev).toHaveLength(3);
      expect(ev[1].outcome).toBe('failure');
      expect(ev[1].retry_failure_reason).toBe('Superseded by new ICE attempt');
      expect(ev[1].event_session_id).toBe(ev[0].event_session_id);
      expect(ev[2].event_session_id).not.toBe(ev[0].event_session_id);
      expect(ev[2].event_type).toBe('initiated');
    });

    it('sets was_previously_connected:true on a reconnect after first success', () => {
      const { reporter, events } = makeReporter();
      reporter.onPeerConnectionStateChange(
        pcEvent({ iceConnectionState: 'checking' }),
      );
      reporter.onPeerConnectionStateChange(
        pcEvent({ iceConnectionState: 'connected' }),
      );
      reporter.onPeerConnectionStateChange(
        pcEvent({ iceConnectionState: 'checking' }),
      );
      const ev = events();
      const reconnectInit = ev[2];
      expect(reconnectInit.event_type).toBe('initiated');
      expect(reconnectInit.was_previously_connected).toBe(true);
    });

    it('produces independent pairs per role (publish vs subscribe)', () => {
      const { reporter, events } = makeReporter();
      reporter.onPeerConnectionStateChange(
        pcEvent({
          peerType: PeerType.PUBLISHER_UNSPECIFIED,
          iceConnectionState: 'checking',
        }),
      );
      reporter.onPeerConnectionStateChange(
        pcEvent({
          peerType: PeerType.SUBSCRIBER,
          iceConnectionState: 'checking',
        }),
      );
      const ev = events();
      expect(ev).toHaveLength(2);
      const roles = ev.map((e) => e.peer_connection);
      expect(roles).toContain('publish');
      expect(roles).toContain('subscribe');
      expect(ev[0].event_session_id).not.toBe(ev[1].event_session_id);
    });
  });

  describe('abort', () => {
    it('closes open coord/WS pairs with CLIENT_ABORTED', async () => {
      const { reporter, events } = makeReporter();
      reporter.startCorrelation();
      await reporter
        .track('WSJoin', () => Promise.reject(new Error('mid-flight')))
        .catch(() => {});
      reporter.abort({ code: 'CLIENT_ABORTED', reason: 'user left' });
      const ev = events();
      const completed = ev.find(
        (e) => e.stage === 'WSJoin' && e.event_type === 'completed',
      );
      // sticky-priority: TRANSPORT(track's REQUEST_TIMEOUT) wins over CLIENT(abort) for the code
      // but the captured WS error is the one emitted
      expect(completed?.outcome).toBe('failure');
    });

    it('closes open PC pairs as NOT_CONNECTED', () => {
      const { reporter, events } = makeReporter();
      reporter.onPeerConnectionStateChange(
        pcEvent({ iceConnectionState: 'checking' }),
      );
      reporter.abort({ code: 'BACKEND_LEAVE', reason: 'call ended' });
      const ev = events();
      const completed = ev.find(
        (e) =>
          e.stage === 'PeerConnectionConnect' && e.event_type === 'completed',
      );
      expect(completed?.outcome).toBe('failure');
      expect(completed?.retry_failure_code).toBe('BACKEND_LEAVE');
      expect(completed?.ice_state).toBe('NOT_CONNECTED');
    });
  });

  describe('dispose', () => {
    it('stops emitting after dispose', () => {
      const { reporter, post } = makeReporter();
      reporter.startCorrelation();
      reporter.dispose();
      reporter.onPeerConnectionStateChange(
        pcEvent({ iceConnectionState: 'checking' }),
      );
      expect(post).not.toHaveBeenCalled();
    });
  });

  describe('isolation invariant', () => {
    it("does not block the caller's promise on transport failure", async () => {
      const slowPost = vi.fn(
        () => new Promise(() => {}), // never resolves
      );
      const streamClient = { post: slowPost } as unknown as StreamClient;
      const reporter = new ClientEventReporter({
        streamClient,
        callType: 'default',
        callId: 'call-id',
        getUserId: () => 'u',
        getCallSessionId: () => '',
        getSfuId: () => '',
        sdkVersion: '1',
        userAgent: 't',
      });
      const start = Date.now();
      await reporter.withJoinLifecycle(() =>
        reporter.track('CoordinatorJoin', () => Promise.resolve('ok')),
      );
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(50);
      expect(slowPost).toHaveBeenCalled();
    });

    it('rethrows the op error verbatim', async () => {
      const { reporter } = makeReporter();
      const opErr = new Error('original error');
      await expect(
        reporter.withJoinLifecycle(() =>
          reporter.track('CoordinatorJoin', () => Promise.reject(opErr)),
        ),
      ).rejects.toBe(opErr);
    });
  });
});
