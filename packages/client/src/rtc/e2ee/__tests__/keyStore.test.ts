import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IV_PREFIX_LEN } from '../e2ee-worker/constants';

// A failed import is reported through notifications.ts, which posts to the
// host. Stub it so tests run in the default Node environment.
const postMessage = vi.fn();
vi.stubGlobal('self', { postMessage });

import { keyStore } from '../e2ee-worker/keyStore';

const rawKey = (seed = 0xab): ArrayBuffer => {
  const buf = new ArrayBuffer(16);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < 16; i++) bytes[i] = (seed + i) & 0xff;
  return buf;
};

beforeEach(() => {
  keyStore.clear();
  postMessage.mockClear();
});

describe('importKey', () => {
  it('stores the key and generates a random 8-byte IV prefix', async () => {
    await keyStore.importKey('alice', 1, rawKey());
    expect(keyStore.getKey('alice', 1)).toBeDefined();

    const prefix = keyStore.getLatestKey('alice')?.ivPrefix;
    expect(prefix).toBeDefined();
    expect(prefix!.length).toBe(IV_PREFIX_LEN);
  });

  it('generates a fresh prefix on each import (even for the same raw key)', async () => {
    await keyStore.importKey('alice', 1, rawKey(0x01));
    const p1 = Array.from(keyStore.getLatestKey('alice')!.ivPrefix);

    await keyStore.importKey('alice', 1, rawKey(0x01));
    const p2 = Array.from(keyStore.getLatestKey('alice')!.ivPrefix);

    // 64 bits of randomness — practically impossible for two draws to collide.
    expect(p2).not.toEqual(p1);
  });

  it('getLatestKey returns the most recently imported key', async () => {
    await keyStore.importKey('alice', 1, rawKey(0x01));
    await keyStore.importKey('alice', 5, rawKey(0x02));
    const latest = keyStore.getLatestKey('alice');
    expect(latest!.keyIndex).toBe(5);
  });

  it('falls back to the shared key when no per-user key is registered', async () => {
    await keyStore.importSharedKey(3, rawKey(0x55));
    const latest = keyStore.getLatestKey('bob');
    expect(latest!.keyIndex).toBe(3);
  });

  it('accepts 32-byte raw material (AES-256-GCM)', async () => {
    const rawKey32 = new ArrayBuffer(32);
    new Uint8Array(rawKey32).fill(0x42);
    await keyStore.importKey('alice', 1, rawKey32);
    expect(keyStore.getKey('alice', 1)).toBeDefined();
  });
});

describe('dumpKeyState', () => {
  it('returns fingerprints (not raw key material)', async () => {
    await keyStore.importKey('alice', 1, rawKey(0x01));
    await keyStore.importSharedKey(0, rawKey(0x02));

    const dump = keyStore.keyState();
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
    await keyStore.importKey('alice', 1, rawKey(0xaa));
    const alice = keyStore.keyState().perUserKeys[0].fingerprint;

    keyStore.clear();
    await keyStore.importKey('bob', 99, rawKey(0xaa));
    await keyStore.importKey('bob', 100, rawKey(0x02));
    const [same, different] = keyStore.keyState().perUserKeys;

    expect(same.fingerprint).toBe(alice);
    expect(different.fingerprint).not.toBe(alice);
  });
});

