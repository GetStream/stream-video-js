import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RecoveryLoop, RecoveryLoopOptions } from '../RecoveryLoop';

describe('RecoveryLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const buildOptions = (
    overrides: Partial<RecoveryLoopOptions> = {},
  ): RecoveryLoopOptions => ({
    canRun: () => true,
    isComplete: () => false,
    run: vi.fn(async () => {}),
    ...overrides,
  });

  it('runs once and stops on first completion', async () => {
    const run = vi.fn(async () => {});
    const onCompletion = vi.fn();
    let complete = false;
    const loop = new RecoveryLoop(
      buildOptions({
        run,
        isComplete: () => complete,
        onCompletion,
      }),
    );

    loop.restart();
    complete = true;
    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledTimes(1);

    // Allow any post-await microtasks to flush, then ensure no further attempts
    // are scheduled.
    await vi.advanceTimersByTimeAsync(10_000);
    expect(run).toHaveBeenCalledTimes(1);
    expect(onCompletion).toHaveBeenCalledTimes(1);
  });

  it('retries up to maxAttempts (default 6) and then gives up', async () => {
    const run = vi.fn(async () => {});
    const onCompletion = vi.fn();
    const loop = new RecoveryLoop(
      buildOptions({ run, isComplete: () => false, onCompletion }),
    );

    loop.restart();
    // First attempt is scheduled at 0; subsequent ones at the default 500ms.
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(500 * 6);

    expect(run).toHaveBeenCalledTimes(6);
    expect(onCompletion).not.toHaveBeenCalled();

    // No further attempts even after a long wait.
    await vi.advanceTimersByTimeAsync(10_000);
    expect(run).toHaveBeenCalledTimes(6);
  });

  it('honours custom maxAttempts', async () => {
    const run = vi.fn(async () => {});
    const loop = new RecoveryLoop(
      buildOptions({ run, isComplete: () => false, maxAttempts: 2 }),
    );

    loop.restart();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(10_000);

    expect(run).toHaveBeenCalledTimes(2);
  });

  it('honours custom intervalMs between retries', async () => {
    const run = vi.fn(async () => {});
    const loop = new RecoveryLoop(
      buildOptions({
        run,
        isComplete: () => false,
        intervalMs: 200,
        maxAttempts: 3,
      }),
    );

    loop.restart();
    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(199);
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(run).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(200);
    expect(run).toHaveBeenCalledTimes(3);
  });

  it('does nothing when canRun() is false at restart time', async () => {
    const run = vi.fn(async () => {});
    const loop = new RecoveryLoop(
      buildOptions({ run, canRun: () => false, isComplete: () => false }),
    );

    loop.restart();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(run).not.toHaveBeenCalled();
  });

  it('stops scheduling further attempts once canRun() flips to false', async () => {
    const run = vi.fn(async () => {});
    let allowed = true;
    const loop = new RecoveryLoop(
      buildOptions({
        run,
        canRun: () => allowed,
        isComplete: () => false,
        intervalMs: 100,
        maxAttempts: 10,
      }),
    );

    loop.restart();
    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledTimes(1);

    allowed = false;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('clear() cancels a pending scheduled attempt', async () => {
    const run = vi.fn(async () => {});
    const loop = new RecoveryLoop(
      buildOptions({ run, isComplete: () => false, intervalMs: 500 }),
    );

    loop.restart();
    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledTimes(1);

    loop.clear();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('restart() resets the attempts budget after exhausting it', async () => {
    const run = vi.fn(async () => {});
    const loop = new RecoveryLoop(
      buildOptions({ run, isComplete: () => false, maxAttempts: 2 }),
    );

    loop.restart();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(run).toHaveBeenCalledTimes(2);

    loop.restart();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(500);
    expect(run).toHaveBeenCalledTimes(4);
  });

  it('resets the attempts counter after onCompletion fires', async () => {
    const run = vi.fn(async () => {});
    let complete = false;
    const loop = new RecoveryLoop(
      buildOptions({
        run,
        isComplete: () => complete,
        maxAttempts: 2,
        intervalMs: 100,
      }),
    );

    // First run: completes immediately. attempts goes 1 -> 0 via onCompletion.
    complete = true;
    loop.restart();
    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledTimes(1);

    // Second cycle: never completes. With maxAttempts=2 and a reset counter,
    // the loop must be able to make 2 more attempts without bumping into the
    // previously consumed budget.
    complete = false;
    loop.restart();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);
    expect(run).toHaveBeenCalledTimes(3);
  });

  it('does not preempt an in-flight attempt when restart() is called', async () => {
    let resolveRun: (() => void) | undefined;
    const run = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRun = resolve;
        }),
    );
    const loop = new RecoveryLoop(
      buildOptions({ run, isComplete: () => false, intervalMs: 100 }),
    );

    loop.restart();
    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledTimes(1);

    // restart() arrives while the first run() is still pending.
    loop.restart();
    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledTimes(1);

    // The in-flight attempt has to finish before the next attempt is
    // scheduled at the standard interval.
    resolveRun?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(100);
    expect(run).toHaveBeenCalledTimes(2);
  });
});
