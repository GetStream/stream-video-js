import {
  E2EE_VERSION,
  FRAME_COUNTER_LEN,
  IV_PREFIX_LEN,
  MAGIC,
  MAX_CLEAR_BYTES,
  RBSP_FLAG,
  TRAILER_LEN,
} from './constants';
import type { Trailer } from './types';

/** Constant-length byte comparison shared by the replay guard and AV1 OBU matching. */
export const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

/**
 * Per-key throttle: `tryFire(key)` returns true at most once per `intervalMs`
 * for a given key (recording the time when it does), false otherwise. Used to
 * rate-limit the worker's missing-key / decryption-failure notifications to the
 * host so a sustained failure can't flood the main thread.
 */
export const createThrottle = (intervalMs: number) => {
  const lastFiredAt = new Map<string, number>();
  return {
    tryFire: (key: string): boolean => {
      const now = Date.now();
      if (now - (lastFiredAt.get(key) ?? 0) > intervalMs) {
        lastFiredAt.set(key, now);
        return true;
      }
      return false;
    },
    reset: () => lastFiredAt.clear(),
  };
};

const msgQueue: Array<() => Promise<void>> = [];
let msgQueueRunning = false;

const drain = async () => {
  if (msgQueueRunning) return;
  msgQueueRunning = true;
  try {
    while (msgQueue.length > 0) {
      const task = msgQueue.shift()!;
      await task();
    }
  } finally {
    msgQueueRunning = false;
  }
};

/**
 * Serialize async tasks to prevent races between key operations and
 * transform setup (e.g. `setKey` arriving while a transform is being wired
 * up). Returns a promise that resolves/rejects with the task's own outcome.
 */
export const enqueue = <T>(fn: () => Promise<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    msgQueue.push(async () => {
      try {
        resolve(await fn());
      } catch (e) {
        reject(e);
      }
    });
    drain();
  });

// Offsets inside the 20-byte trailer.
const OFF_IV_PREFIX = FRAME_COUNTER_LEN; // 4
const OFF_KEY_INDEX = OFF_IV_PREFIX + IV_PREFIX_LEN; // 12
const OFF_CLEAR_BYTES = OFF_KEY_INDEX + 1; // 13
const OFF_VERSION = OFF_CLEAR_BYTES + 2; // 15
const OFF_MAGIC = OFF_VERSION + 1; // 16

/**
 * Trailer layout (20 bytes, v2):
 * [4B frameCounter][8B ivPrefix][1B keyIndex][2B clearBytes|flags]
 * [1B version][4B magic]
 */
export const writeTrailer = (
  dst: Uint8Array,
  offset: number,
  frameCounter: number,
  ivPrefix: Uint8Array,
  keyIndex: number,
  clearBytes: number,
  isRbsp: boolean,
) => {
  if (clearBytes > MAX_CLEAR_BYTES) {
    throw new Error(
      `clearBytes ${clearBytes} exceeds 15-bit max ${MAX_CLEAR_BYTES}`,
    );
  }
  if (ivPrefix.length !== IV_PREFIX_LEN) {
    throw new Error(
      `ivPrefix must be ${IV_PREFIX_LEN} bytes, got ${ivPrefix.length}`,
    );
  }
  const view = new DataView(dst.buffer, dst.byteOffset, dst.byteLength);
  view.setUint32(offset, frameCounter);
  dst.set(ivPrefix, offset + OFF_IV_PREFIX);
  dst[offset + OFF_KEY_INDEX] = keyIndex;
  view.setUint16(
    offset + OFF_CLEAR_BYTES,
    isRbsp ? clearBytes | RBSP_FLAG : clearBytes,
  );
  dst[offset + OFF_VERSION] = E2EE_VERSION;
  view.setUint32(offset + OFF_MAGIC, MAGIC);
};

/**
 * Read just the IV-derivation fields (frameCounter, ivPrefix, keyIndex) from
 * the 20-byte trailer at the end of `buf`. No magic/version validation: the
 * decode path uses this on an already-recognized H264 RBSP frame, after the
 * encrypted unit (ciphertext + these fields) has been un-escaped — those three
 * fields are escaped together with the ciphertext so they cannot form fake
 * Annex-B start codes (finding 11), so they are not readable from the raw frame
 * tail the way {@link readTrailer} reads clearBytes/version/magic.
 */
export const readTrailerIv = (
  buf: Uint8Array,
): Pick<Trailer, 'frameCounter' | 'ivPrefix' | 'keyIndex'> => {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const start = buf.length - TRAILER_LEN;
  return {
    frameCounter: view.getUint32(start),
    ivPrefix: buf.subarray(start + OFF_IV_PREFIX, start + OFF_KEY_INDEX),
    keyIndex: buf[start + OFF_KEY_INDEX],
  };
};

export const readTrailer = (src: Uint8Array): Trailer | null => {
  if (src.length < TRAILER_LEN) return null;
  const view = new DataView(src.buffer, src.byteOffset, src.byteLength);
  const start = src.length - TRAILER_LEN;
  if (view.getUint32(start + OFF_MAGIC) !== MAGIC) return null;
  const version = src[start + OFF_VERSION];
  // Treat unknown versions as "not our trailer" to avoid spurious
  // decryption attempts on unrelated frames that happen to end in MAGIC.
  if (version !== E2EE_VERSION) return null;
  const raw = view.getUint16(start + OFF_CLEAR_BYTES);
  const clearBytes = raw & MAX_CLEAR_BYTES;
  // Defensive consistency check — decryption would fail anyway, but this
  // lets us bail out before allocating / calling crypto.subtle.
  if (clearBytes > src.length - TRAILER_LEN) return null;
  // clearBytes/isRbsp/version/magic always live in the start-code-safe last 7
  // trailer bytes (the RBSP flag keeps the clearBytes high byte >= 0x80), so
  // they read correctly even when the rest of the trailer was escaped. The
  // frameCounter/ivPrefix/keyIndex below are valid ONLY for non-RBSP frames; on
  // an RBSP frame they sit inside the escaped unit and must be re-read with
  // {@link readTrailerIv} after un-escaping (finding 11).
  return {
    frameCounter: view.getUint32(start),
    ivPrefix: src.subarray(start + OFF_IV_PREFIX, start + OFF_KEY_INDEX),
    keyIndex: src[start + OFF_KEY_INDEX],
    clearBytes,
    isRbsp: (raw & RBSP_FLAG) !== 0,
    version,
  };
};
