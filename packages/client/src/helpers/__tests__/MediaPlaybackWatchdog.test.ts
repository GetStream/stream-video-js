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
  Object.defineProperty(el, 'srcObject', {
    value: 'srcObject' in state ? state.srcObject : new MediaStream(),
    writable: true,
  });
  Object.defineProperty(el, 'paused', { writable: true, configurable: true });
  Object.defineProperty(el, 'readyState', {
    value: state.readyState ?? 4,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(el, 'ended', {
    value: state.ended ?? false,
    writable: true,
    configurable: true,
  });
  setPaused(el, state.paused ?? true);
  return el;
};

const setPaused = (el: HTMLMediaElement, paused: boolean) => {
  Object.defineProperty(el, 'paused', {
    value: paused,
    writable: true,
    configurable: true,
  });
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

    // Simulate the element actually starting to play, and staying up long
    // enough for the recovery to count as settled.
    setPaused(el, false);
    el.dispatchEvent(new Event('playing'));
    await vi.advanceTimersByTimeAsync(1000);

    // A subsequent pause should trigger a fresh, immediate recovery attempt.
    setPaused(el, true);
    el.dispatchEvent(new Event('pause'));
    await vi.advanceTimersByTimeAsync(0);
    expect(play).toHaveBeenCalledTimes(3);
  });

  it('backs off instead of retrying immediately when playback has not settled', async () => {
    el.dispatchEvent(new Event('pause'));
    await vi.advanceTimersByTimeAsync(0);
    expect(play).toHaveBeenCalledTimes(1);

    // resumed, but re-paused before the settle delay elapsed
    setPaused(el, false);
    el.dispatchEvent(new Event('playing'));
    expect(tracer.trace).not.toHaveBeenCalledWith(
      'mediaPlayback.recover.success',
      {
        kind: 'audio',
        attempts: 1,
      },
    );
    await vi.advanceTimersByTimeAsync(500);
    setPaused(el, true);
    el.dispatchEvent(new Event('pause'));

    // the next attempt is subject to backoff, not scheduled on the next tick
    await vi.advanceTimersByTimeAsync(0);
    expect(play).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(6000);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('stops fighting an element that re-pauses after every successful play', async () => {
    setup({ kind: 'video' });
    // Safari re-pauses the element right after play() resolves. This used to
    // reset the attempt counter, so the loop spun with a zero delay forever.
    play.mockImplementation(async () => {
      setPaused(el, false);
      el.dispatchEvent(new Event('playing'));
      setPaused(el, true);
      el.dispatchEvent(new Event('pause'));
    });

    el.dispatchEvent(new Event('pause'));
    for (let i = 0; i < 20; i++) {
      await vi.advanceTimersByTimeAsync(6000);
    }

    expect(play).toHaveBeenCalledTimes(10);
    expect(tracer.trace).toHaveBeenCalledWith('mediaPlayback.recover.giveUp', {
      kind: 'video',
      attempts: 10,
    });

    // External playback can still emit `playing` after the watchdog gave up
    // (for example from a user gesture or another playback helper). If it
    // re-pauses before settling, it must not revive the watchdog or trace a
    // false recovery success.
    setPaused(el, false);
    el.dispatchEvent(new Event('playing'));
    setPaused(el, true);
    el.dispatchEvent(new Event('pause'));
    await vi.advanceTimersByTimeAsync(1000);

    expect(tracer.trace).not.toHaveBeenCalledWith(
      'mediaPlayback.recover.success',
      {
        kind: 'video',
        attempts: 10,
      },
    );

    // and it stays stopped, without tracing the pause storm
    const traceMock = tracer.trace as unknown as MockInstance;
    const tracesBefore = traceMock.mock.calls.length;
    for (let i = 0; i < 100; i++) {
      el.dispatchEvent(new Event('pause'));
    }
    await vi.advanceTimersByTimeAsync(6000);

    expect(play).toHaveBeenCalledTimes(10);
    expect(traceMock.mock.calls.length).toBe(tracesBefore);
  });

  it('revives once playback genuinely holds for the settle window', async () => {
    setup({ kind: 'video' });
    play.mockImplementation(async () => {
      setPaused(el, false);
      el.dispatchEvent(new Event('playing'));
      setPaused(el, true);
      el.dispatchEvent(new Event('pause'));
    });

    el.dispatchEvent(new Event('pause'));
    for (let i = 0; i < 20; i++) {
      await vi.advanceTimersByTimeAsync(6000);
    }
    expect(play).toHaveBeenCalledTimes(10); // gave up

    play.mockResolvedValue(undefined);
    setPaused(el, false);
    el.dispatchEvent(new Event('playing'));
    await vi.advanceTimersByTimeAsync(1500);

    expect(tracer.trace).toHaveBeenCalledWith('mediaPlayback.recover.success', {
      kind: 'video',
      attempts: 10,
    });

    // recovery is live again: the attempt counter was reset, so a fresh pause
    // gets an immediate attempt rather than being ignored
    setPaused(el, true);
    el.dispatchEvent(new Event('pause'));
    await vi.advanceTimersByTimeAsync(0);
    expect(play).toHaveBeenCalledTimes(11);
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
