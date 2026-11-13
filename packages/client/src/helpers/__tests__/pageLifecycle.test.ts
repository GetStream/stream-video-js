/**
 * @vitest-environment happy-dom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tracePageLifecycle } from '../pageLifecycle';
import { Tracer } from '../../stats';

const setVisibility = (state: DocumentVisibilityState, dispatch = true) => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  if (dispatch) document.dispatchEvent(new Event('visibilitychange'));
};

const records = (tracer: Tracer) =>
  tracer.take().snapshot.map(([tag, , data]) => [tag, data]);

describe('tracePageLifecycle', () => {
  let tracer: Tracer;
  let stop: (() => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    tracer = new Tracer(null);
    setVisibility('visible', false);
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
    vi.useRealTimers();
    // @ts-expect-error restore the prototype getter
    delete document.visibilityState;
  });

  const start = (onHidden = vi.fn()) => {
    stop = tracePageLifecycle({ tracer, onHidden });
    return onHidden;
  };

  it('traces the initial visibility state without a timer', () => {
    start();
    expect(records(tracer)).toEqual([
      ['page.visibility', { state: 'visible' }],
    ]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('flags a page the browser discarded and reloaded', () => {
    Object.defineProperty(document, 'wasDiscarded', {
      configurable: true,
      value: true,
    });
    try {
      start();
      expect(records(tracer)).toEqual([
        ['page.visibility', { state: 'visible', wasDiscarded: true }],
      ]);
    } finally {
      // @ts-expect-error remove the test double
      delete document.wasDiscarded;
    }
  });

  it('traces hiding before invoking onHidden', () => {
    const onHidden = vi.fn(() => {
      expect(records(tracer)).toEqual([
        ['page.visibility', { state: 'hidden' }],
      ]);
    });
    start(onHidden);
    tracer.take();

    setVisibility('hidden');
    expect(onHidden).toHaveBeenCalledTimes(1);
  });

  it('reports the whole hidden span as a timer gap when timers were suspended', () => {
    start();
    setVisibility('hidden');
    // timers don't fire: the clock moves without running them
    vi.setSystemTime(Date.now() + 30_000);
    tracer.take();

    setVisibility('visible');
    expect(records(tracer)).toEqual([
      [
        'page.visibility',
        { state: 'visible', hiddenMs: 30_000, maxTimerGapMs: 30_000 },
      ],
    ]);
  });

  it('reports the hidden span once, ignoring a repeated hidden event', () => {
    const onHidden = start();
    setVisibility('hidden');
    vi.advanceTimersByTime(5000);
    setVisibility('hidden');
    vi.advanceTimersByTime(5000);
    expect(onHidden).toHaveBeenCalledTimes(1);
    tracer.take();

    setVisibility('visible');
    expect(records(tracer)).toEqual([
      [
        'page.visibility',
        { state: 'visible', hiddenMs: 10_000, maxTimerGapMs: 5000 },
      ],
    ]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('flags hiddenMs as partial when started while hidden', () => {
    setVisibility('hidden', false);
    start();
    vi.advanceTimersByTime(10_000);
    tracer.take();

    setVisibility('visible');
    setVisibility('hidden');
    vi.advanceTimersByTime(5000);
    setVisibility('visible');
    expect(records(tracer)).toEqual([
      [
        'page.visibility',
        {
          state: 'visible',
          hiddenMs: 10_000,
          maxTimerGapMs: 5000,
          hiddenBeforeStart: true,
        },
      ],
      ['page.visibility', { state: 'hidden' }],
      [
        'page.visibility',
        { state: 'visible', hiddenMs: 5000, maxTimerGapMs: 5000 },
      ],
    ]);
  });

  it('traces freeze/resume', () => {
    start();
    tracer.take();

    document.dispatchEvent(new Event('freeze'));
    document.dispatchEvent(new Event('resume'));
    expect(records(tracer)).toEqual([
      ['page.freeze', null],
      ['page.resume', null],
    ]);
  });

  it('is a no-op in React Native', () => {
    Object.defineProperty(navigator, 'product', {
      configurable: true,
      value: 'ReactNative',
    });
    try {
      const onHidden = start();
      setVisibility('hidden');
      expect(records(tracer)).toEqual([]);
      expect(onHidden).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      // @ts-expect-error restore the prototype getter
      delete navigator.product;
    }
  });

  it('stops tracing and clears the gap timer', () => {
    const onHidden = start();
    setVisibility('hidden');
    tracer.take();
    stop?.();
    stop = undefined;

    expect(vi.getTimerCount()).toBe(0);
    setVisibility('visible');
    setVisibility('hidden');
    document.dispatchEvent(new Event('freeze'));
    expect(records(tracer)).toEqual([]);
    expect(onHidden).toHaveBeenCalledTimes(1);
  });
});