describe('shared-key rotation', () => {
  it('retains old epochs for decryption and encrypts with the newest', async () => {
    await keyStore.importSharedKey(1, rawKey(0x11));
    const oldKey = keyStore.getKey('alice', 1);

    await keyStore.importSharedKey(2, rawKey(0x22));

    expect(keyStore.getKey('alice', 1)).toBe(oldKey);
    expect(keyStore.getKey('alice', 2)).toBeDefined();
    expect(keyStore.getLatestKey('alice')?.keyIndex).toBe(2);
  });

  it('keeps the active epoch when importing its replacement fails', async () => {
    await keyStore.importSharedKey(1, rawKey(0x11));
    const active = keyStore.getLatestKey('alice');

    await keyStore.importSharedKey(2, new ArrayBuffer(7));

    const stillActive = keyStore.getLatestKey('alice');
    expect(stillActive?.keyIndex).toBe(1);
    expect(stillActive?.key).toBe(active?.key);
    expect(stillActive?.ivPrefix).toEqual(active?.ivPrefix);
    expect(keyStore.getKey('alice', 2)).toBeUndefined();
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'e2ee.error',
        message: expect.stringContaining('Failed to import shared key'),
      }),
    );
  });

  it('removes only the requested inactive epoch', async () => {
    await keyStore.importSharedKey(1, rawKey(0x11));
    await keyStore.importSharedKey(2, rawKey(0x22));

    keyStore.removeSharedKey(1);

    expect(keyStore.getKey('alice', 1)).toBeUndefined();
    expect(keyStore.getKey('alice', 2)).toBeDefined();
    expect(keyStore.getLatestKey('alice')?.keyIndex).toBe(2);
  });

  it('does not reactivate an old epoch when the active one is removed', async () => {
    await keyStore.importSharedKey(1, rawKey(0x11));
    await keyStore.importSharedKey(2, rawKey(0x22));

    keyStore.removeSharedKey(2);

    // Epoch 1 remains available to decrypt delayed frames, but silently
    // resuming encryption with it would undo the caller's rotation policy.
    expect(keyStore.getKey('alice', 1)).toBeDefined();
    expect(keyStore.getKey('alice', 2)).toBeUndefined();
    expect(keyStore.getLatestKey('alice')).toBeNull();
    expect(keyStore.keyState()).toMatchObject({
      sharedKeys: [{ keyIndex: 1, isActive: false }],
    });
  });
});

describe('removeKey', () => {
  it('retires one epoch and leaves the rest decryptable', async () => {
    await keyStore.importKey('alice', 1, rawKey(0x01));
    await keyStore.importKey('alice', 2, rawKey(0x02));

    keyStore.removeKey('alice', 1);

    expect(keyStore.getKey('alice', 1)).toBeUndefined();
    expect(keyStore.getKey('alice', 2)).toBeDefined();
    // Epoch 2 is still the latest, so encoding is untouched.
    expect(keyStore.getLatestKey('alice')).toMatchObject({ keyIndex: 2 });
  });

  it('clears the latest pointer when it removes the latest epoch', async () => {
    await keyStore.importKey('alice', 1, rawKey(0x01));
    await keyStore.importKey('alice', 2, rawKey(0x02));
    await keyStore.importSharedKey(9, rawKey(0x09));

    keyStore.removeKey('alice', 2);

    // Leaving the pointer on the removed index would resolve nothing here and
    // silently fall through to the shared epoch below, widening the key scope
    // of every outgoing frame. Epoch 1 must not be promoted either.
    expect(keyStore.getKey('alice', 1)).toBeDefined();
    expect(keyStore.getLatestKey('alice')).toMatchObject({ keyIndex: 9 });
  });

  it('leaves no per-user key at all when the last epoch goes', async () => {
    await keyStore.importKey('alice', 1, rawKey(0x01));

    keyStore.removeKey('alice', 1);

    expect(keyStore.getLatestKey('alice')).toBeNull();
    expect(keyStore.keyState().perUserKeys).toEqual([]);
  });

  it('is a no-op for an epoch or user it does not hold', async () => {
    await keyStore.importKey('alice', 1, rawKey(0x01));

    keyStore.removeKey('alice', 7);
    keyStore.removeKey('nobody', 1);

    expect(keyStore.getKey('alice', 1)).toBeDefined();
    expect(keyStore.getLatestKey('alice')).toMatchObject({ keyIndex: 1 });
  });
});

describe('removeAllKeys', () => {
  it('deletes that user key state and leaves the others', async () => {
    await keyStore.importKey('alice', 1, rawKey(0x01));
    await keyStore.importKey('bob', 1, rawKey(0x02));

    keyStore.removeAllKeys('alice');

    expect(keyStore.getKey('alice', 1)).toBeUndefined();
    expect(keyStore.getLatestKey('alice')).toBeNull();
    expect(keyStore.getKey('bob', 1)).toBeDefined();
  });
});
