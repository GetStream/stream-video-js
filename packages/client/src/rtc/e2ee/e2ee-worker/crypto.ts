import {
  COUNTER_HARD_LIMIT,
  COUNTER_REKEY_THRESHOLD,
  FAILURE_TOLERANCE,
  IV_PREFIX_LEN,
  REPLAY_WINDOW,
} from './constants';
import type { ResolvedKey } from './types';

/**
 * Nested map, indexed as `map.get(userId)?.get(keyIndex)`. Replaces the
 * earlier `"userId:keyIndex"` string composite, which was ambiguous when
 * `userId` contained a colon.
 */
type UserKeyMap<V> = Map<string, Map<number, V>>;

const getOrCreate = <V>(map: UserKeyMap<V>, userId: string): Map<number, V> => {
  let inner = map.get(userId);
  if (!inner) {
    inner = new Map();
    map.set(userId, inner);
  }
  return inner;
};

/** Imported CryptoKey, not extractable. */
const keyStore: UserKeyMap<CryptoKey> = new Map();

/**
 * Sender-side random IV prefix (8 bytes), freshly generated per key import.
 * Receivers read the prefix from the frame trailer and do NOT consult this
 * map. Keeping it per (userId, keyIndex) ensures that repeated imports of
 * the *same raw key* get distinct prefixes → no IV reuse.
 */
const senderIvPrefixes: UserKeyMap<Uint8Array> = new Map();

/**
 * 8-byte SHA-256 prefix of the raw key, kept only for debug/introspection
 * via `dumpKeyState`. Non-reversible, so exposing it does not leak key
 * material.
 */
const keyFingerprints: UserKeyMap<Uint8Array> = new Map();

/** Consecutive-failure counter per (userId, keyIndex). */
const decryptionFailureCounts: UserKeyMap<number> = new Map();

/** Map<userId, latest keyIndex>. */
const latestKeyIndex = new Map<string, number>();

/**
 * Monotonic frame counter per encoder userId.
 *
 * Deliberately persistent across `removeKeys`: if the same raw key is ever
 * re-imported for a user later in this worker's lifetime, the counter keeps
 * climbing so we cannot reuse an (ivPrefix, counter) pair. Combined with a
 * fresh random `senderIvPrefixes` entry per import, this gives two
 * independent guards against AES-GCM IV reuse.
 */
const frameCounters = new Map<string, number>();

let sharedKey: ResolvedKey | null = null;
let sharedSenderIvPrefix: Uint8Array | null = null;
let sharedKeyFingerprint: Uint8Array | null = null;

const randomBytes = (n: number): Uint8Array => {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return bytes;
};

const fingerprint = async (rawKey: ArrayBuffer): Promise<Uint8Array> => {
  const hash = await crypto.subtle.digest('SHA-256', rawKey);
  return new Uint8Array(hash, 0, 8);
};

export const getKey = (
  userId: string,
  keyIndex: number,
): CryptoKey | undefined => {
  const perUser = keyStore.get(userId)?.get(keyIndex);
  if (perUser) return perUser;
  if (sharedKey && keyIndex === sharedKey.keyIndex) return sharedKey.key;
  return undefined;
};

export const getLatestKey = (userId: string): ResolvedKey | null => {
  const idx = latestKeyIndex.get(userId);
  if (idx !== undefined) {
    const key = keyStore.get(userId)?.get(idx);
    if (key) return { key, keyIndex: idx };
  }
  return sharedKey;
};

/**
 * Returns the sender IV prefix for a given (userId, keyIndex) — used only
 * on the ENCODE path. Falls back to the shared-key prefix if no per-user
 * key is registered at that index.
 */
export const getSenderIvPrefix = (
  userId: string,
  keyIndex: number,
): Uint8Array | null => {
  const perUser = senderIvPrefixes.get(userId)?.get(keyIndex);
  if (perUser) return perUser;
  if (sharedKey && keyIndex === sharedKey.keyIndex) return sharedSenderIvPrefix;
  return null;
};

/** Fill a pre-allocated IV buffer: [8-byte prefix][4-byte frame counter BE]. */
export const fillIV = (
  iv: Uint8Array,
  ivView: DataView,
  prefix: Uint8Array,
  frameCounter: number,
) => {
  iv.set(prefix, 0);
  ivView.setUint32(IV_PREFIX_LEN, frameCounter);
};

/**
 * Tracks which (userId) we've already nagged about rekeying in this worker
 * session, so one threshold crossing yields one message — not one per frame.
 */
