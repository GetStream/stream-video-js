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
  it('latches: one signal per failure run, not one per frame', () => {
    const notify = new EncodeNotifier('alice', 'VIDEO');
    notify.failed('first');
    notify.failed('second');
    notify.failed('third');
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

  it('is not time-based: the latch holds past the throttle window', () => {
    // Latching and throttling are different mechanisms. Only a successful
    // frame re-arms this one, so waiting must not resurrect the signal.
    const notify = new EncodeNotifier('alice', 'VIDEO');
    notify.failed('dead');
    vi.advanceTimersByTime(60_000);
    notify.failed('still dead');
    expect(postMessage).toHaveBeenCalledTimes(1);
  });
});

describe('DecodeNotifier throttling', () => {
  it('delivers at most one failure per second, then resumes delivering', () => {
    const notify = new DecodeNotifier('bob', 'VIDEO');
    notify.failed();
    notify.failed();
    notify.failed();
    expect(types()).toEqual(['e2ee.decryption_failed']);

    vi.advanceTimersByTime(1001);
    notify.failed();
    expect(types()).toEqual([
      'e2ee.decryption_failed',
      'e2ee.decryption_failed',
    ]);
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

  it('throttles unencrypted_frame', () => {
    const notify = new DecodeNotifier('bob', 'VIDEO');
    notify.unencrypted();
    notify.unencrypted();
    expect(types()).toEqual(['e2ee.unencrypted_frame']);
    vi.advanceTimersByTime(1001);
    notify.unencrypted();
    expect(types()).toHaveLength(2);
  });

  it('does not throttle broken: it is already once per failure run', () => {
    const notify = new DecodeNotifier('bob', 'VIDEO');
    notify.broken(0);
    notify.broken(1);
    expect(types()).toEqual(['e2ee.broken', 'e2ee.broken']);
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
  it('stays silent on recovery when no failure was delivered', () => {
    const notify = new DecodeNotifier('bob', 'VIDEO');
    notify.resumed();
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('emits recovery unthrottled, immediately after a delivered failure', () => {
    const notify = new DecodeNotifier('bob', 'VIDEO');
    notify.failed();
    notify.resumed();
    // Same throttle window as the failure: an edge must not be delayed or
    // dropped, or the host stays latched on a track that already recovered.
    expect(types()).toEqual([
      'e2ee.decryption_failed',
      'e2ee.decryption_resumed',
    ]);
  });

  it('emits one recovery per delivered failure, never more', () => {
    const notify = new DecodeNotifier('bob', 'VIDEO');
    notify.failed();
    notify.resumed();
    notify.resumed();
    notify.resumed();
    expect(types().filter((t) => t === 'e2ee.decryption_resumed')).toHaveLength(
      1,
    );
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
