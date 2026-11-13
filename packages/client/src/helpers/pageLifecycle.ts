import type { Tracer } from '../stats';
import { isReactNative } from './platforms';

export type PageLifecycleTracingOptions = {
  tracer: Tracer;
  /**
   * Invoked every time the page becomes hidden, after the change is traced.
   */
  onHidden?: () => void;
};

/**
 * Traces the page lifecycle: visibility changes (on return, with how long
 * the page was hidden and the longest timer gap while hidden) and
 * `freeze`/`resume` (Chromium only). A no-op outside the browser
 * (React Native, Node.js).
 *
 * The longest timer gap tells a hidden page that kept running apart from
 * one whose JavaScript was suspended, as iOS does with background tabs.
 *
 * @returns a function that stops tracing.
 */
export const tracePageLifecycle = ({
  tracer,
  onHidden,
}: PageLifecycleTracingOptions): (() => void) => {
  if (typeof document === 'undefined' || isReactNative()) return () => {};

  let hiddenAt: number | undefined;
  // when tracing starts on a hidden page, `hiddenMs` covers only the part
  // since the start, so the `visible` record is flagged as a lower bound
  let hiddenBeforeStart = false;
  let lastTickAt = 0;
  let maxTimerGapMs = 0;
  let timerId: ReturnType<typeof setInterval> | undefined;

  const tick = () => {
    const now = Date.now();
    maxTimerGapMs = Math.max(maxTimerGapMs, now - lastTickAt);
    lastTickAt = now;
  };

  const startHiddenTimer = () => {
    hiddenAt = lastTickAt = Date.now();
    maxTimerGapMs = 0;
    clearInterval(timerId);
    timerId = setInterval(tick, 5000);
  };

  const stopHiddenTimer = () => {
    clearInterval(timerId);
    timerId = undefined;
  };

  const onVisibilityChange = () => {
    const state = document.visibilityState;
    if (state === 'hidden') {
      if (hiddenAt !== undefined) return;
      startHiddenTimer();
      tracer.trace('page.visibility', { state });
      onHidden?.();
    } else if (hiddenAt !== undefined) {
      tick();
      stopHiddenTimer();
      tracer.trace('page.visibility', {
        state,
        hiddenMs: Date.now() - hiddenAt,
        maxTimerGapMs,
        ...(hiddenBeforeStart && { hiddenBeforeStart }),
      });
      hiddenAt = undefined;
      hiddenBeforeStart = false;
    }
  };

  const onFreeze = () => tracer.trace('page.freeze', null);
  const onResume = () => tracer.trace('page.resume', null);

  const state = document.visibilityState;
  tracer.trace('page.visibility', {
    state,
    ...(document.wasDiscarded && { wasDiscarded: true }),
  });
  if (state === 'hidden') {
    hiddenBeforeStart = true;
    startHiddenTimer();
  }

  const controller = new AbortController();
  const { signal } = controller;
  document.addEventListener('visibilitychange', onVisibilityChange, { signal });
  document.addEventListener('freeze', onFreeze, { signal });
  document.addEventListener('resume', onResume, { signal });
  return () => {
    controller.abort();
    stopHiddenTimer();
  };
};