const rekeyRequested = new Set<string>();

/**
 * @internal Test-only seam to position the per-user frame counter without
 * spinning 2^31 iterations in unit tests. Not used in production.
 */
export const __setFrameCounterForTest = (userId: string, value: number) => {
  frameCounters.set(userId, value);
};

export const nextFrameCounter = (userId: string): number => {
  const c = (frameCounters.get(userId) || 0) + 1;
  if (c > COUNTER_HARD_LIMIT) {
    // Fail closed. One past the 32-bit ceiling would fold into a previously
    // used (ivPrefix, counter) pair under AES-GCM.
    throw new Error(
      `frame counter exhausted for user ${userId} — rekey required before further encryption`,
    );
  }
  if (c >= COUNTER_REKEY_THRESHOLD && !rekeyRequested.has(userId)) {
    rekeyRequested.add(userId);
    self.postMessage({ type: 'e2ee.rotation_needed', userId });
  }
  frameCounters.set(userId, c);
  return c;
};

export const isKeyInvalid = (userId: string, keyIndex: number): boolean =>
  (decryptionFailureCounts.get(userId)?.get(keyIndex) || 0) > FAILURE_TOLERANCE;

export const recordDecryptionFailure = (userId: string, keyIndex: number) => {
  const inner = getOrCreate(decryptionFailureCounts, userId);
  inner.set(keyIndex, (inner.get(keyIndex) || 0) + 1);
};

export const hasDecryptionFailures = (
  userId: string,
  keyIndex: number,
): boolean => (decryptionFailureCounts.get(userId)?.get(keyIndex) || 0) > 0;

export const resetDecryptionFailures = (userId: string, keyIndex: number) => {
  decryptionFailureCounts.get(userId)?.delete(keyIndex);
};

interface ReplayState {
  highest: number;
  seen: Set<number>;
}

/**
 * How many distinct sender IV-prefix "epochs" a single track's replay guard
 * retains. One epoch is the normal case; a second or third appears only
 * briefly around a key re-import or a sender restart, while frames carrying
 * the old and new prefix interleave in the jitter buffer. Older epochs are
 * evicted, which is safe: the sender never reuses an (ivPrefix, counter) pair.
 */
const REPLAY_EPOCHS = 3;

const prefixEquals = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

/** Stateful, per-track replay guard. See {@link createReplayWindow}. */
export interface ReplayWindow {
  /**
   * Returns true if `counter` is acceptable (new, or within the window and
   * not previously seen for this sender prefix); false if it is a replay or
   * older than the window.
   */
  check: (counter: number, ivPrefix: Uint8Array) => boolean;
}

/**
 * Creates a replay guard scoped to a single decode transform — i.e. a single
 * remote track. Those tracks travel on independent SSRCs with independent
 * jitter buffers, cross-track delivery skew could advance the shared `highest`
 * far enough that the lagging track's frames were rejected as
 * "older than the window" — dropped media and spurious decryption-failure events.
 *
 * Scoping per track removes that coupling: each guard only ever sees its own
 * track's monotonic counter subsequence. Within a track the window is further
 * partitioned by the sender's IV prefix, so a sender restart (fresh random
 * prefix, frame counter reset to 0) opens a clean window instead of having
 * its low counters rejected against a stale `highest`.
 *
 * The sender-side frame counter stays global per user (see `nextFrameCounter`)
 * — that, combined with the per-(userId, keyIndex) IV prefix, is what keeps
 * IVs unique across a user's tracks, and it keeps the on-wire format identical
 * for cross-SDK receivers. Only the receive-side replay bookkeeping changed.
 */
export const createReplayWindow = (): ReplayWindow => {
  const epochs: Array<{ prefix: Uint8Array; state: ReplayState }> = [];
  return {
    check: (counter, ivPrefix) => {
      let epoch = epochs.find((e) => prefixEquals(e.prefix, ivPrefix));
      if (!epoch) {
        epoch = {
          prefix: ivPrefix.slice(),
          state: { highest: counter, seen: new Set([counter]) },
        };
        epochs.unshift(epoch);
        if (epochs.length > REPLAY_EPOCHS) epochs.pop();
        return true;
      }
      const { state } = epoch;
      if (counter > state.highest) {
        state.highest = counter;
        const cutoff = counter - REPLAY_WINDOW;
        if (cutoff > 0) {
          for (const c of state.seen) {
            if (c <= cutoff) state.seen.delete(c);
          }
        }
        state.seen.add(counter);
        return true;
      }
      if (counter <= state.highest - REPLAY_WINDOW) return false;
      if (state.seen.has(counter)) return false;
      state.seen.add(counter);
      return true;
    },
  };
};

