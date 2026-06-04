/**
 * @vitest-environment happy-dom
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import { MediaPlaybackWatchdog } from '../MediaPlaybackWatchdog';
import type { Tracer } from '../../stats';

const createTracer = () => ({ trace: vi.fn() }) as unknown as Tracer;

type FakeMediaState = {
  srcObject?: MediaStream | null;
  paused?: boolean;
  readyState?: number;
  ended?: boolean;
};

const createMediaElement = (
  kind: 'audio' | 'video',
  state: FakeMediaState = {},
) => {
  const el = document.createElement(kind) as HTMLMediaElement;
  Object.defineProperty(el, 'srcObject', { writable: true });
  Object.defineProperty(el, 'paused', { writable: true, configurable: true });
  Object.defineProperty(el, 'readyState', {
    writable: true,
    configurable: true,
  });
  Object.defineProperty(el, 'ended', { writable: true, configurable: true });
  el.srcObject = 'srcObject' in state ? state.srcObject : new MediaStream();
  el.paused = state.paused ?? true;
  el.readyState = state.readyState ?? 4;
  el.ended = state.ended ?? false;
  return el;
};

type SetupOpts = {
  kind?: 'audio' | 'video';
  state?: FakeMediaState;
  isBlocked?: () => boolean;
};

describe('MediaPlaybackWatchdog', () => {
  let tracer: Tracer;
  let el: HTMLMediaElement;
  let play: MockInstance;
  let watchdog: MediaPlaybackWatchdog;

  const setup = (opts: SetupOpts = {}) => {
    watchdog?.dispose();
    const kind = opts.kind ?? 'audio';
    el = createMediaElement(kind, opts.state);
    play = vi.spyOn(el, 'play').mockResolvedValue();
    watchdog = new MediaPlaybackWatchdog({
      element: el,
      kind,
      tracer,
      isBlocked: opts.isBlocked,
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    tracer = createTracer();
    setup();
  });

  afterEach(() => {
    watchdog.dispose();
    vi.useRealTimers();
  });

  it('calls play() after a pause event', async () => {
    el.dispatchEvent(new Event('pause'));
    await vi.advanceTimersByTimeAsync(0);

    expect(play).toHaveBeenCalledTimes(1);
  });

  it('retries with backoff up to the attempt cap then stops', async () => {
    setup({ kind: 'video' });
    play.mockRejectedValue(new Error('nope'));

    el.dispatchEvent(new Event('pause'));

    // Drain all scheduled retries. retryInterval caps at 5000ms per attempt;
    // 10 attempts is bounded by ~50s of fake time.
    for (let i = 0; i < 20; i++) {
      await vi.advanceTimersByTimeAsync(6000);
    }

    expect(play).toHaveBeenCalledTimes(10);
  });

  it('continues recovering on subsequent pause events after a successful resume', async () => {
    play.mockRejectedValueOnce(new Error('fail-1'));

    el.dispatchEvent(new Event('pause'));
    await vi.advanceTimersByTimeAsync(0);
    expect(play).toHaveBeenCalledTimes(1);

    // Drain the queued backoff retry, which now resolves.
    await vi.advanceTimersByTimeAsync(6000);
    expect(play).toHaveBeenCalledTimes(2);

    // Simulate the element actually starting to play.
    el.dispatchEvent(new Event('playing'));

    // A subsequent pause should still trigger a fresh recovery attempt.
    el.dispatchEvent(new Event('pause'));
    await vi.advanceTimersByTimeAsync(0);
    expect(play).toHaveBeenCalledTimes(3);
  });

  it('does not attempt recovery when srcObject is null', async () => {
    setup({ state: { srcObject: null } });

    el.dispatchEvent(new Event('pause'));
    await vi.advanceTimersByTimeAsync(6000);

    expect(play).not.toHaveBeenCalled();
  });

  it('does not attempt recovery when isBlocked returns true', async () => {
    setup({ isBlocked: () => true });

    el.dispatchEvent(new Event('pause'));
    await vi.advanceTimersByTimeAsync(6000);

    expect(play).not.toHaveBeenCalled();
  });

  it('does not attempt recovery when the element is already playing', async () => {
    setup({ state: { paused: false } });

    // a routine `suspend` while the element is actually playing should not
    // trigger a recovery attempt
    el.dispatchEvent(new Event('suspend'));
    await vi.advanceTimersByTimeAsync(6000);

    expect(play).not.toHaveBeenCalled();
  });

  it('does not attempt recovery when readyState is too low', async () => {
    setup({ state: { readyState: 0 } });

    el.dispatchEvent(new Event('pause'));
    await vi.advanceTimersByTimeAsync(6000);

    expect(play).not.toHaveBeenCalled();
  });

  it('dispose removes listeners and prevents further recovery', async () => {
    watchdog.dispose();

    el.dispatchEvent(new Event('pause'));
    el.dispatchEvent(new Event('suspend'));
    await vi.advanceTimersByTimeAsync(6000);

    expect(play).not.toHaveBeenCalled();
  });

  it('does not stack timers when pause fires multiple times before the first attempt', async () => {
    el.dispatchEvent(new Event('pause'));
    el.dispatchEvent(new Event('pause'));
    el.dispatchEvent(new Event('suspend'));

    await vi.advanceTimersByTimeAsync(0);

    expect(play).toHaveBeenCalledTimes(1);
  });
});
