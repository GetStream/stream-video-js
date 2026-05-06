import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeartbeatController } from '../internal/HeartbeatController';
import { createFakeWorkerTimer } from './helpers/fakeTimers';

describe('HeartbeatController', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('start() arms the ping for the configured interval', async () => {
    const sendPing = vi.fn();
    const hc = new HeartbeatController({
      options: { pingIntervalMs: 25000, healthTimeoutMs: 35000 },
      timers: createFakeWorkerTimer(),
      sendPing,
      onUnhealthy: vi.fn(),
      getClientId: () => 'client-1',
    });
    hc.start();
    expect(sendPing).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(24999);
    expect(sendPing).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2);
    expect(sendPing).toHaveBeenCalledWith('client-1');
  });

  it('notePingReply re-arms the ping; sendPing fires once per cycle', async () => {
    const sendPing = vi.fn();
    const hc = new HeartbeatController({
      options: { pingIntervalMs: 1000, healthTimeoutMs: 35000 },
      timers: createFakeWorkerTimer(),
      sendPing,
      onUnhealthy: vi.fn(),
      getClientId: () => 'client-1',
    });
    hc.start();
    await vi.advanceTimersByTimeAsync(1001);
    expect(sendPing).toHaveBeenCalledTimes(1);
    hc.notePingReply();
    await vi.advanceTimersByTimeAsync(1001);
    expect(sendPing).toHaveBeenCalledTimes(2);
  });

  it('watchdog fires after healthTimeoutMs of silence and calls onUnhealthy', async () => {
    const onUnhealthy = vi.fn();
    const hc = new HeartbeatController({
      options: { pingIntervalMs: 25000, healthTimeoutMs: 1000 },
      timers: createFakeWorkerTimer(),
      sendPing: vi.fn(),
      onUnhealthy,
      getClientId: () => 'client-1',
    });
    hc.start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(onUnhealthy).toHaveBeenCalledTimes(1);
  });

  it('watchdog does NOT fire if noteEventReceived is called before the timeout', async () => {
    const onUnhealthy = vi.fn();
    const hc = new HeartbeatController({
      options: { pingIntervalMs: 25000, healthTimeoutMs: 1000 },
      timers: createFakeWorkerTimer(),
      sendPing: vi.fn(),
      onUnhealthy,
      getClientId: () => 'client-1',
    });
    hc.start();
    await vi.advanceTimersByTimeAsync(500);
    hc.noteEventReceived();
    await vi.advanceTimersByTimeAsync(800);
    expect(onUnhealthy).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(onUnhealthy).toHaveBeenCalledTimes(1);
  });

  it('watchdog handler false-fire guard via lastEventAt', async () => {
    // Fire two notes back-to-back: the first watchdog handler races into the
    // second note. Only one onUnhealthy call should happen, and only after the
    // most recent note is older than healthTimeoutMs.
    const onUnhealthy = vi.fn();
    const hc = new HeartbeatController({
      options: { pingIntervalMs: 25000, healthTimeoutMs: 1000 },
      timers: createFakeWorkerTimer(),
      sendPing: vi.fn(),
      onUnhealthy,
      getClientId: () => 'client-1',
    });
    hc.noteEventReceived();
    await vi.advanceTimersByTimeAsync(500);
    hc.noteEventReceived();
    await vi.advanceTimersByTimeAsync(900);
    expect(onUnhealthy).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(100);
    expect(onUnhealthy).toHaveBeenCalledTimes(1);
  });

  it('stop() cancels both timers', async () => {
    const sendPing = vi.fn();
    const onUnhealthy = vi.fn();
    const hc = new HeartbeatController({
      options: { pingIntervalMs: 1000, healthTimeoutMs: 1000 },
      timers: createFakeWorkerTimer(),
      sendPing,
      onUnhealthy,
      getClientId: () => 'client-1',
    });
    hc.start();
    hc.stop();
    await vi.advanceTimersByTimeAsync(2000);
    expect(sendPing).not.toHaveBeenCalled();
    expect(onUnhealthy).not.toHaveBeenCalled();
  });

  it('sendPing is not called if getClientId returns undefined', async () => {
    const sendPing = vi.fn();
    const hc = new HeartbeatController({
      options: { pingIntervalMs: 1000, healthTimeoutMs: 35000 },
      timers: createFakeWorkerTimer(),
      sendPing,
      onUnhealthy: vi.fn(),
      getClientId: () => undefined,
    });
    hc.start();
    await vi.advanceTimersByTimeAsync(1001);
    expect(sendPing).not.toHaveBeenCalled();
  });
});
