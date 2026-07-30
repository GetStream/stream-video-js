import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  COUNTER_HARD_LIMIT,
  FAILURE_TOLERANCE,
  IV_PREFIX_LEN,
  REPLAY_WINDOW,
} from '../e2ee-worker/constants';

// crypto.ts posts error messages via `self.postMessage` on importKey failure.
// Stub it so tests run in the default Node environment.
const postMessage = vi.fn();
vi.stubGlobal('self', { postMessage });

// Import lazily so the stub is in place before the module-level state is
// captured (not strictly necessary since postMessage is only used inside
// catch blocks, but it's clearer this way).
import {
  __setFrameCounterForTest,
  FailureTracker,
  ReplayWindow,
  dispose,
  dumpKeyState,
  getKey,
  getLatestKey,
  importKey,
  importSharedKey,
  nextFrameCounter,
  removeKeys,
  removeSharedKey,
} from '../e2ee-worker/crypto';

const rawKey = (seed = 0xab): ArrayBuffer => {
  const buf = new ArrayBuffer(16);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < 16; i++) bytes[i] = (seed + i) & 0xff;
  return buf;
};

beforeEach(() => {
  dispose();
  postMessage.mockClear();
});

describe('importKey', () => {
  it('stores the key and generates a random 8-byte IV prefix', async () => {
    await importKey('alice', 1, rawKey());
    expect(getKey('alice', 1)).toBeDefined();

    const prefix = getLatestKey('alice')?.ivPrefix;
    expect(prefix).toBeDefined();
    expect(prefix!.length).toBe(IV_PREFIX_LEN);
  });

  it('generates a fresh prefix on each import (even for the same raw key)', async () => {
    await importKey('alice', 1, rawKey(0x01));
    const p1 = Array.from(getLatestKey('alice')!.ivPrefix);

    await importKey('alice', 1, rawKey(0x01));
    const p2 = Array.from(getLatestKey('alice')!.ivPrefix);

    // 64 bits of randomness — practically impossible for two draws to collide.
    expect(p2).not.toEqual(p1);
  });

  it('getLatestKey returns the most recently imported key', async () => {
    await importKey('alice', 1, rawKey(0x01));
    await importKey('alice', 5, rawKey(0x02));
    const latest = getLatestKey('alice');
    expect(latest!.keyIndex).toBe(5);
  });

  it('falls back to the shared key when no per-user key is registered', async () => {
    await importSharedKey(3, rawKey(0x55));
    const latest = getLatestKey('bob');
    expect(latest!.keyIndex).toBe(3);
  });

  it('accepts 32-byte raw material (AES-256-GCM)', async () => {
    const rawKey32 = new ArrayBuffer(32);
    new Uint8Array(rawKey32).fill(0x42);
    await importKey('alice', 1, rawKey32);
    expect(getKey('alice', 1)).toBeDefined();
  });
});

