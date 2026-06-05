/**
 * Codec-specific frame processing.
 *
 * Handles clear-byte calculation (how many header bytes stay unencrypted)
 * and H.264 RBSP escaping/unescaping to prevent fake Annex B start codes
 * in encrypted payloads.
 */
const findStartCode = (
  data: Uint8Array,
  offset: number,
): { pos: number; len: number } | null => {
  for (let i = offset; i < data.length - 2; ++i) {
    if (data[i] === 0 && data[i + 1] === 0) {
      if (data[i + 2] === 1) return { pos: i, len: 3 };
      if (data[i + 2] === 0 && i + 3 < data.length && data[i + 3] === 1) {
        return { pos: i, len: 4 };
      }
    }
  }
  return null;
};

/**
 * Returns clear-byte count for H.264: everything up to the first slice
 * NALU's start index + 2 (start code + NALU header + 1 byte of slice header).
 * Slice NALUs: type 1 (non-IDR) and type 5 (IDR).
 */
const h264ClearBytes = (data: Uint8Array): number => {
  let sc = findStartCode(data, 0);
  while (sc) {
    const headerPos = sc.pos + sc.len;
    if (headerPos >= data.length) break;
    const naluType = data[headerPos] & 0x1f;
    if (naluType === 1 || naluType === 5) {
      const clear = sc.pos + sc.len + 2;
      // Defensive: ensure we're not asked to leave more clear bytes than
      // the frame contains. Shouldn't normally happen — slice headers are
      // larger than 2 bytes — but keeps the encoder honest.
      return clear > data.length ? data.length : clear;
    }
    sc = findStartCode(data, headerPos);
  }
  return 0;
};

/**
 * Insert emulation-prevention bytes (0x03) after 0x00 0x00 when followed by
 * 0x00-0x03, preventing fake Annex B start codes in the encrypted payload.
 *
 * Two-pass: count required escapes first so the output buffer is sized
 * exactly. Saves up to 50% of the allocation for the non-worst-case path.
 */
export const rbspEscape = (data: Uint8Array): Uint8Array => {
  let escapeCount = 0;
  let zeros = 0;
  for (let i = 0; i < data.length; ++i) {
    const byte = data[i];
    if (zeros >= 2 && byte <= 3) {
      escapeCount++;
      zeros = 0;
    }
    zeros = byte === 0 ? zeros + 1 : 0;
  }
  if (escapeCount === 0) return data;

  const result = new Uint8Array(data.length + escapeCount);
  let j = 0;
  zeros = 0;
  for (let i = 0; i < data.length; ++i) {
    const byte = data[i];
    if (zeros >= 2 && byte <= 3) {
      result[j++] = 3;
      zeros = 0;
    }
    result[j++] = byte;
    zeros = byte === 0 ? zeros + 1 : 0;
  }
  return result;
};

/** Reverse of rbspEscape: strip 0x03 after 0x00 0x00 before 0x00-0x03. */
export const rbspUnescape = (data: Uint8Array): Uint8Array => {
  let remove = 0;
  for (let i = 0; i < data.length - 2; ++i) {
    if (
      data[i] === 0 &&
      data[i + 1] === 0 &&
      data[i + 2] === 3 &&
      i + 3 < data.length &&
      data[i + 3] <= 3
    ) {
      remove++;
      i += 2;
    }
  }
  if (remove === 0) return data;
  const result = new Uint8Array(data.length - remove);
  let j = 0;
  for (let i = 0; i < data.length; ++i) {
    if (
      i < data.length - 2 &&
      data[i] === 0 &&
      data[i + 1] === 0 &&
      data[i + 2] === 3 &&
      i + 3 < data.length &&
      data[i + 3] <= 3
    ) {
      result[j++] = 0;
      result[j++] = 0;
      i += 2;
      continue;
    }
    result[j++] = data[i];
  }
  return result.subarray(0, j);
};

/** Codecs the worker knows how to split into clear header + encrypted body. */
const SUPPORTED_CODECS = new Set(['opus', 'vp8', 'vp9', 'h264', 'av1']);

export const isSupportedCodec = (codec: string | undefined): boolean =>
  codec === undefined || SUPPORTED_CODECS.has(codec);

/**
 * How many leading bytes of a frame stay unencrypted (passed as AAD).
 * This lets the SFU detect keyframes and select layers without decrypting.
 *
 * `frameType === undefined` indicates an audio frame (no keyframe concept
 * in the encoded transform API).
 */
export const getClearByteCount = (
  codec: string | undefined,
  frameType: string | undefined,
  data: Uint8Array,
): number => {
  if (frameType === undefined) return 1; // audio (Opus TOC byte)
  if (codec === 'vp8' || codec === 'vp9') return frameType === 'key' ? 10 : 3;
  if (codec === 'h264') return h264ClearBytes(data);
  return 0; // others
};
