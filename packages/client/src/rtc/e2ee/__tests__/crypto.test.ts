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
  checkReplayWindow,
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

describe('checkReplayWindow', () => {
  it('accepts the first frame for a (user, keyIndex)', () => {
    expect(checkReplayWindow('alice', 1, 100)).toBe(true);
  });

  it('accepts monotonically increasing counters', () => {
    expect(checkReplayWindow('alice', 1, 1)).toBe(true);
    expect(checkReplayWindow('alice', 1, 2)).toBe(true);
    expect(checkReplayWindow('alice', 1, 3)).toBe(true);
  });

  it('rejects an exact replay', () => {
    expect(checkReplayWindow('alice', 1, 5)).toBe(true);
    expect(checkReplayWindow('alice', 1, 5)).toBe(false);
  });

  it('accepts out-of-order frames within the window', () => {
    expect(checkReplayWindow('alice', 1, 10)).toBe(true);
    expect(checkReplayWindow('alice', 1, 8)).toBe(true); // late arrival
    expect(checkReplayWindow('alice', 1, 8)).toBe(false); // replay of late arrival
  });

  it('rejects frames older than the replay window', () => {
    const high = REPLAY_WINDOW + 50;
    expect(checkReplayWindow('alice', 1, high)).toBe(true);
    expect(checkReplayWindow('alice', 1, 1)).toBe(false);
    expect(checkReplayWindow('alice', 1, high - REPLAY_WINDOW)).toBe(false);
  });

  it('isolates state per (user, keyIndex)', () => {
    expect(checkReplayWindow('alice', 1, 5)).toBe(true);
    expect(checkReplayWindow('alice', 2, 5)).toBe(true);
    expect(checkReplayWindow('bob', 1, 5)).toBe(true);
  });

  it('resets when the key at that index is re-imported', async () => {
    await importKey('alice', 1, rawKey(0x01));
    expect(checkReplayWindow('alice', 1, 100)).toBe(true);
    expect(checkReplayWindow('alice', 1, 100)).toBe(false); // replay

    // Fresh key instance at the same keyIndex must reset the window:
    // the new prefix gives fresh IVs, old counters are meaningless.
    await importKey('alice', 1, rawKey(0x02));
    expect(checkReplayWindow('alice', 1, 100)).toBe(true);
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
