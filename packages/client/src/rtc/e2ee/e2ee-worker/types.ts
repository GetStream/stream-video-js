/** Minimal shape of an RTCEncodedVideo/AudioFrame. */
export interface EncodedFrame {
  data: ArrayBuffer;
  /** Absent on audio: the lack of a key/delta type is how audio is recognized. */
  type?: 'key' | 'delta' | 'empty';
  timestamp: number;
}

/** The subset of TransformStreamDefaultController the transforms use. */
export type FrameController = {
  enqueue(frame: EncodedFrame): void;
  terminate(): void;
};

/** A resolved encryption key paired with its rotation index. */
export interface ResolvedKey {
  key: CryptoKey;
  keyIndex: number;
}

/** Parsed 20-byte frame trailer appended to every encrypted frame (v1). */
export interface Trailer {
  frameCounter: number;
  /** View of the 8-byte IV prefix inside the source frame buffer. */
  ivPrefix: Uint8Array;
  keyIndex: number;
  clearBytes: number;
  isRbsp: boolean;
}
