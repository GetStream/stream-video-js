import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InterruptedTrackRecovery } from '../InterruptedTrackRecovery';
import { promiseWithResolvers } from '../../helpers/promise';

describe('InterruptedTrackRecovery', () => {
  let recover: ReturnType<typeof vi.fn<() => Promise<void>>>;
  let trace: ReturnType<
    typeof vi.fn<(phase: string, attempt?: number) => void>
  >;
  let unwatch: ReturnType<typeof vi.fn<() => void>>;
  let interrupted: boolean;
  let signal: () => void;
  let recovery: InterruptedTrackRecovery;

  beforeEach(() => {
    vi.useFakeTimers();
    recover = vi.fn(async () => {});
    trace = vi.fn();
    unwatch = vi.fn();
    interrupted = false;
    signal = () => {};
    recovery = new InterruptedTrackRecovery({
      recover,
      isInterrupted: () => interrupted,
      watch: (onMaybeOver) => {
        signal = onMaybeOver;
        return unwatch;
      },
      trace,
    });
  });

  afterEach(() => {
    recovery.cancel();
    vi.useRealTimers();
  });

  it('recovers after the settle delay when not interrupted', async () => {
    recovery.arm();
    expect(recovery.isArmed()).toBe(true);
    await vi.advanceTimersByTimeAsync(999);
    expect(recover).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(recover).toHaveBeenCalledTimes(1);
    expect(recovery.isArmed()).toBe(false);
    expect(unwatch).toHaveBeenCalledTimes(1);
  });

  it('waits for a signal while interrupted', async () => {
    interrupted = true;
    recovery.arm();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(recover).not.toHaveBeenCalled();
    interrupted = false;
    signal();
    await vi.runOnlyPendingTimersAsync();
    expect(recover).toHaveBeenCalledTimes(1);
  });

  it('ignores a signal that arrives while still interrupted', async () => {
    interrupted = true;
    recovery.arm();
    await vi.advanceTimersByTimeAsync(1000);
    signal();
    await vi.runOnlyPendingTimersAsync();
    expect(recover).not.toHaveBeenCalled();
    expect(recovery.isArmed()).toBe(true);
  });

  it('leaves a signal that arrives before the settle delay to the timer', async () => {
    recovery.arm();
    signal();
    await vi.advanceTimersByTimeAsync(999);
    expect(recover).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(recover).toHaveBeenCalledTimes(1);
  });

  it('gives up after 3 failed attempts', async () => {
    recover.mockRejectedValue(new Error('NotReadableError'));
    recovery.arm();
    await vi.advanceTimersByTimeAsync(1000 + 2000 + 2000 + 2000);
    expect(recover).toHaveBeenCalledTimes(3);
    expect(recovery.isArmed()).toBe(false);
    expect(trace).toHaveBeenCalledWith('gaveUp', 3);
  });

  it('recovers on a retry after a failed attempt', async () => {
    recover.mockRejectedValueOnce(new Error('NotReadableError'));
    recovery.arm();
    await vi.advanceTimersByTimeAsync(1000 + 2000);
    expect(recover).toHaveBeenCalledTimes(2);
    expect(recovery.isArmed()).toBe(false);
    expect(trace).toHaveBeenCalledWith('recovered', 2);
  });

  it('cancel stops a pending attempt and unsubscribes', async () => {
    recovery.arm();
    recovery.cancel();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(recover).not.toHaveBeenCalled();
    expect(unwatch).toHaveBeenCalledTimes(1);
    expect(recovery.isArmed()).toBe(false);
  });

  it('does not retry an attempt that was cancelled while in flight', async () => {
    const pending = promiseWithResolvers<void>();
    recover.mockReturnValueOnce(pending.promise);
    recovery.arm();
    await vi.advanceTimersByTimeAsync(1000);
    recovery.cancel();
    pending.reject(new Error('NotReadableError'));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(recover).toHaveBeenCalledTimes(1);
    expect(trace).not.toHaveBeenCalledWith('gaveUp', expect.anything());
  });

  it('does not start a second attempt while one is in flight', async () => {
    const pending = promiseWithResolvers<void>();
    recover.mockReturnValueOnce(pending.promise);
    recovery.arm();
    await vi.advanceTimersByTimeAsync(1000);
    signal();
    signal();
    expect(recover).toHaveBeenCalledTimes(1);
    pending.resolve();
  });

  it('keeps the attempt budget when re-armed shortly after an attempt', async () => {
    for (let i = 0; i < 3; i++) {
      recovery.arm();
      await vi.advanceTimersByTimeAsync(1000);
      expect(recovery.isArmed()).toBe(false);
    }
    expect(recover).toHaveBeenCalledTimes(3);

    recovery.arm();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(recovery.isArmed()).toBe(false);
    expect(recover).toHaveBeenCalledTimes(3);
    expect(trace).toHaveBeenCalledWith('gaveUp', 3);
  });

  it('restores the attempt budget after a quiet period', async () => {
    for (let i = 0; i < 3; i++) {
      recovery.arm();
      await vi.advanceTimersByTimeAsync(1000);
    }
    await vi.advanceTimersByTimeAsync(30_000);

    recovery.arm();
    await vi.advanceTimersByTimeAsync(1000);

    expect(recover).toHaveBeenCalledTimes(4);
  });

  it('retries later when the timer fires during an attempt of an earlier arm', async () => {
    const pending = promiseWithResolvers<void>();
    recover.mockReturnValueOnce(pending.promise);
    recovery.arm();
    await vi.advanceTimersByTimeAsync(1000);
    recovery.cancel();
    recovery.arm();
    await vi.advanceTimersByTimeAsync(1000);
    expect(recover).toHaveBeenCalledTimes(1);

    pending.resolve();
    await vi.advanceTimersByTimeAsync(2000);

    expect(recover).toHaveBeenCalledTimes(2);
    expect(recovery.isArmed()).toBe(false);
  });

  it('arming twice keeps a single subscription', async () => {
    const watch = vi.fn(() => unwatch);
    recovery = new InterruptedTrackRecovery({
      recover,
      isInterrupted: () => interrupted,
      watch,
      trace,
    });
    recovery.arm();
    recovery.arm();
    expect(watch).toHaveBeenCalledTimes(1);
  });
});
