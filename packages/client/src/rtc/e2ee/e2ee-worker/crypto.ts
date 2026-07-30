import {
  COUNTER_HARD_LIMIT,
  FAILURE_TOLERANCE,
  IV_PREFIX_LEN,
  REPLAY_WINDOW,
} from './constants';
import { bytesEqual } from './utils';
import type { ResolvedKey } from './types';

/** Nested rather than a `"userId:keyIndex"` string key, which a colon in the
 * userId would make ambiguous. */
type UserKeyMap<V> = Map<string, Map<number, V>>;

const getOrCreate = <V>(map: UserKeyMap<V>, userId: string): Map<number, V> => {
  let inner = map.get(userId);
  if (!inner) {
    inner = new Map();
    map.set(userId, inner);
  }
  return inner;
};

/** One imported key. Always written and deleted as a unit. */
interface KeyMaterial {
  key: CryptoKey;
  /**
   * Sender-side, fresh per import, so two imports of the same raw key get
   * different prefixes and cannot reuse an IV. Receivers read the prefix off
   * the frame trailer instead.
   */
  ivPrefix: Uint8Array;
  /** First 8 bytes of SHA-256(rawKey). Not reversible, so safe to expose. */
  fingerprint: Uint8Array;
}

const perUserKeys: UserKeyMap<KeyMaterial> = new Map();

const latestKeyIndex = new Map<string, number>();

/**
 * Monotonic per userId. Survives `removeKeys` on purpose: if the same raw key
 * is imported again, the counter keeps climbing so no (ivPrefix, counter) pair
 * repeats. Second guard against IV reuse, after the per-import random prefix.
 */
const frameCounters = new Map<string, number>();

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
 * Decryption key for (userId, keyIndex): per-user entry, else the shared key
 * when it owns that index. The keyIndex comes from the frame trailer.
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
 * The encode path's only lookup: latest per-user key, else the shared key. The
 * `ivPrefix` rides along so the encoder never resolves the same material twice.
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

/** Fill a pre-allocated IV: [8B prefix][4B counter BE]. */
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
 * @internal Test-only. Reaches counter values that would otherwise need 2^32
 * frames. Unused in production, so the bundler drops it.
 */
export const __setFrameCounterForTest = (userId: string, value: number) => {
  frameCounters.set(userId, value);
};

export const nextFrameCounter = (userId: string): number => {
  const c = (frameCounters.get(userId) || 0) + 1;
  if (c > COUNTER_HARD_LIMIT) {
    // Fail closed. One more than the 32-bit ceiling folds into an
    // (ivPrefix, counter) pair this sender already used.
    throw new Error(`frame counter exhausted for user ${userId}`);
  }
  frameCounters.set(userId, c);
  return c;
};

/**
 * Consecutive decryption failures on one track, keyed by keyIndex so a rotation
 * starts fresh.
 *
 * The per-track scope is load-bearing: shared across a user's tracks, healthy
 * frames on one would reset another's failures, so `FAILURE_TOLERANCE` is never
 * crossed and `e2ee.broken` can never fire.
 */
export interface FailureTracker {
  /** True only on the failure crossing {@link FAILURE_TOLERANCE}, so
   * `e2ee.broken` fires once per run. */
  recordFailure: (keyIndex: number) => boolean;
  /**
   * True if there was a count to clear. Do NOT gate `e2ee.decryption_resumed`
   * on it: that event names a track, not a key epoch, so a track recovering on
   * a new keyIndex must still clear it.
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
   * RFC 6479-style bitmap: bit `counter % REPLAY_WINDOW` marks a seen counter.
   * O(1) checks and in-order advance, where a `Set` needs an
   * O(REPLAY_WINDOW) prune per frame per track.
   */
  bitmap: Uint32Array;
}

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
 * Sender IV-prefix "epochs" one track's guard keeps. One is normal; a second or
 * third appears briefly around a key re-import or sender restart, while old and
 * new prefixes interleave in the jitter buffer.
 *
 * Eviction is safe because the sender never reuses an (ivPrefix, counter) pair.
 * Only `commit` creates and evicts epochs, and only authenticated frames reach
 * it, so a relay cannot forge new-prefix frames to evict a genuine epoch.
 */
const REPLAY_EPOCHS = 3;

/** Stateful, per-track replay guard. See {@link createReplayWindow}. */
export interface ReplayWindow {
  /**
   * True when this prefix can accept `counter`: new prefix, above the
   * high-water mark, or inside the window and not yet committed.
   *
   * Changes no state. A relay can forge the trailer fields this reads, so only
   * an authenticated frame advances the window. See {@link commit}.
   */
  peek: (counter: number, ivPrefix: Uint8Array) => boolean;
  /**
   * Record `counter` as seen, advancing the high-water mark. Call it only after
   * AES-GCM authenticates, so unauthenticated bytes cannot wedge the window or
   * evict a genuine epoch.
   */
  commit: (counter: number, ivPrefix: Uint8Array) => void;
}

/**
 * Replay guard for one remote track.
 *
 * Shared across tracks it would couple them: independent SSRCs and jitter
 * buffers mean delivery skew could advance `highest` far enough to reject a
 * lagging track's frames, dropping media and reporting false failures.
 *
 * Inside a track the sender's IV prefix partitions the window further, so a
 * sender restart (fresh prefix, counter near 0) opens a clean window instead of
 * losing its low counters to a stale `highest`.
 *
 * Only receive-side bookkeeping is per track. The sender's counter stays global
 * per user (see {@link nextFrameCounter}), which is what keeps IVs unique
 * across a user's tracks and the wire format identical for other SDKs.
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
        // Slots repeat every REPLAY_WINDOW counters, so skipped ones can hold a
        // stale bit and must be cleared. In-order frames skip none; a large
        // jump makes the whole bitmap stale.
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
 * The buffer length picks the variant; EncryptionManager already validated it
 * as 16 or 32 bytes. Passing `length` keeps WebCrypto unambiguous across
 * browsers.
 */
const aesGcmParams = (rawKey: ArrayBuffer): AesKeyAlgorithm => ({
  name: 'AES-GCM',
  length: rawKey.byteLength * 8,
});

/**
 * Import into a non-extractable CryptoKey, with a fresh random IV prefix and
 * the fingerprint. The fresh prefix is what lets the same raw key be imported
 * again without IV reuse.
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
 * Leaves `frameCounters` intact on purpose: a reset counter would reuse IVs if
 * the same raw key is imported again later.
 */
export const removeKeys = (userId: string) => {
  perUserKeys.delete(userId);
  latestKeyIndex.delete(userId);
};

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

/**
 * Debug snapshot. Fingerprints only: enough to confirm a sender and receiver
 * hold matching key material, and it exposes no key.
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

/**
 * @internal Test-only. Clears the module-level key and counter state between
 * test cases. Production teardown is `Worker.terminate()`, which reclaims the
 * whole worker. Unused in production, so the bundler drops it.
 */
export const dispose = () => {
  perUserKeys.clear();
  latestKeyIndex.clear();
  frameCounters.clear();
  sharedKey = null;
};
