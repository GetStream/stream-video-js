import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  COUNTER_HARD_LIMIT,
  COUNTER_REKEY_THRESHOLD,
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
  createReplayWindow,
  dispose,
  dumpKeyState,
  getKey,
  getLatestKey,
  getSenderIvPrefix,
  importKey,
  importSharedKey,
  nextFrameCounter,
  recordDecryptionFailure,
  isKeyInvalid,
  removeKeys,
  type ReplayWindow,
  resetDecryptionFailures,
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

    const prefix = getSenderIvPrefix('alice', 1);
    expect(prefix).not.toBeNull();
    expect(prefix!.length).toBe(IV_PREFIX_LEN);
  });

  it('generates a fresh prefix on each import (even for the same raw key)', async () => {
    await importKey('alice', 1, rawKey(0x01));
    const p1 = Array.from(getSenderIvPrefix('alice', 1)!);

    await importKey('alice', 1, rawKey(0x01));
    const p2 = Array.from(getSenderIvPrefix('alice', 1)!);

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

  it('posts rekeyRequested exactly once when the threshold is crossed', () => {
    __setFrameCounterForTest('alice', COUNTER_REKEY_THRESHOLD - 1);
    expect(nextFrameCounter('alice')).toBe(COUNTER_REKEY_THRESHOLD);

    const rekeyCalls = postMessage.mock.calls.filter(
      ([msg]) => msg?.type === 'e2ee.rotation_needed',
    );
    expect(rekeyCalls).toHaveLength(1);
    expect(rekeyCalls[0][0]).toEqual({
      type: 'e2ee.rotation_needed',
      userId: 'alice',
    });

    // Subsequent frames past the threshold must NOT re-post — one message
    // per session is enough; the host already knows.
    nextFrameCounter('alice');
    nextFrameCounter('alice');
    const rekeyCallsAfter = postMessage.mock.calls.filter(
      ([msg]) => msg?.type === 'e2ee.rotation_needed',
    );
    expect(rekeyCallsAfter).toHaveLength(1);
  });

  it('throws and fails closed at the 32-bit hard limit', () => {
    __setFrameCounterForTest('alice', COUNTER_HARD_LIMIT);
    expect(() => nextFrameCounter('alice')).toThrow(/counter exhausted/);
  });

  it('removeKeys resets the one-shot rekey flag for that user', () => {
    __setFrameCounterForTest('alice', COUNTER_REKEY_THRESHOLD - 1);
    nextFrameCounter('alice'); // fires once
    removeKeys('alice');

    // After removeKeys + fresh import, crossing the threshold again should
    // still be able to fire — the flag was cleared with the rest of
    // alice's state.
    __setFrameCounterForTest('alice', COUNTER_REKEY_THRESHOLD - 1);
    nextFrameCounter('alice');
    const rekeyCalls = postMessage.mock.calls.filter(
      ([msg]) => msg?.type === 'e2ee.rotation_needed',
    );
    expect(rekeyCalls).toHaveLength(2);
  });
});

describe('importKey algorithm variants', () => {
  it('accepts 32-byte raw material (AES-256-GCM)', async () => {
    const rawKey32 = new ArrayBuffer(32);
    new Uint8Array(rawKey32).fill(0x42);
    await importKey('alice', 1, rawKey32);
    expect(getKey('alice', 1)).toBeDefined();
  });
});

