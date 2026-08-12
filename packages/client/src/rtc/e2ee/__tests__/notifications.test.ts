import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The SPEC section 10 delivery rules, tested directly rather than through the
 * transforms: throttling needs controllable time, and the pipeline tests cannot
 * assert "and nothing more was delivered for another second" without it.
 */

const postMessage = vi.fn();
vi.stubGlobal('self', { postMessage });

const { DecodeNotifier, EncodeNotifier, notifyMissingEncodeKey } =
  await import('../e2ee-worker/notifications');

const types = () => postMessage.mock.calls.map(([m]) => m.type);

beforeEach(() => {
  vi.useFakeTimers();
  // A non-zero epoch: the throttle compares against a 0 default for an unseen
  // key, so starting at time 0 would suppress the very first notification.
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  postMessage.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EncodeNotifier', () => {
  it('latches: one signal per failure run, and time alone does not re-arm it', () => {
    // Latching is not throttling: a permanently dead track reports once, no
    // matter how long it keeps failing.
    const notify = new EncodeNotifier('alice', 'VIDEO');
    notify.failed('first');
    notify.failed('second');
    vi.advanceTimersByTime(60_000);
    notify.failed('still dead');

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({
      type: 'e2ee.encryption_failed',
      userId: 'alice',
      trackType: 'VIDEO',
      reason: 'first',
    });
  });

  it('re-arms on recovery so a later permanent failure is not hidden', () => {
    const notify = new EncodeNotifier('alice', 'VIDEO');
    notify.failed('transient');
    notify.recovered();
    notify.failed('counter exhausted');
    expect(types()).toEqual([
      'e2ee.encryption_failed',
      'e2ee.encryption_failed',
    ]);
    expect(postMessage.mock.calls[1][0].reason).toBe('counter exhausted');
  });
});

describe('DecodeNotifier throttling', () => {
  // Levels: they describe a condition that persists, so one per second is
  // enough - the next frame re-raises the same condition.
  it.each([
    ['decryption_failed', (n: DecodeNotifier) => n.failed()],
    ['unencrypted_frame', (n: DecodeNotifier) => n.unencrypted()],
  ])('delivers at most one %s per second', (type, raise) => {
    const notify = new DecodeNotifier('bob', 'VIDEO');
    raise(notify);
    raise(notify);
    raise(notify);
    expect(types()).toEqual([`e2ee.${type}`]);

    vi.advanceTimersByTime(1001);
    raise(notify);
    expect(types()).toEqual([`e2ee.${type}`, `e2ee.${type}`]);
  });

  it('throttles missing_key per keyIndex, so a rotation still reports', () => {
    const notify = new DecodeNotifier('bob', 'VIDEO');
    notify.missingKey(1);
    notify.missingKey(1);
    // A different key epoch is a different condition and must not be
    // suppressed by the first one's window.
    notify.missingKey(2);
    expect(postMessage.mock.calls.map(([m]) => m.keyIndex)).toEqual([1, 2]);
  });

  it('does not throttle decryption_stalled: it is already once per failure run', () => {
    const notify = new DecodeNotifier('bob', 'VIDEO');
    notify.stalled(0);
    notify.stalled(1);
    expect(types()).toEqual([
      'e2ee.decryption_stalled',
      'e2ee.decryption_stalled',
    ]);
  });

  it('scopes throttles per notifier, so one track cannot mute another', () => {
    const video = new DecodeNotifier('bob', 'VIDEO');
    const audio = new DecodeNotifier('bob', 'AUDIO');
    video.failed();
    audio.failed();
    expect(postMessage.mock.calls.map(([m]) => m.trackType)).toEqual([
      'VIDEO',
      'AUDIO',
    ]);
  });
});

describe('DecodeNotifier failure/recovery pairing', () => {
  it('emits exactly one recovery per delivered failure, unthrottled', () => {
    const notify = new DecodeNotifier('bob', 'VIDEO');
    notify.resumed(); // nothing was reported yet, so nothing to clear
    expect(postMessage).not.toHaveBeenCalled();

    notify.failed();
    notify.resumed(); // inside the failure's own throttle window, still fires:
    notify.resumed(); // an edge must never be delayed or dropped...
    notify.resumed(); // ...but it also does not repeat.
    expect(types()).toEqual([
      'e2ee.decryption_failed',
      'e2ee.decryption_resumed',
    ]);
  });

  it('does not emit a recovery for a failure the throttle swallowed', () => {
    const notify = new DecodeNotifier('bob', 'VIDEO');
    notify.failed(); // delivered
    notify.resumed(); // pairs with it
    postMessage.mockClear();
    notify.failed(); // suppressed: still inside the window
    notify.resumed(); // the host never heard the failure, so nothing to clear
    expect(postMessage).not.toHaveBeenCalled();
  });
});

describe('notifyMissingEncodeKey', () => {
  it('throttles per user and carries no trackType', () => {
    // The local encoder holding no key stalls every outgoing track at once, so
    // this is reported once for the user rather than per track.
    notifyMissingEncodeKey('alice');
    notifyMissingEncodeKey('alice');
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({
      type: 'e2ee.missing_key',
      userId: 'alice',
    });

    notifyMissingEncodeKey('carol');
    expect(postMessage).toHaveBeenCalledTimes(2);
  });
});
