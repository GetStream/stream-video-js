import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import {
  CallOfflineState,
  NetworkReachabilityChecker,
} from '../networkReachability';
import { CallingState, CallState } from '../../store';
import { videoLoggerSystem } from '../../logger';
import type { Tracer } from '../../stats';
import type { StreamClient } from '../../coordinator/connection/client';
import type { StreamSfuClient } from '../../StreamSfuClient';
import type { Subscriber } from '../../rtc';

describe('NetworkReachabilityChecker', () => {
  let sfuClient: { isHealthy: boolean; probe: ReturnType<typeof vi.fn> };
  let streamClient: { probeConnection: ReturnType<typeof vi.fn> };
  let subscriber: { getStats: ReturnType<typeof vi.fn> } | undefined;
  let checker: NetworkReachabilityChecker;

  const inboundPackets = (...counts: number[]) => {
    for (const packetsReceived of counts) {
      subscriber!.getStats.mockResolvedValueOnce(
        new Map([['in', { type: 'inbound-rtp', packetsReceived }]]),
      );
    }
  };

  const check = async () => {
    const result = checker.check();
    await vi.advanceTimersByTimeAsync(1000);
    return result;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    sfuClient = { isHealthy: true, probe: vi.fn().mockResolvedValue(false) };
    streamClient = { probeConnection: vi.fn().mockResolvedValue(false) };
    subscriber = { getStats: vi.fn().mockResolvedValue(new Map()) };
    checker = new NetworkReachabilityChecker({
      streamClient: fromPartial<StreamClient>(streamClient),
      getSfuClient: () => fromPartial<StreamSfuClient>(sfuClient),
      getSubscriber: () =>
        subscriber ? fromPartial<Subscriber>(subscriber) : undefined,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('prefers the SFU when several checks pass', async () => {
    sfuClient.probe.mockResolvedValue(true);
    streamClient.probeConnection.mockResolvedValue(true);
    inboundPackets(100, 150);

    await expect(check()).resolves.toBe('sfu');
    expect(sfuClient.probe).toHaveBeenCalledWith(2, 1500);
  });

  it('falls back to the coordinator when the SFU socket is not usable', async () => {
    sfuClient.isHealthy = false;
    streamClient.probeConnection.mockResolvedValue(true);

    await expect(check()).resolves.toBe('coordinator');
    expect(sfuClient.probe).not.toHaveBeenCalled();
  });

  it('falls back to inbound media that keeps arriving', async () => {
    inboundPackets(100, 150);

    await expect(check()).resolves.toBe('media');
  });

  it('is unreachable when inbound media stopped', async () => {
    inboundPackets(100, 100);

    await expect(check()).resolves.toBe('unreachable');
  });

  it('treats no inbound streams as no evidence', async () => {
    await expect(checker.check()).resolves.toBe('unreachable');
    expect(subscriber!.getStats).toHaveBeenCalledTimes(1);
  });

  it('treats a missing subscriber as no evidence', async () => {
    subscriber = undefined;

    await expect(checker.check()).resolves.toBe('unreachable');
  });

  it('treats failing stats as no evidence', async () => {
    subscriber!.getStats.mockRejectedValue(new Error('closed'));

    await expect(checker.check()).resolves.toBe('unreachable');
  });

  it('shares one check between concurrent callers', async () => {
    sfuClient.probe.mockResolvedValue(true);

    const first = checker.check();
    const second = checker.check();

    expect(second).toBe(first);
    await expect(first).resolves.toBe('sfu');
    expect(sfuClient.probe).toHaveBeenCalledTimes(1);
  });

  it('runs a new check once the previous one settled', async () => {
    await checker.check();
    await checker.check();

    expect(sfuClient.probe).toHaveBeenCalledTimes(2);
  });
});

describe('CallOfflineState', () => {
  let state: CallState;
  let check: ReturnType<typeof vi.fn>;
  let leaving: boolean;
  let pendingReconnect: boolean;
  let intact: boolean;
  let discardSfuConnection: ReturnType<typeof vi.fn>;
  let reconnect: ReturnType<typeof vi.fn>;
  let setStatsPaused: ReturnType<typeof vi.fn>;
  let offline: CallOfflineState;

  const setBrowserOnline = (onLine: boolean) => {
    vi.stubGlobal('navigator', { onLine });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    setBrowserOnline(true);
    state = new CallState();
    state.setCallingState(CallingState.JOINED);
    check = vi.fn().mockResolvedValue('unreachable');
    leaving = false;
    pendingReconnect = false;
    intact = true;
    discardSfuConnection = vi.fn();
    reconnect = vi.fn();
    setStatsPaused = vi.fn();
    offline = new CallOfflineState({
      state,
      tracer: fromPartial<Tracer>({ trace: vi.fn() }),
      logger: videoLoggerSystem.getLogger('test'),
      reachability: fromPartial<NetworkReachabilityChecker>({ check }),
      isLeaving: () => leaving,
      hasPendingReconnect: () => pendingReconnect,
      connectionsIntact: () => intact,
      discardSfuConnection,
      reconnect,
      setStatsPaused,
    });
  });

  afterEach(() => {
    offline.dispose();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('an offline event the browser contradicts', () => {
    it('leaves the call alone when the network is reachable', async () => {
      check.mockResolvedValue('sfu');

      offline.handleNetworkChanged(false);
      await vi.advanceTimersByTimeAsync(0);

      expect(state.callingState).toBe(CallingState.JOINED);
      expect(offline.networkAvailable).toBeUndefined();
      expect(setStatsPaused).not.toHaveBeenCalled();
    });

    it('goes offline when the network is unreachable', async () => {
      offline.handleNetworkChanged(false);
      await vi.advanceTimersByTimeAsync(0);

      expect(state.callingState).toBe(CallingState.OFFLINE);
      expect(setStatsPaused).toHaveBeenCalledWith(true);
    });

    it('ignores a check that settles after dispose()', async () => {
      offline.handleNetworkChanged(false);
      offline.dispose();
      await vi.advanceTimersByTimeAsync(0);

      expect(state.callingState).toBe(CallingState.JOINED);
    });
  });

  describe('while offline', () => {
    beforeEach(() => {
      setBrowserOnline(false);
      offline.handleNetworkChanged(false);
    });

    it('goes offline right away and stays in one offline episode', () => {
      const networkAvailable = offline.networkAvailable;

      offline.goOffline();

      expect(state.callingState).toBe(CallingState.OFFLINE);
      expect(offline.networkAvailable).toBe(networkAvailable);
      expect(check).not.toHaveBeenCalled();
    });

    it('reconnects on the online event with the time spent offline', async () => {
      await vi.advanceTimersByTimeAsync(1500);
      offline.handleNetworkChanged(true);
      await vi.advanceTimersByTimeAsync(0);

      expect(discardSfuConnection).toHaveBeenCalledTimes(1);
      expect(reconnect).toHaveBeenCalledWith(1500);
      expect(setStatsPaused).toHaveBeenLastCalledWith(false);
      expect(offline.networkAvailable).toBeUndefined();
    });

    it('keeps the socket of a reconnect already in flight', async () => {
      pendingReconnect = true;

      offline.handleNetworkChanged(true);
      await vi.advanceTimersByTimeAsync(0);

      expect(discardSfuConnection).not.toHaveBeenCalled();
      expect(reconnect).toHaveBeenCalledTimes(1);
    });

    it('resumes without reconnecting when the SFU answers and nothing broke', async () => {
      check.mockResolvedValue('sfu');
      await vi.advanceTimersByTimeAsync(2000);

      expect(state.callingState).toBe(CallingState.JOINED);
      expect(reconnect).not.toHaveBeenCalled();
      expect(discardSfuConnection).not.toHaveBeenCalled();
      expect(setStatsPaused).toHaveBeenLastCalledWith(false);
    });

    it.each([
      ['the connections broke', () => (intact = false), 'sfu'],
      ['a reconnect is pending', () => (pendingReconnect = true), 'sfu'],
      ['only the coordinator answers', () => {}, 'coordinator'],
      ['only media proves the network', () => {}, 'media'],
    ])('reconnects when %s', async (_, arrange, reachability) => {
      arrange();
      check.mockResolvedValue(reachability);
      await vi.advanceTimersByTimeAsync(2000);

      expect(reconnect).toHaveBeenCalledTimes(1);
    });

    it('releases the offline state when a reconnect already moved the call on', async () => {
      state.setCallingState(CallingState.JOINED);
      check.mockResolvedValue('sfu');
      await vi.advanceTimersByTimeAsync(2000);

      expect(offline.networkAvailable).toBeUndefined();
      expect(reconnect).not.toHaveBeenCalled();
    });

    it('stays offline while the network is unreachable', async () => {
      await vi.advanceTimersByTimeAsync(30_000);

      expect(state.callingState).toBe(CallingState.OFFLINE);
      expect(check.mock.calls.length).toBeGreaterThan(1);
      expect(reconnect).not.toHaveBeenCalled();
    });

    it('dispose() releases waiters without reconnecting and stops re-checks', async () => {
      const networkAvailable = offline.networkAvailable;

      offline.dispose();
      await vi.advanceTimersByTimeAsync(30_000);

      await expect(networkAvailable).resolves.toBe(false);
      expect(check).not.toHaveBeenCalled();
      expect(reconnect).not.toHaveBeenCalled();
    });
  });

  it('does not go offline while the call is being left', () => {
    leaving = true;

    offline.goOffline();

    expect(state.callingState).toBe(CallingState.JOINED);
    expect(offline.networkAvailable).toBeUndefined();
  });
});