describe('nextFrameCounter', () => {
  it('increments monotonically per user', () => {
    expect(nextFrameCounter('alice')).toBe(1);
    expect(nextFrameCounter('alice')).toBe(2);
    expect(nextFrameCounter('bob')).toBe(1);
    expect(nextFrameCounter('alice')).toBe(3);
  });

  it('survives removeKeys — counter is never rolled back', async () => {
    await importKey('alice', 1, rawKey());
    expect(nextFrameCounter('alice')).toBe(1);
    expect(nextFrameCounter('alice')).toBe(2);

    removeKeys('alice');

    // Re-import the same raw key. Counter must NOT restart — otherwise
    // we'd reuse IVs on the new import's first frames.
    await importKey('alice', 1, rawKey());
    expect(nextFrameCounter('alice')).toBe(3);
  });

  it('throws at the 32-bit hard limit and stays exhausted', () => {
    __setFrameCounterForTest('alice', COUNTER_HARD_LIMIT);
    expect(() => nextFrameCounter('alice')).toThrow(/counter exhausted/);
    // Every later frame must fail identically rather than wrapping into a
    // counter that was already used with this ivPrefix.
    expect(() => nextFrameCounter('alice')).toThrow(/counter exhausted/);
    expect(() => nextFrameCounter('alice')).toThrow(/counter exhausted/);
  });

  it('a rekey does not recover an exhausted counter', async () => {
    __setFrameCounterForTest('alice', COUNTER_HARD_LIMIT);
    expect(() => nextFrameCounter('alice')).toThrow();

    // Importing fresh key material is the remedy an integrator would reach
    // for first. It gives a new ivPrefix, but the counter is scoped to the
    // worker rather than to the key, so encryption stays dead.
    await importKey('alice', 7, rawKey());
    expect(() => nextFrameCounter('alice')).toThrow(/counter exhausted/);

    // Same after dropping the user's keys entirely.
    removeKeys('alice');
    await importKey('alice', 8, rawKey());
    expect(() => nextFrameCounter('alice')).toThrow(/counter exhausted/);
  });

  it('never posts a rotation warning ahead of the hard limit', () => {
    // The 2^31 soft threshold and its `e2ee.rotation_needed` event were
    // removed: rotating cannot buy back counter budget, so the signal named a
    // remedy that does nothing. Only the fail-closed ceiling remains.
    __setFrameCounterForTest('alice', 0x80000000 - 1);
    nextFrameCounter('alice');
    nextFrameCounter('alice');
    expect(
      postMessage.mock.calls.filter(([msg]) =>
        String(msg?.type).startsWith('e2ee.'),
      ),
    ).toHaveLength(0);
  });
});

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

describe('FailureTracker', () => {
  it('flags the break only on the failure that crosses tolerance', () => {
    const tracker = new FailureTracker();
    // The first FAILURE_TOLERANCE failures stay under the bar.
    for (let i = 0; i < FAILURE_TOLERANCE; i++) {
      expect(tracker.recordFailure(1)).toBe(false);
    }
    // The next one crosses it - the break transition fires exactly once.
    expect(tracker.recordFailure(1)).toBe(true);
    expect(tracker.recordFailure(1)).toBe(false); // already broken, no re-fire
  });

  it('recordSuccess clears the count and reports whether there were failures', () => {
    const tracker = new FailureTracker();
    expect(tracker.recordSuccess(1)).toBe(false); // nothing to resume
    tracker.recordFailure(1);
    expect(tracker.recordSuccess(1)).toBe(true); // had a failure -> recovered
    expect(tracker.recordSuccess(1)).toBe(false); // already clear
    // After a reset the tolerance bar can be crossed (and reported) again.
    for (let i = 0; i < FAILURE_TOLERANCE; i++) tracker.recordFailure(1);
    expect(tracker.recordFailure(1)).toBe(true);
  });

  it('counts each keyIndex independently within a track', () => {
    const tracker = new FailureTracker();
    for (let i = 0; i <= FAILURE_TOLERANCE; i++) tracker.recordFailure(1);
    // keyIndex 2 starts fresh: a key rotation does not inherit index 1's count.
    expect(tracker.recordFailure(2)).toBe(false);
  });

  it('scopes failures per tracker so one track cannot reset another', () => {
    const video = new FailureTracker();
    const audio = new FailureTracker();
    for (let i = 0; i <= FAILURE_TOLERANCE; i++) video.recordFailure(1);
    // The audio track shares neither the count nor the recovery edge.
    expect(audio.recordFailure(1)).toBe(false);
    expect(audio.recordSuccess(1)).toBe(true); // only its own single failure
    // ...and video's break state is untouched by audio's activity.
    expect(video.recordSuccess(1)).toBe(true);
  });
});

