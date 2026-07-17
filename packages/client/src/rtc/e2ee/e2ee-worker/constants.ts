/** Magic marker used to recognize an encrypted frame's trailer. */
export const MAGIC = 0xdeadbeef;

/**
 * Wire format version. Bump when the trailer layout or IV derivation changes.
 *
 * v1: [4B frameCounter][8B ivPrefix][1B keyIndex][2B clearBytes|flags]
 *     [1B version][4B magic] = 20 bytes.
 *     IV = ivPrefix ∥ frameCounter (12 bytes). ivPrefix is a sender-chosen
 *     random value, fresh per key import — prevents IV reuse even when the
 *     same raw key ends up being used across worker sessions.
 */
export const E2EE_VERSION = 1;

/** Sender-chosen random prefix occupying the first 8 bytes of the IV. */
export const IV_PREFIX_LEN = 8;
/** Monotonic counter occupying the last 4 bytes of the IV. */
export const FRAME_COUNTER_LEN = 4;
export const IV_LEN = IV_PREFIX_LEN + FRAME_COUNTER_LEN;

/** Field widths in the trailer. */
const KEY_INDEX_LEN = 1;
const CLEAR_BYTES_LEN = 2;
const VERSION_LEN = 1;
const MAGIC_LEN = 4;

/** 4 + 8 + 1 + 2 + 1 + 4 = 20 */
export const TRAILER_LEN =
  FRAME_COUNTER_LEN +
  IV_PREFIX_LEN +
  KEY_INDEX_LEN +
  CLEAR_BYTES_LEN +
  VERSION_LEN +
  MAGIC_LEN;

/** bit 15 of the 2-byte clearBytes field signals RBSP escaping */
export const RBSP_FLAG = 0x8000;
/** 15-bit max for clearBytes (bit 15 is reserved for RBSP_FLAG). */
export const MAX_CLEAR_BYTES = 0x7fff;

export const EMPTY_AAD = new Uint8Array(0);

/** Mark key invalid after this many consecutive decrypt failures. */
export const FAILURE_TOLERANCE = 10;

/**
 * Sliding window (in frames) for replay protection per (userId, keyIndex).
 * Any frame whose counter is ≤ highestSeen - REPLAY_WINDOW is rejected.
 */
export const REPLAY_WINDOW = 1024;

/**
 * Frame counter at which we ask the host to rotate the key. The counter is a
 * 32-bit big-endian field in the IV, so it wraps at 2^32. We signal early
 * (at 2^31) to give the integrator headroom to distribute a new keyIndex
 * before we hit the hard limit.
 */
export const COUNTER_REKEY_THRESHOLD = 0x80000000; // 2^31
/**
 * Hard ceiling on the frame counter. One past this value would wrap into a
 * reused (ivPrefix, counter) pair → IV reuse under AES-GCM → catastrophic.
 * Encoding throws here and fails closed rather than silently wrapping.
 */
export const COUNTER_HARD_LIMIT = 0xffffffff; // 2^32 - 1

/**
 * Format discriminator for the AV1 inline-OBU scheme, carried in each encrypted
 * OBU's inline header. NOT a successor to {@link E2EE_VERSION} (the trailer
 * scheme the other codecs use): the two are per-codec formats that co-ship and
 * coexist at runtime, told apart by this byte. It also doubles as a
 * forward-looking evolution hook once this ships. Nothing is released yet, so
 * the value is free to change before release.
 */
export const AV1_VERSION = 3;

/**
 * Inline header prepended to each encrypted AV1 OBU payload (v3):
 *   [4B magic][1B version][1B keyIndex][8B ivPrefix][4B frameCounter] = 18 B.
 * Mirrors the v2 trailer fields, relocated inside the OBU because an AV1 frame
 * cannot carry a trailing trailer (RtpPacketizerAv1 parses OBUs).
 */
export const AV1_INLINE_HEADER_LEN = 18;
