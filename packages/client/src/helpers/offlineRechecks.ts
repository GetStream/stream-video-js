import type { ScopedLogger } from '../logger';
import { isReactNative } from './platforms';

/**
 * Whether the browser reports having no network. Reliable when `true`;
 * always `false` outside the browser.
 */
export const isBrowserOffline = () =>
  typeof navigator !== 'undefined' && navigator.onLine === false;

/**
 * Whether the browser reports having a network. Only a hint: it is `true`
 * on any network interface, reachable or not. Always `false` outside the
 * browser.
 */
export const isBrowserOnline = () =>
  typeof navigator !== 'undefined' && navigator.onLine === true;

export type OfflineRechecksOptions = {
  /**
   * Checks whether the network is reachable again. Runs one at a time.
   */
  check: () => Promise<void>;
  logger: ScopedLogger;
  /**
   * The delays between checks. The last one repeats until stopped.
   */
  delaysMs?: number[];
};

/**
 * Runs `check` while the device is reported offline: on a capped backoff,
 * and whenever the page becomes visible or resumes. The first check waits
 * for the first delay, as going offline follows a failed check or a browser
 * report of no network. A page
 * that was frozen can receive a stale `offline` event and never get the
 * `online` event that would undo it, so the event alone can't end it.
 * Visibility and resume triggers are a no-op outside the browser.
 *
 * @returns a function that stops the checks.
 */
export const scheduleOfflineRechecks = ({
  check,
  logger,
  delaysMs = [2000, 4000, 8000, 10000],
}: OfflineRechecksOptions): (() => void) => {
  let stopped = false;
  let running = false;
  let attempt = 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const scheduleNext = () => {
    const delay = delaysMs[Math.min(attempt, delaysMs.length - 1)];
    attempt++;
    timeoutId = setTimeout(run, delay);
  };

  const run = () => {
    if (stopped || running) return;
    running = true;
    clearTimeout(timeoutId);
    check()
      .catch((err) => logger.warn('Network reachability check failed', err))
      .finally(() => {
        running = false;
        if (!stopped) scheduleNext();
      });
  };

  const controller = new AbortController();
  if (typeof document !== 'undefined' && !isReactNative()) {
    const { signal } = controller;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisibilityChange, {
      signal,
    });
    document.addEventListener('resume', run, { signal });
    window.addEventListener('pageshow', run, { signal });
  }

  scheduleNext();

  return () => {
    stopped = true;
    clearTimeout(timeoutId);
    controller.abort();
  };
};
