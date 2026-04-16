/** A resolved encryption key paired with its rotation index. */
export interface ResolvedKey {
  key: CryptoKey;
  keyIndex: number;
}

/** Parsed 12-byte frame trailer appended to every encrypted frame. */
export interface Trailer {
  frameCounter: number;
  keyIndex: number;
  clearBytes: number;
  isRbsp: boolean;
  version: number;
}
