import {
  COUNTER_HARD_LIMIT,
  COUNTER_REKEY_THRESHOLD,
  FAILURE_TOLERANCE,
  IV_PREFIX_LEN,
  REPLAY_WINDOW,
} from './constants';
import { bytesEqual } from './utils';
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

/** The pieces of one imported key, always written and deleted as a unit. */
interface KeyMaterial {
  /** Imported CryptoKey, not extractable. */
  key: CryptoKey;
  /**
   * Sender-side random IV prefix (8 bytes), freshly generated per key import.
   * Receivers read the prefix from the frame trailer and do NOT consult this:
   * keeping it per (userId, keyIndex) ensures repeated imports of the *same raw
   * key* get distinct prefixes, so no IV reuse.
   */
  ivPrefix: Uint8Array;
  /**
   * 8-byte SHA-256 prefix of the raw key, kept only for debug/introspection via
   * `dumpKeyState`. Non-reversible, so exposing it does not leak key material.
   */
  fingerprint: Uint8Array;
}

/**
 * Per-user key material, indexed `perUserKeys.get(userId)?.get(keyIndex)`. One
 * entry per (userId, keyIndex) replaces the earlier parallel keyStore /
 * senderIvPrefixes / keyFingerprints maps, which were always written and
 * deleted together - collapsing them removes the multi-map consistency risk.
 */
const perUserKeys: UserKeyMap<KeyMaterial> = new Map();

/** Map<userId, latest keyIndex>. */
const latestKeyIndex = new Map<string, number>();

/**
 * Monotonic frame counter per encoder userId.
 *
 * Deliberately persistent across `removeKeys`: if the same raw key is ever
 * re-imported for a user later in this worker's lifetime, the counter keeps
 * climbing so we cannot reuse an (ivPrefix, counter) pair. Combined with a
 * fresh random `ivPrefix` per import, this gives two independent guards against
 * AES-GCM IV reuse.
 */
const frameCounters = new Map<string, number>();

/** Shared fallback key with its sender IV prefix and fingerprint. */
let sharedKey:
  | (ResolvedKey & { ivPrefix: Uint8Array; fingerprint: Uint8Array })
  | null = null;

const randomBytes = (n: number): Uint8Array => {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return bytes;
};

const fingerprint = async (rawKey: ArrayBuffer): Promise<Uint8Array> => {
  const hash = await crypto.subtle.digest('SHA-256', rawKey);
  return new Uint8Array(hash, 0, 8);
};

/**
 * Resolve the decryption key for (userId, keyIndex): the per-user entry if one
 * is registered, else the shared key when it owns that index, else undefined.
 * Used on the DECODE path, where the keyIndex comes from the frame trailer.
 */
export const getKey = (
  userId: string,
  keyIndex: number,
): CryptoKey | undefined => {
  const perUser = perUserKeys.get(userId)?.get(keyIndex);
  if (perUser) return perUser.key;
  if (sharedKey && keyIndex === sharedKey.keyIndex) return sharedKey.key;
  return undefined;
};

/**
 * The latest key for a user, paired with the sender IV prefix to encrypt with -
 * the single lookup the ENCODE path needs. Resolves the most recently imported
 * per-user key, falling back to the shared key. The `ivPrefix` rides along so
 * the encoder never resolves the same material a second time.
 */