/**
 * AES-GCM accepts 128/192/256-bit keys. We let the raw buffer length pick
 * the variant — the EncryptionManager has already validated it at the main
 * thread boundary (16 or 32 bytes). Passing `length` explicitly keeps the
 * WebCrypto contract unambiguous across browser implementations.
 */
const aesGcmParams = (rawKey: ArrayBuffer): AesKeyAlgorithm => ({
  name: 'AES-GCM',
  length: rawKey.byteLength * 8,
});

export const importKey = async (
  userId: string,
  keyIndex: number,
  rawKey: ArrayBuffer,
) => {
  try {
    const [cryptoKey, fp] = await Promise.all([
      crypto.subtle.importKey('raw', rawKey, aesGcmParams(rawKey), false, [
        'encrypt',
        'decrypt',
      ]),
      fingerprint(rawKey),
    ]);
    getOrCreate(keyStore, userId).set(keyIndex, cryptoKey);
    getOrCreate(keyFingerprints, userId).set(keyIndex, fp);
    getOrCreate(senderIvPrefixes, userId).set(
      keyIndex,
      randomBytes(IV_PREFIX_LEN),
    );
    latestKeyIndex.set(userId, keyIndex);
    resetDecryptionFailures(userId, keyIndex);
  } catch (e: any) {
    self.postMessage({
      type: 'error',
      message: `Failed to import key for user ${userId}: ${e?.message || e}`,
    });
  }
};

export const importSharedKey = async (
  keyIndex: number,
  rawKey: ArrayBuffer,
) => {
  try {
    const [cryptoKey, fp] = await Promise.all([
      crypto.subtle.importKey('raw', rawKey, aesGcmParams(rawKey), false, [
        'encrypt',
        'decrypt',
      ]),
      fingerprint(rawKey),
    ]);
    sharedKey = { key: cryptoKey, keyIndex };
    sharedKeyFingerprint = fp;
    sharedSenderIvPrefix = randomBytes(IV_PREFIX_LEN);
    // The shared keyIndex now refers to a fresh key → reset decryption-failure
    // state tied to that slot for every user
    for (const inner of decryptionFailureCounts.values()) {
      inner.delete(keyIndex);
    }
  } catch (e: any) {
    self.postMessage({
      type: 'error',
      message: `Failed to import shared key: ${e?.message || e}`,
    });
  }
};

/**
 * Remove all per-user key state for the given userId. Deliberately leaves
 * `frameCounters` intact: resetting the encoder's counter would cause IV
 * reuse if the same raw key is imported again later in this worker.
 */
export const removeKeys = (userId: string) => {
  keyStore.delete(userId);
  senderIvPrefixes.delete(userId);
  keyFingerprints.delete(userId);
  latestKeyIndex.delete(userId);
  decryptionFailureCounts.delete(userId);
  rekeyRequested.delete(userId);
};

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

/**
 * Dump a non-sensitive snapshot of key state for debug. Returns only the
 * 8-byte SHA-256 prefix ("fingerprint") of each raw key — enough to verify
 * that sender and receiver hold matching key material, without ever
 * exposing the key itself.
 */
export const dumpKeyState = () => {
  const perUserKeys: Array<{
    userId: string;
    keyIndex: number;
    fingerprint: string;
  }> = [];
  for (const [userId, keys] of keyFingerprints) {
    for (const [keyIndex, fp] of keys) {
      perUserKeys.push({ userId, keyIndex, fingerprint: toHex(fp) });
    }
  }
  return {
    perUserKeys,
    sharedKey:
      sharedKeyFingerprint && sharedKey
        ? {
            keyIndex: sharedKey.keyIndex,
            fingerprint: toHex(sharedKeyFingerprint),
          }
        : null,
  };
};

/** Clear all state — called on worker dispose. */
export const dispose = () => {
  keyStore.clear();
  senderIvPrefixes.clear();
  keyFingerprints.clear();
  latestKeyIndex.clear();
  frameCounters.clear();
  decryptionFailureCounts.clear();
  rekeyRequested.clear();
  sharedKey = null;
  sharedSenderIvPrefix = null;
  sharedKeyFingerprint = null;
};
