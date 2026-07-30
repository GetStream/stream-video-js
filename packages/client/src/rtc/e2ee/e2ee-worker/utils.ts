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

/** Length-safe byte comparison. */
export const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

/**
 * `tryFire(key)` returns true at most once per `intervalMs` for that key, so a
 * sustained failure cannot flood the host with notifications.
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
  };
};

let tail: Promise<unknown> = Promise.resolve();

/**
 * Run tasks FIFO, one at a time, so a `setKey` cannot race transform setup.
 * `tail` swallows errors so one rejection cannot stall the queue; the returned
 * promise still carries that task's own outcome.
 */
export const enqueue = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = tail.then(fn);
  tail = run.catch(() => {});
  return run;
};

// Trailer offsets.
const OFF_IV_PREFIX = FRAME_COUNTER_LEN; // 4
const OFF_KEY_INDEX = OFF_IV_PREFIX + IV_PREFIX_LEN; // 12
const OFF_CLEAR_BYTES = OFF_KEY_INDEX + 1; // 13
const OFF_VERSION = OFF_CLEAR_BYTES + 2; // 15
const OFF_MAGIC = OFF_VERSION + 1; // 16

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
 * IV fields only, from an already-recognized trailer. An H264 RBSP frame
 * escapes these three with the ciphertext, so un-escape the unit before
 * calling this.
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
  // Unknown version means not our trailer, so an unrelated frame that happens
  // to end in MAGIC does not reach a decrypt.
  if (version !== E2EE_VERSION) return null;
  const raw = view.getUint16(start + OFF_CLEAR_BYTES);
  const clearBytes = raw & MAX_CLEAR_BYTES;
  // Bail out before allocating; the decrypt would fail anyway.
  if (clearBytes > src.length - TRAILER_LEN) return null;
  // The last 7 bytes survive escaping untouched: the RBSP flag holds the
  // clearBytes high byte >= 0x80 and breaks any zero run. The three below are
  // valid only on a non-RBSP frame; see {@link readTrailerIv}.
  return {
    frameCounter: view.getUint32(start),
    ivPrefix: src.subarray(start + OFF_IV_PREFIX, start + OFF_KEY_INDEX),
    keyIndex: src[start + OFF_KEY_INDEX],
    clearBytes,
    isRbsp: (raw & RBSP_FLAG) !== 0,
  };
};
