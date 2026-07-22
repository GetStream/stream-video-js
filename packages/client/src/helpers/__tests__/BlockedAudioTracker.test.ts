/**
 * @vitest-environment happy-dom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlockedAudioTracker } from '../BlockedAudioTracker';
import { getCurrentValue } from '../../store/rxUtils';
import type { Tracer } from '../../stats';

const createTracer = () =>
  ({
    trace: vi.fn(),
  }) as unknown as Tracer;

const createAudioElement = (withSrcObject = true) => {
  const el = document.createElement('audio');
  Object.defineProperty(el, 'srcObject', { writable: true });
  if (withSrcObject) {
    (el as HTMLAudioElement).srcObject = new MediaStream();
  }
  return el;
};

describe('BlockedAudioTracker', () => {
  let tracer: Tracer;
  let tracker: BlockedAudioTracker;

  beforeEach(() => {
    tracer = createTracer();
    tracker = new BlockedAudioTracker(tracer);
  });

  afterEach(() => {
    tracker.dispose();
  });

  it('emits autoplayBlocked$ true after markBlocked(el, true)', () => {
    expect(getCurrentValue(tracker.autoplayBlocked$)).toBe(false);
    tracker.markBlocked(createAudioElement(), true);
    expect(getCurrentValue(tracker.autoplayBlocked$)).toBe(true);
  });

  it('emits autoplayBlocked$ false after the last element is unmarked', () => {
    const el1 = createAudioElement();
    const el2 = createAudioElement();
    tracker.markBlocked(el1, true);
    tracker.markBlocked(el2, true);
    expect(getCurrentValue(tracker.autoplayBlocked$)).toBe(true);

    tracker.markBlocked(el1, false);
    expect(getCurrentValue(tracker.autoplayBlocked$)).toBe(true);

    tracker.markBlocked(el2, false);
    expect(getCurrentValue(tracker.autoplayBlocked$)).toBe(false);
  });

  it('is idempotent: marking the same element twice keeps a single entry', () => {
    const el = createAudioElement();
    tracker.markBlocked(el, true);
    tracker.markBlocked(el, true);
    tracker.markBlocked(el, false);
    expect(getCurrentValue(tracker.autoplayBlocked$)).toBe(false);
  });

  it('emits blocked participant session ids', () => {
    const el1 = createAudioElement();
    const el2 = createAudioElement();

    tracker.markBlocked(el1, true, 'session-id-1');
    tracker.markBlocked(el2, true, 'session-id-2');

    expect(getCurrentValue(tracker.blockedSessionIds$)).toEqual([
      'session-id-1',
      'session-id-2',
    ]);

    tracker.markBlocked(el1, false);

    expect(getCurrentValue(tracker.blockedSessionIds$)).toEqual([
      'session-id-2',
    ]);
  });

  it(`doesn't emit when blocked participant session ids don't change`, () => {
    const el1 = createAudioElement();
    const el2 = createAudioElement();
    tracker.markBlocked(el1, true, 'session-id-1');

    const subscriber = vi.fn();
    const subscription = tracker.blockedSessionIds$.subscribe(subscriber);

    expect(subscriber).toHaveBeenCalledTimes(1);

    tracker.markBlocked(el1, true, 'session-id-1');
    expect(subscriber).toHaveBeenCalledTimes(1);

    tracker.markBlocked(el2, true, 'session-id-1');
    expect(subscriber).toHaveBeenCalledTimes(1);

    tracker.markBlocked(el1, false);
    expect(subscriber).toHaveBeenCalledTimes(1);

    tracker.markBlocked(el2, false);
    expect(subscriber).toHaveBeenCalledTimes(2);

    subscription.unsubscribe();
  });

  it('resumeAudio plays each element with srcObject and clears successful ones', async () => {
    const el1 = createAudioElement();
    const el2 = createAudioElement();
    const play1 = vi.spyOn(el1, 'play').mockResolvedValue();
    const play2 = vi.spyOn(el2, 'play').mockResolvedValue();

    tracker.markBlocked(el1, true, 'session-id-1');
    tracker.markBlocked(el2, true, 'session-id-2');

    await tracker.resumeAudio();

    expect(play1).toHaveBeenCalled();
    expect(play2).toHaveBeenCalled();
    expect(getCurrentValue(tracker.autoplayBlocked$)).toBe(false);
  });

  it('resumeAudio keeps elements whose play() still rejects', async () => {
    const ok = createAudioElement();
    const stillBlocked = createAudioElement();
    vi.spyOn(ok, 'play').mockResolvedValue();
    vi.spyOn(stillBlocked, 'play').mockRejectedValue(
      new DOMException('', 'NotAllowedError'),
    );

    tracker.markBlocked(ok, true, 'session-id-1');
    tracker.markBlocked(stillBlocked, true, 'session-id-2');

    await tracker.resumeAudio();

    expect(getCurrentValue(tracker.autoplayBlocked$)).toBe(true);

    // Resuming again with the now-cooperative element should clear the flag.
    vi.spyOn(stillBlocked, 'play').mockResolvedValue();
    await tracker.resumeAudio();

    expect(getCurrentValue(tracker.autoplayBlocked$)).toBe(false);
  });

  it('resumeAudio drops elements without srcObject without calling play()', async () => {
    const detached = createAudioElement(false);
    const play = vi.spyOn(detached, 'play').mockResolvedValue();

    tracker.markBlocked(detached, true, 'session-id');
    await tracker.resumeAudio();

    expect(play).not.toHaveBeenCalled();
    expect(getCurrentValue(tracker.autoplayBlocked$)).toBe(false);
  });

  it('traces resumeAudio', async () => {
    await tracker.resumeAudio();
    expect(tracer.trace).toHaveBeenCalledWith('resumeAudio', null);
  });
});
