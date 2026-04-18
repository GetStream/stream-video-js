export const MAGIC = 0xdeadbeef;
export const E2EE_VERSION = 1;
/** 4 frameCounter + 1 keyIndex + 2 clearBytes + 1 version + 4 magic */
export const TRAILER_LEN = 12;
export const IV_LEN = 12;
/** bit 15 of the 2-byte clearBytes field signals RBSP escaping */
export const RBSP_FLAG = 0x8000;
export const EMPTY_AAD = new Uint8Array(0);
/** Mark key invalid after this many consecutive decrypt failures */
export const FAILURE_TOLERANCE = 10;
