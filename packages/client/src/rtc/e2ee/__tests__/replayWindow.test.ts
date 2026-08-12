import { describe, expect, it } from 'vitest';
import { COUNTER_HARD_LIMIT, REPLAY_WINDOW } from '../e2ee-worker/constants';
import { ReplayWindow } from '../e2ee-worker/replayWindow';

describe('ReplayWindow', () => {
  const PREFIX_A = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const PREFIX_B = new Uint8Array([9, 9, 9, 9, 9, 9, 9, 9]);
  const PREFIX_C = new Uint8Array([3, 3, 3, 3, 3, 3, 3, 3]);
  const PREFIX_D = new Uint8Array([4, 4, 4, 4, 4, 4, 4, 4]);

  // Mirrors the real decode flow: a frame is only recorded (commit) once it
  // would have authenticated. Returns whether the window admitted it.
  const accept = (w: ReplayWindow, counter: number, prefix: Uint8Array) => {
    const ok = w.peek(counter, prefix);
    if (ok) w.commit(counter, prefix);
    return ok;
  };

  it('accepts monotonically increasing counters', () => {
    const w = new ReplayWindow();
    expect(accept(w, 1, PREFIX_A)).toBe(true);
    expect(accept(w, 2, PREFIX_A)).toBe(true);
    expect(accept(w, 3, PREFIX_A)).toBe(true);
  });

  it('rejects an exact replay', () => {
    const w = new ReplayWindow();
    expect(accept(w, 5, PREFIX_A)).toBe(true);
    expect(accept(w, 5, PREFIX_A)).toBe(false);
  });

  it('accepts out-of-order frames within the window', () => {
    const w = new ReplayWindow();
    expect(accept(w, 10, PREFIX_A)).toBe(true);
    expect(accept(w, 8, PREFIX_A)).toBe(true); // late arrival
    expect(accept(w, 8, PREFIX_A)).toBe(false); // replay of late arrival
  });

  it('rejects frames older than the replay window', () => {
    const w = new ReplayWindow();
    const high = REPLAY_WINDOW + 50;
    expect(accept(w, high, PREFIX_A)).toBe(true);
    expect(accept(w, 1, PREFIX_A)).toBe(false);
    expect(accept(w, high - REPLAY_WINDOW, PREFIX_A)).toBe(false);
  });

  it('isolates state per track (the M1 fix)', () => {
    // Each decode transform owns its own guard, so one track racing far
    // ahead in counter terms can never evict a slower track's frames — the
    // failure mode of the old shared (userId, keyIndex) window.
    const audio = new ReplayWindow();
    const video = new ReplayWindow();
    expect(accept(audio, REPLAY_WINDOW * 4, PREFIX_A)).toBe(true);
    expect(accept(video, 5, PREFIX_A)).toBe(true);
    expect(accept(video, 6, PREFIX_A)).toBe(true);
  });

  it('partitions the window by sender prefix, so a restart is not rejected', () => {
    // A sender restart or key re-import brings a fresh prefix and a counter
    // near 0. Those low counters must not be judged against the old prefix's
    // high-water mark, while replays within each prefix are still caught.
    const w = new ReplayWindow();
    expect(accept(w, 5000, PREFIX_A)).toBe(true);
    expect(accept(w, 1, PREFIX_B)).toBe(true);
    expect(accept(w, 2, PREFIX_B)).toBe(true);
    expect(accept(w, 5000, PREFIX_A)).toBe(false); // replay within prefix A
    expect(accept(w, 1, PREFIX_B)).toBe(false); // replay within prefix B
  });

  // --- authenticate-before-commit -----------------------------------------

  it('peek is read-only — a forged high counter cannot wedge the track', () => {
    const w = new ReplayWindow();
    // A genuine frame establishes the window.
    expect(accept(w, 10, PREFIX_A)).toBe(true);
    // Forged frames copy the prefix and claim far-future counters. They peek
    // OK (nothing seen is newer), but GCM rejects them, so they are never
    // committed and `highest` must not move: otherwise every later genuine
    // frame lands below `highest - REPLAY_WINDOW` and is dropped forever.
    expect(w.peek(COUNTER_HARD_LIMIT, PREFIX_A)).toBe(true);
    expect(w.peek(900_000, PREFIX_A)).toBe(true);
    expect(w.peek(900_000, PREFIX_A)).toBe(true);
    expect(accept(w, 11, PREFIX_A)).toBe(true);
    expect(accept(w, 12, PREFIX_A)).toBe(true);
    // The uncommitted peeks also left no epoch behind, so a genuine low
    // counter is still new rather than a replay.
    expect(accept(w, 1, PREFIX_A)).toBe(true);
    expect(accept(w, 1, PREFIX_A)).toBe(false);
  });

  it('clears the slots an advance skipped, so a reused slot is not a false replay', () => {
    // Bitmap slots repeat every REPLAY_WINDOW counters, so counter 5 and
    // counter 5 + REPLAY_WINDOW share one bit. When the mark advances past
    // counters that never arrived, their slots must be cleared, or a later
    // genuine frame landing on one is rejected as a replay of the old counter.
    const w = new ReplayWindow();
    const reused = 5 + REPLAY_WINDOW; // same bitmap slot as counter 5
    expect(accept(w, 5, PREFIX_A)).toBe(true);
    // Advance in steps smaller than the window, so the skipped slots are
    // cleared one by one rather than by wiping the whole bitmap.
    expect(accept(w, REPLAY_WINDOW - 24, PREFIX_A)).toBe(true);
    expect(accept(w, REPLAY_WINDOW + 76, PREFIX_A)).toBe(true);
    // `reused` is a new counter, still inside the window, and its slot was
    // last set by counter 5. It must be accepted.
    expect(accept(w, reused, PREFIX_A)).toBe(true);
    expect(accept(w, reused, PREFIX_A)).toBe(false); // now a genuine replay
  });

  it('handles a counter jump larger than the replay window', () => {
    // Exercises the window-advance path where the whole bitmap is stale and
    // must be cleared at once.
    const w = new ReplayWindow();
    expect(accept(w, 1, PREFIX_A)).toBe(true);
    const far = 1 + REPLAY_WINDOW * 3;
    expect(accept(w, far, PREFIX_A)).toBe(true); // jump well beyond the window
    expect(accept(w, far, PREFIX_A)).toBe(false); // replay of the far frame
    expect(accept(w, 2, PREFIX_A)).toBe(false); // now far older than the window
  });

  it('an uncommitted novel-prefix peek cannot evict a committed epoch', () => {
    const w = new ReplayWindow();
    // Authentic frame on prefix A is committed.
    expect(accept(w, 5, PREFIX_A)).toBe(true);
    // Attacker injects frames with distinct novel prefixes (> REPLAY_EPOCHS
    // worth). They fail GCM, so they are peeked but never committed — no epoch
    // is created, nothing is evicted.
    for (const p of [PREFIX_B, PREFIX_C, PREFIX_D]) {
      expect(w.peek(1, p)).toBe(true); // a novel prefix always peeks OK
    }
    // Prefix A's epoch survived, so replaying the authentic frame is caught.
    expect(w.peek(5, PREFIX_A)).toBe(false);
  });
});