export const getLatestKey = (
  userId: string,
): (ResolvedKey & { ivPrefix: Uint8Array }) | null => {
  const idx = latestKeyIndex.get(userId);
  if (idx !== undefined) {
    const km = perUserKeys.get(userId)?.get(idx);
    if (km) return { key: km.key, keyIndex: idx, ivPrefix: km.ivPrefix };
  }
  return sharedKey;
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

/**
 * Per-track consecutive-decryption-failure tracker, scoped to a single decode
 * transform like the replay window (see {@link createReplayWindow}). Keeping it
 * per-track is load-bearing: a counter shared across all of a user's tracks lets
 * one track's healthy frames reset another's failures, so `FAILURE_TOLERANCE` is
 * never crossed and the terminal `e2ee.broken` signal can never fire while
 * `e2ee.decryption_resumed` flaps once per healthy frame (review finding 2.2).
 * Counts are keyed by keyIndex so a key rotation within the track starts fresh.
 */
export interface FailureTracker {
  /**
   * Record one decryption failure at `keyIndex`. Returns true ONLY on the
   * failure that crosses {@link FAILURE_TOLERANCE}, so the caller fires
   * `e2ee.broken` exactly once per failure run.
   */
  recordFailure: (keyIndex: number) => boolean;
  /**
   * Clear the failure count at `keyIndex` after a successful decrypt. Returns
   * true if there were failures to clear, so the caller can fire
   * `e2ee.decryption_resumed` on the recovery edge (and only then).
   */
  recordSuccess: (keyIndex: number) => boolean;
}

export const createFailureTracker = (): FailureTracker => {
  const counts = new Map<number, number>();
  return {
    recordFailure: (keyIndex) => {
      const next = (counts.get(keyIndex) ?? 0) + 1;
      counts.set(keyIndex, next);
      return next === FAILURE_TOLERANCE + 1;
    },
    recordSuccess: (keyIndex) => counts.delete(keyIndex),
  };
};

interface ReplayState {
  highest: number;
  /**
   * RFC 6479-style sliding-window bitmap: bit `counter % REPLAY_WINDOW` marks a
   * seen counter. Gives O(1) accept/replay checks and amortized O(1) window
   * advance, instead of the O(REPLAY_WINDOW) `Set` prune that ran on every
   * in-order frame, per track, in the real-time decode worker.
   */
  bitmap: Uint32Array;
}

/** REPLAY_WINDOW bits packed into 32-bit words. */
const REPLAY_WINDOW_WORDS = REPLAY_WINDOW >>> 5;

const replayBit = (counter: number) => {
  const idx = counter % REPLAY_WINDOW;
  return { word: idx >>> 5, mask: 1 << (idx & 31) };
};
const replaySeen = (bitmap: Uint32Array, counter: number): boolean => {
  const { word, mask } = replayBit(counter);
  return (bitmap[word] & mask) !== 0;
};
const replaySet = (bitmap: Uint32Array, counter: number) => {
  const { word, mask } = replayBit(counter);
  bitmap[word] |= mask;
};
const replayClear = (bitmap: Uint32Array, counter: number) => {
  const { word, mask } = replayBit(counter);
  bitmap[word] &= ~mask;
};

/**
 * How many distinct sender IV-prefix "epochs" a single track's replay guard
 * retains. One epoch is the normal case; a second or third appears only
 * briefly around a key re-import or a sender restart, while frames carrying
 * the old and new prefix interleave in the jitter buffer. Older epochs are
 * evicted, which is safe: the sender never reuses an (ivPrefix, counter) pair.
 *
 * Epochs are created and evicted ONLY by `commit`, i.e. only by frames that
 * authenticated. A relay therefore cannot fabricate novel-prefix frames to
 * evict a genuine epoch and re-open a replay window (review finding 2).
 */
const REPLAY_EPOCHS = 3;

/** Stateful, per-track replay guard. See {@link createReplayWindow}. */
export interface ReplayWindow {
  /**
   * Read-only acceptance check. Returns true if `counter` is admissible for
   * this sender prefix (a novel prefix, newer than the prefix's high-water
   * mark, or within the window and not previously committed); false if it is
   * a replay or older than the window.
   *
   * Does NOT mutate any state. The counter, prefix and keyIndex it reads are
   * plaintext in the frame trailer and forgeable by a relay, so the window is
   * only advanced once the frame authenticates — see {@link commit}.
   */
  peek: (counter: number, ivPrefix: Uint8Array) => boolean;
  /**
   * Records `counter` as seen for this sender prefix, advancing the high-water
   * mark and creating / evicting epochs as needed. Call this ONLY after the
   * frame authenticates (AES-GCM succeeds), so unauthenticated bytes can never
   * wedge the window (review finding 1) or evict a genuine epoch (finding 2).
   */
  commit: (counter: number, ivPrefix: Uint8Array) => void;
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
  const findEpoch = (ivPrefix: Uint8Array) =>
    epochs.find((e) => bytesEqual(e.prefix, ivPrefix));
  return {
    peek: (counter, ivPrefix) => {
      const epoch = findEpoch(ivPrefix);
      // A prefix with no committed frame yet opens a clean window.
      if (!epoch) return true;
      const { state } = epoch;
      if (counter > state.highest) return true;
      if (counter <= state.highest - REPLAY_WINDOW) return false;
      return !replaySeen(state.bitmap, counter);
    },
    commit: (counter, ivPrefix) => {
      let epoch = findEpoch(ivPrefix);
      if (!epoch) {
        const bitmap = new Uint32Array(REPLAY_WINDOW_WORDS);
        replaySet(bitmap, counter);
        epoch = {
          prefix: ivPrefix.slice(),
          state: { highest: counter, bitmap },
        };
        epochs.unshift(epoch);
        if (epochs.length > REPLAY_EPOCHS) epochs.pop();
        return;
      }
      const { state } = epoch;
      if (counter > state.highest) {
        // Advance the window. Each slot is reused every REPLAY_WINDOW counters,
        // so the slots for the counters skipped between the old high-water mark
        // and the new one may still hold a stale bit and must be cleared. O(1)
        // for an in-order frame (no skipped slots); bounded by REPLAY_WINDOW for
        // a jump, where the whole bitmap is stale and cleared at once.
        if (counter - state.highest >= REPLAY_WINDOW) {
          state.bitmap.fill(0);
        } else {
          for (let c = state.highest + 1; c < counter; c++) {
            replayClear(state.bitmap, c);
          }
        }
        state.highest = counter;
      }
      replaySet(state.bitmap, counter);
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

/**
 * Import raw AES-GCM key bytes into a non-extractable CryptoKey, paired with a
 * fresh random sender IV prefix and the key fingerprint. Shared by
 * {@link importKey} and {@link importSharedKey}; the fresh-per-import prefix is
 * what lets the same raw key be re-imported without risking AES-GCM IV reuse.
 */
const importKeyMaterial = async (rawKey: ArrayBuffer): Promise<KeyMaterial> => {
  const [key, fp] = await Promise.all([
    crypto.subtle.importKey('raw', rawKey, aesGcmParams(rawKey), false, [
      'encrypt',
      'decrypt',
    ]),
    fingerprint(rawKey),
  ]);
  return { key, ivPrefix: randomBytes(IV_PREFIX_LEN), fingerprint: fp };
};

export const importKey = async (
  userId: string,
  keyIndex: number,
  rawKey: ArrayBuffer,
) => {
  try {
    getOrCreate(perUserKeys, userId).set(
      keyIndex,
      await importKeyMaterial(rawKey),
    );
    latestKeyIndex.set(userId, keyIndex);
  } catch (e: any) {
    self.postMessage({
      type: 'e2ee.error',
      message: `Failed to import key for user ${userId}: ${e?.message || e}`,
    });
  }
};

export const importSharedKey = async (
  keyIndex: number,
  rawKey: ArrayBuffer,
) => {
  try {
    sharedKey = { ...(await importKeyMaterial(rawKey)), keyIndex };
  } catch (e: any) {
    self.postMessage({
      type: 'e2ee.error',
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
  perUserKeys.delete(userId);
  latestKeyIndex.delete(userId);
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
  const keys: Array<{
    userId: string;
    keyIndex: number;
    fingerprint: string;
  }> = [];
  for (const [userId, perKeyIndex] of perUserKeys) {
    for (const [keyIndex, km] of perKeyIndex) {
      keys.push({ userId, keyIndex, fingerprint: toHex(km.fingerprint) });
    }
  }
  return {
    perUserKeys: keys,
    sharedKey: sharedKey
      ? {
          keyIndex: sharedKey.keyIndex,
          fingerprint: toHex(sharedKey.fingerprint),
        }
      : null,
  };
};

/** Clear all state — called on worker dispose. */
export const dispose = () => {
  perUserKeys.clear();
  latestKeyIndex.clear();
  frameCounters.clear();
  rekeyRequested.clear();
  sharedKey = null;
};