describe('createReplayWindow', () => {
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

  it('accepts the first frame', () => {
    const w = createReplayWindow();
    expect(accept(w, 100, PREFIX_A)).toBe(true);
  });

  it('accepts monotonically increasing counters', () => {
    const w = createReplayWindow();
    expect(accept(w, 1, PREFIX_A)).toBe(true);
    expect(accept(w, 2, PREFIX_A)).toBe(true);
    expect(accept(w, 3, PREFIX_A)).toBe(true);
  });

  it('rejects an exact replay', () => {
    const w = createReplayWindow();
    expect(accept(w, 5, PREFIX_A)).toBe(true);
    expect(accept(w, 5, PREFIX_A)).toBe(false);
  });

  it('accepts out-of-order frames within the window', () => {
    const w = createReplayWindow();
    expect(accept(w, 10, PREFIX_A)).toBe(true);
    expect(accept(w, 8, PREFIX_A)).toBe(true); // late arrival
    expect(accept(w, 8, PREFIX_A)).toBe(false); // replay of late arrival
  });

  it('rejects frames older than the replay window', () => {
    const w = createReplayWindow();
    const high = REPLAY_WINDOW + 50;
    expect(accept(w, high, PREFIX_A)).toBe(true);
    expect(accept(w, 1, PREFIX_A)).toBe(false);
    expect(accept(w, high - REPLAY_WINDOW, PREFIX_A)).toBe(false);
  });

  it('isolates state per track (the M1 fix)', () => {
    // Each decode transform owns its own guard, so one track racing far
    // ahead in counter terms can never evict a slower track's frames — the
    // failure mode of the old shared (userId, keyIndex) window.
    const audio = createReplayWindow();
    const video = createReplayWindow();
    expect(accept(audio, REPLAY_WINDOW * 4, PREFIX_A)).toBe(true);
    expect(accept(video, 5, PREFIX_A)).toBe(true);
    expect(accept(video, 6, PREFIX_A)).toBe(true);
  });

  it('opens a fresh window when the sender IV prefix changes', () => {
    // Sender restart: a new random prefix with the counter reset to 0. The
    // low counter must not be rejected against the previous prefix's
    // `highest`, but replays within the original prefix are still caught.
    const w = createReplayWindow();
    expect(accept(w, 5000, PREFIX_A)).toBe(true);
    expect(accept(w, 1, PREFIX_B)).toBe(true);
    expect(accept(w, 2, PREFIX_B)).toBe(true);
    expect(accept(w, 5000, PREFIX_A)).toBe(false);
  });

  it('partitions replay state by prefix within a single guard', () => {
    const w = createReplayWindow();
    expect(accept(w, 5, PREFIX_A)).toBe(true);
    expect(accept(w, 5, PREFIX_B)).toBe(true); // different epoch, not a replay
    expect(accept(w, 5, PREFIX_A)).toBe(false); // replay within prefix A
    expect(accept(w, 5, PREFIX_B)).toBe(false); // replay within prefix B
  });

  // --- authenticate-before-commit (review findings 1-2) -------------------

  it('peek is read-only — a forged high counter cannot wedge the track (finding 1)', () => {
    const w = createReplayWindow();
    // A genuine frame establishes the window.
    expect(accept(w, 10, PREFIX_A)).toBe(true);
    // A forged frame copies the prefix and claims the 32-bit max counter. It
    // peeks OK (it looks newer than anything seen), but GCM will reject it, so
    // it is NEVER committed.
    expect(w.peek(COUNTER_HARD_LIMIT, PREFIX_A)).toBe(true);
    // Because the forged frame was not committed, `highest` did not advance:
    // genuine frames keep flowing instead of all landing below
    // `highest - REPLAY_WINDOW` and being dropped forever.
    expect(accept(w, 11, PREFIX_A)).toBe(true);
    expect(accept(w, 12, PREFIX_A)).toBe(true);
  });

  it('an uncommitted peek never advances the window or creates an epoch', () => {
    const w = createReplayWindow();
    // Repeatedly peeking far-future counters (forged, never authenticated)
    // must leave the window untouched, so a genuine low counter is still new.
    expect(w.peek(900_000, PREFIX_A)).toBe(true);
    expect(w.peek(900_000, PREFIX_A)).toBe(true);
    expect(accept(w, 1, PREFIX_A)).toBe(true);
    expect(accept(w, 1, PREFIX_A)).toBe(false); // now it is a real replay
  });

  it('an uncommitted novel-prefix peek cannot evict a committed epoch (finding 2)', () => {
    const w = createReplayWindow();
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

describe('decryption failure accounting', () => {
  it('records consecutive failures and marks the key invalid past tolerance', () => {
    for (let i = 0; i < 12; i++) recordDecryptionFailure('alice', 1);
    expect(isKeyInvalid('alice', 1)).toBe(true);
  });

  it('reset clears the failure count', () => {
    for (let i = 0; i < 12; i++) recordDecryptionFailure('alice', 1);
    resetDecryptionFailures('alice', 1);
    expect(isKeyInvalid('alice', 1)).toBe(false);
  });

  it('handles userIds that contain colons (no key collision)', () => {
    // Historical bug: composite "userId:keyIndex" string keys confused
    // userIds containing a literal colon. Nested Maps fix this.
    recordDecryptionFailure('user:1', 2);
    recordDecryptionFailure('user', 1);
    // "user:1" with key 2 and "user" with key 1 should be isolated.
    resetDecryptionFailures('user', 1);
    // "user:1"'s failure count must still be recorded.
    for (let i = 0; i < 12; i++) recordDecryptionFailure('user:1', 2);
    expect(isKeyInvalid('user:1', 2)).toBe(true);
    expect(isKeyInvalid('user', 1)).toBe(false);
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
    expect(dump.sharedKey!.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });

  it('fingerprint is deterministic for the same raw key', async () => {
    await importKey('alice', 1, rawKey(0xaa));
    const fp1 = dumpKeyState().perUserKeys[0].fingerprint;

    dispose();
    await importKey('bob', 99, rawKey(0xaa));
    const fp2 = dumpKeyState().perUserKeys[0].fingerprint;

    expect(fp1).toBe(fp2);
  });

  it('different raw keys produce different fingerprints', async () => {
    await importKey('alice', 1, rawKey(0x01));
    await importKey('alice', 2, rawKey(0x02));
    const [a, b] = dumpKeyState().perUserKeys;
    expect(a.fingerprint).not.toBe(b.fingerprint);
  });
});

describe('removeKeys', () => {
  it('deletes per-user key state', async () => {
    await importKey('alice', 1, rawKey());
    removeKeys('alice');
    expect(getKey('alice', 1)).toBeUndefined();
    expect(getSenderIvPrefix('alice', 1)).toBeNull();
  });

  it('does not affect other users', async () => {
    await importKey('alice', 1, rawKey(0x01));
    await importKey('bob', 1, rawKey(0x02));
    removeKeys('alice');
    expect(getKey('bob', 1)).toBeDefined();
  });
});
