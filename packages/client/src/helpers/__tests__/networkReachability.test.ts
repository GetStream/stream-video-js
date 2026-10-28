import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { NetworkReachabilityChecker } from '../networkReachability';
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
