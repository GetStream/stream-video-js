/**
 * @vitest-environment happy-dom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scheduleOfflineRechecks } from '../offlineRechecks';
import { videoLoggerSystem } from '../../logger';
import { promiseWithResolvers } from '../promise';

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('scheduleOfflineRechecks', () => {
  const logger = videoLoggerSystem.getLogger('test');
  let stop: (() => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
    vi.useRealTimers();
    // @ts-expect-error restore the prototype getter
    delete document.visibilityState;
  });

  it('checks on a capped backoff, starting after the first delay', async () => {
    const check = vi.fn().mockResolvedValue(undefined);
    stop = scheduleOfflineRechecks({ check, logger, delaysMs: [100, 300] });
    expect(check).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    expect(check).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(299);
    expect(check).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(check).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(300);
    expect(check).toHaveBeenCalledTimes(3);
  });

  it.each([
    ['the page becomes visible', () => setVisibility('visible')],
    ['the page resumes', () => document.dispatchEvent(new Event('resume'))],
    ['the page is shown', () => window.dispatchEvent(new Event('pageshow'))],
  ])('checks when %s', async (_, trigger) => {
    const check = vi.fn().mockResolvedValue(undefined);
    stop = scheduleOfflineRechecks({ check, logger, delaysMs: [10_000] });

    trigger();

    expect(check).toHaveBeenCalledTimes(1);
  });

  it('does not check when the page becomes hidden', async () => {
    const check = vi.fn().mockResolvedValue(undefined);
    stop = scheduleOfflineRechecks({ check, logger, delaysMs: [10_000] });

    setVisibility('hidden');

    expect(check).not.toHaveBeenCalled();
  });

  it('runs one check at a time', async () => {
    const pending = promiseWithResolvers<void>();
    const check = vi.fn().mockReturnValue(pending.promise);
    stop = scheduleOfflineRechecks({ check, logger, delaysMs: [100] });

    setVisibility('visible');
    setVisibility('visible');
    await vi.advanceTimersByTimeAsync(1000);
    expect(check).toHaveBeenCalledTimes(1);

    pending.resolve();
    await vi.advanceTimersByTimeAsync(100);
    expect(check).toHaveBeenCalledTimes(2);
  });

  it('keeps checking after a failed check', async () => {
    const check = vi.fn().mockRejectedValue(new Error('boom'));
    stop = scheduleOfflineRechecks({ check, logger, delaysMs: [100] });

    await vi.advanceTimersByTimeAsync(200);

    expect(check).toHaveBeenCalledTimes(2);
  });

  it('stops checking once stopped', async () => {
    const check = vi.fn().mockResolvedValue(undefined);
    const stopChecks = scheduleOfflineRechecks({
      check,
      logger,
      delaysMs: [100],
    });
    await vi.advanceTimersByTimeAsync(100);

    stopChecks();
    await vi.advanceTimersByTimeAsync(1000);
    setVisibility('visible');

    expect(check).toHaveBeenCalledTimes(1);
  });
});
