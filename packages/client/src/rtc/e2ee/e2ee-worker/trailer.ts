/**
 * The on-wire framing: the 20-byte trailer appended to every encrypted frame,
 * and the 12-byte IV both directions derive.
 *
 * Write and read live together on purpose. They are one contract - the encoder
 * lays out bytes the decoder must find at the same offsets - so the layout is
 * defined once, here, and a change to it is a wire break: bump
 * {@link E2EE_VERSION} and regenerate the SPEC section 11 vectors.
 *
 * Layout, from the trailer's first byte:
 *   [4B frameCounter][8B ivPrefix][1B keyIndex][2B clearBytes|flags]
 *   [1B version][4B magic]
 */

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

const OFF_IV_PREFIX = FRAME_COUNTER_LEN; // 4
const OFF_KEY_INDEX = OFF_IV_PREFIX + IV_PREFIX_LEN; // 12
const OFF_CLEAR_BYTES = OFF_KEY_INDEX + 1; // 13
const OFF_VERSION = OFF_CLEAR_BYTES + 2; // 15
const OFF_MAGIC = OFF_VERSION + 1; // 16

/**
 * Fill a pre-allocated 12-byte IV: `[8B ivPrefix][4B frameCounter, BE]`.
 *
 * The encoder builds it from its own prefix and counter; the decoder rebuilds
 * the identical bytes from the trailer. The buffer is reused across frames
 * rather than allocated per frame - this runs once per frame on every track.
 */
export const fillIV = (
  iv: Uint8Array,
  ivView: DataView,
  prefix: Uint8Array,
  frameCounter: number,
) => {
  iv.set(prefix, 0);
  ivView.setUint32(IV_PREFIX_LEN, frameCounter);
};

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

/**
 * The frozen identification suffix: `version (1) || magic (4)`. A literal, not
 * `TRAILER_LEN - OFF_VERSION`, because this length is frozen at 5 for every
 * version present and future while those two constants describe v1 only - a
 * later layout change must break the round-trip test, not silently move the
 * suffix older receivers depend on. `trailer.test.ts` pins it to the bytes
 * `writeTrailer` actually emits.
 *
 * Read from the end rather than from a trailer start, because a future version
 * may not use a 20-byte trailer, and a receiver that cannot decrypt such a
 * frame still has to recognize it.
 */
const IDENT_SUFFIX_LEN = 5;
/** Within the suffix: the magic follows the single version byte. */
const OFF_SUFFIX_MAGIC = 1;

/**
 * The framing version of a frame carrying this format, or `null` if the frame
 * is not ours at all.
 *
 * This is what separates the two reasons {@link readTrailer} returns `null`:
 * an unrelated cleartext frame, versus an encrypted frame from a peer on a
 * version this build cannot decrypt.
 *
 * @param view - An existing view over exactly `src`, to avoid a second
 * allocation on the per-frame decode path. Built here when omitted.
 */
export const readFramingVersion = (
  src: Uint8Array,
  view?: DataView,
): number | null => {
  if (src.length < IDENT_SUFFIX_LEN) return null;
  const bytes =
    view ?? new DataView(src.buffer, src.byteOffset, src.byteLength);
  const start = src.length - IDENT_SUFFIX_LEN;
  if (bytes.getUint32(start + OFF_SUFFIX_MAGIC) !== MAGIC) return null;
  return src[start];
};

export const readTrailer = (src: Uint8Array): Trailer | null => {
  if (src.length < TRAILER_LEN) return null;
  const view = new DataView(src.buffer, src.byteOffset, src.byteLength);
  if (readFramingVersion(src, view) !== E2EE_VERSION) return null;
  const start = src.length - TRAILER_LEN;
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
