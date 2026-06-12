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
 * Total length of `segments` after RBSP escaping (sum of segment lengths plus
 * the inserted emulation-prevention bytes), treating the segments as one
 * contiguous stream so a 0x00 0x00 run is recognised across a segment boundary.
 * Lets a caller size a destination buffer exactly before escaping into it with
 * {@link rbspEscapeInto}.
 */
export const rbspEscapedLength = (segments: Uint8Array[]): number => {
  let total = 0;
  let zeros = 0;
  for (const seg of segments) {
    total += seg.length;
    for (let i = 0; i < seg.length; ++i) {
      const byte = seg[i];
      if (zeros >= 2 && byte <= 3) {
        total++;
        zeros = 0;
      }
      zeros = byte === 0 ? zeros + 1 : 0;
    }
  }
  return total;
};

/**
 * Insert emulation-prevention bytes (0x03) after 0x00 0x00 when followed by
 * 0x00-0x03, preventing fake Annex B start codes in the encrypted payload, by
 * escaping `segments` (treated as one contiguous stream) into `dst` starting at
 * byte `offset`. `dst` must have at least {@link rbspEscapedLength}(segments)
 * bytes of room from `offset`. Splitting the length pass from the write lets the
 * encoder escape ciphertext + trailer straight behind the clear header in a
 * single copy instead of staging them through an intermediate buffer.
 */
export const rbspEscapeInto = (
  dst: Uint8Array,
  offset: number,
  segments: Uint8Array[],
): void => {
  let j = offset;
  let zeros = 0;
  for (const seg of segments) {
    for (let i = 0; i < seg.length; ++i) {
      const byte = seg[i];
      if (zeros >= 2 && byte <= 3) {
        dst[j++] = 3;
        zeros = 0;
      }
      dst[j++] = byte;
      zeros = byte === 0 ? zeros + 1 : 0;
    }
  }
};

/**
 * Escape a single buffer, returning the same buffer when no escapes are needed.
 */
export const rbspEscape = (data: Uint8Array): Uint8Array => {
  const segments = [data];
  const escapedLength = rbspEscapedLength(segments);
  if (escapedLength === data.length) return data;
  const result = new Uint8Array(escapedLength);
  rbspEscapeInto(result, 0, segments);
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
  if (codec === 'vp8' || codec === 'vp9') {
    // Clamp to the frame length (as h264ClearBytes does): a frame shorter than
    // the nominal header must not claim more clear bytes than it has, or encode
    // zero-pads the clear header and decode builds a length-mismatched AAD.
    const clear = frameType === 'key' ? 10 : 3;
    return clear > data.length ? data.length : clear;
  }
  if (codec === 'h264') return h264ClearBytes(data);
  return 0; // others
};