describe('dumpKeyState', () => {
  it('returns fingerprints (not raw key material)', async () => {
    await importKey('alice', 1, rawKey(0x01));
    await importSharedKey(0, rawKey(0x02));

    const dump = dumpKeyState();
    expect(dump.perUserKeys).toHaveLength(1);
    expect(dump.perUserKeys[0]).toMatchObject({
      userId: 'alice',
      keyIndex: 1,
    });
    // Fingerprint is 8 bytes = 16 hex chars.
    expect(dump.perUserKeys[0].fingerprint).toMatch(/^[0-9a-f]{16}$/);
    expect(dump.sharedKeys[0].fingerprint).toMatch(/^[0-9a-f]{16}$/);
    expect(dump.sharedKeys).toEqual([
      {
        keyIndex: 0,
        fingerprint: dump.sharedKeys[0].fingerprint,
        isActive: true,
      },
    ]);
  });

  it('identifies key material: same key same print, different key different', async () => {
    // What makes the dump useful: two peers can compare prints to confirm they
    // hold the same key, under any user id or key index.
    await importKey('alice', 1, rawKey(0xaa));
    const alice = dumpKeyState().perUserKeys[0].fingerprint;

    dispose();
    await importKey('bob', 99, rawKey(0xaa));
    await importKey('bob', 100, rawKey(0x02));
    const [same, different] = dumpKeyState().perUserKeys;

    expect(same.fingerprint).toBe(alice);
    expect(different.fingerprint).not.toBe(alice);
  });
});

describe('shared-key rotation', () => {
  it('retains old epochs for decryption and encrypts with the newest', async () => {
    await importSharedKey(1, rawKey(0x11));
    const oldKey = getKey('alice', 1);

    await importSharedKey(2, rawKey(0x22));

    expect(getKey('alice', 1)).toBe(oldKey);
    expect(getKey('alice', 2)).toBeDefined();
    expect(getLatestKey('alice')?.keyIndex).toBe(2);
  });

  it('keeps the active epoch when importing its replacement fails', async () => {
    await importSharedKey(1, rawKey(0x11));
    const active = getLatestKey('alice');

    await importSharedKey(2, new ArrayBuffer(7));

    const stillActive = getLatestKey('alice');
    expect(stillActive?.keyIndex).toBe(1);
    expect(stillActive?.key).toBe(active?.key);
    expect(stillActive?.ivPrefix).toEqual(active?.ivPrefix);
    expect(getKey('alice', 2)).toBeUndefined();
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'e2ee.error',
        message: expect.stringContaining('Failed to import shared key'),
      }),
    );
  });

  it('removes only the requested inactive epoch', async () => {
    await importSharedKey(1, rawKey(0x11));
    await importSharedKey(2, rawKey(0x22));

    removeSharedKey(1);

    expect(getKey('alice', 1)).toBeUndefined();
    expect(getKey('alice', 2)).toBeDefined();
    expect(getLatestKey('alice')?.keyIndex).toBe(2);
  });

  it('does not reactivate an old epoch when the active one is removed', async () => {
    await importSharedKey(1, rawKey(0x11));
    await importSharedKey(2, rawKey(0x22));

    removeSharedKey(2);

    // Epoch 1 remains available to decrypt delayed frames, but silently
    // resuming encryption with it would undo the caller's rotation policy.
    expect(getKey('alice', 1)).toBeDefined();
    expect(getKey('alice', 2)).toBeUndefined();
    expect(getLatestKey('alice')).toBeNull();
    expect(dumpKeyState()).toMatchObject({
      sharedKeys: [{ keyIndex: 1, isActive: false }],
    });
  });
});

describe('removeKeys', () => {
  it('deletes that user key state and leaves the others', async () => {
    await importKey('alice', 1, rawKey(0x01));
    await importKey('bob', 1, rawKey(0x02));

    removeKeys('alice');

    expect(getKey('alice', 1)).toBeUndefined();
    expect(getLatestKey('alice')).toBeNull();
    expect(getKey('bob', 1)).toBeDefined();
  });
});
