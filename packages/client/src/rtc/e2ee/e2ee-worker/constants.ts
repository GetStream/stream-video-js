/** Marks an encrypted frame's trailer. */
export const MAGIC = 0xe2eefeed;

/**
 * Wire format version. Bump it when the trailer layout or IV derivation change.
 *
 * v1: [4B frameCounter][8B ivPrefix][1B keyIndex][2B clearBytes|flags]
 * [1B version][4B magic]. IV = ivPrefix ∥ frameCounter.
 */
export const E2EE_VERSION = 1;

export const IV_PREFIX_LEN = 8;
export const FRAME_COUNTER_LEN = 4;
export const IV_LEN = IV_PREFIX_LEN + FRAME_COUNTER_LEN;

const KEY_INDEX_LEN = 1;
const CLEAR_BYTES_LEN = 2;
const VERSION_LEN = 1;
const MAGIC_LEN = 4;

/** 4 + 8 + 1 + 2 + 1 + 4 */
export const TRAILER_LEN =
  FRAME_COUNTER_LEN +
  IV_PREFIX_LEN +
  KEY_INDEX_LEN +
  CLEAR_BYTES_LEN +
  VERSION_LEN +
  MAGIC_LEN;

/** Bit 15 of the clearBytes field. Signals RBSP escaping. */
export const RBSP_FLAG = 0x8000;
/** Bit 15 belongs to RBSP_FLAG, so clearBytes gets 15 bits. */
export const MAX_CLEAR_BYTES = 0x7fff;

export const EMPTY_AAD = new Uint8Array(0);

/** Consecutive decrypt failures on one track before `e2ee.broken` fires. */
export const FAILURE_TOLERANCE = 10;

/** Replay window in frames. A counter <= highestSeen - this is rejected. */
export const REPLAY_WINDOW = 1024;

/**
 * One more than this wraps into an (ivPrefix, counter) pair the sender already
 * used, which is IV reuse under AES-GCM. Encoding throws instead.
 */
export const COUNTER_HARD_LIMIT = 0xffffffff; // 2^32 - 1
