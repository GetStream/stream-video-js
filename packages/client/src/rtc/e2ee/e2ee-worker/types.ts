/** A resolved encryption key paired with its rotation index. */
export interface ResolvedKey {
  key: CryptoKey;
  keyIndex: number;
}

/** Parsed 20-byte frame trailer appended to every encrypted frame (v2). */
export interface Trailer {
  frameCounter: number;
  /** View of the 8-byte IV prefix inside the source frame buffer. */
  ivPrefix: Uint8Array;
  keyIndex: number;
  clearBytes: number;
  isRbsp: boolean;
}
