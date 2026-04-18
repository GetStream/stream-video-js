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
      return sc.pos + sc.len + 2;
    }
    sc = findStartCode(data, headerPos);
  }
  return 0;
};

/**
 * Insert emulation-prevention bytes (0x03) after 0x00 0x00 when followed
 * by 0x00-0x03, preventing fake Annex B start codes in encrypted data.
 */
export const rbspEscape = (data: Uint8Array): Uint8Array => {
  const result = new Uint8Array(data.length + (data.length >> 1) + 1);
  let j = 0;
  let needsEscape = false;
  for (let i = 0; i < data.length; ++i) {
    result[j++] = data[i];
    if (
      i < data.length - 2 &&
      data[i] === 0 &&
      data[i + 1] === 0 &&
      data[i + 2] <= 3
    ) {
      result[j++] = data[++i];
      result[j++] = 3;
      needsEscape = true;
    }
  }
  return needsEscape ? result.subarray(0, j) : data;
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

/**
 * How many leading bytes of a frame stay unencrypted (passed as AAD).
 * This lets the SFU detect keyframes and select layers without decrypting.
 */
export const getClearByteCount = (
  codec: string | undefined,
  frameType: string | undefined,
  data: Uint8Array,
): number => {
  if (frameType === undefined) return 1; // audio (Opus TOC byte)
  if (codec === 'vp8') return frameType === 'key' ? 10 : 3;
  if (codec === 'h264') return h264ClearBytes(data);
  return 0; // VP9 / others
};
