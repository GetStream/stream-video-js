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
 * Slice NALUs: type 1 (non-IDR) and type 5 (IDR). Takes the unused frame type so
 * it conforms to {@link CodecProfile.clearBytes} and can be referenced directly.
 */
const h264ClearBytes = (
  _frameType: string | undefined,
  data: Uint8Array,
): number => {
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

/**
 * How E2EE splits a frame, per codec — the single source of encode-side codec
 * knowledge. Adding a codec here wires it into support detection, clear-byte
 * sizing, RBSP escaping, and framing-scheme selection at once, so a codec can't
 * be half-supported (e.g. an H265 entry that forgets NALU escaping and ships
 * start-code-corrupting ciphertext).
 */
export interface CodecProfile {
  /**
   * `'trailer'` = clear header + encrypted body + 20-byte trailer (audio,
   * VP8/VP9, H264). `'av1'` = per-OBU inline header, no trailer (see ./av1.ts).
   */
  scheme: 'trailer' | 'av1';
  /** RBSP-escape ciphertext + trailer to suppress fake Annex-B start codes (H264). */
  rbsp: boolean;
  /**
   * Leading bytes left unencrypted (passed as AAD) so the SFU can read frame
   * headers / select layers without decrypting.
   */
  clearBytes: (frameType: string | undefined, data: Uint8Array) => number;
}

// Audio (no keyframe concept) keeps the Opus TOC byte clear; anything without a
// codec-specific rule encrypts the whole frame.
const defaultClearBytes = (frameType: string | undefined): number =>
  frameType === undefined ? 1 : 0;

// VP8/VP9 keep a fixed header clear, clamped to the frame length so a short
// frame never claims more clear bytes than it has - otherwise encode zero-pads
// the clear header and decode builds a length-mismatched AAD.
const vpClearBytes = (
  frameType: string | undefined,
  data: Uint8Array,
): number => {
  const clear = frameType === 'key' ? 10 : 3;
  return clear > data.length ? data.length : clear;
};

// AV1 carries no clear prefix in this scheme (each OBU has an inline header
// instead); the encoder branches on `scheme` first, so this is never invoked.
const noClearBytes = (): number => 0;

const CODEC_PROFILES: Record<string, CodecProfile> = {
  opus: { scheme: 'trailer', rbsp: false, clearBytes: defaultClearBytes },
  vp8: { scheme: 'trailer', rbsp: false, clearBytes: vpClearBytes },
  vp9: { scheme: 'trailer', rbsp: false, clearBytes: vpClearBytes },
  h264: { scheme: 'trailer', rbsp: true, clearBytes: h264ClearBytes },
  av1: { scheme: 'av1', rbsp: false, clearBytes: noClearBytes },
};

// Unknown / absent codec: audio passes through with the Opus clear byte, video
// encrypts whole. Matches the legacy `frameType === undefined ? 1 : 0` fallback.
const DEFAULT_PROFILE: CodecProfile = {
  scheme: 'trailer',
  rbsp: false,
  clearBytes: defaultClearBytes,
};

/** Resolve a codec's profile, falling back to the passthrough default. */
export const getCodecProfile = (codec: string | undefined): CodecProfile =>
  (codec !== undefined && CODEC_PROFILES[codec]) || DEFAULT_PROFILE;

export const isSupportedCodec = (codec: string | undefined): boolean =>
  codec === undefined || codec in CODEC_PROFILES;
