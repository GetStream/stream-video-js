/**
 * Codec-specific framing: how many header bytes stay clear, and H.264 RBSP
 * escaping so ciphertext cannot contain a fake Annex B start code.
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
 * Clear bytes up to the first slice NALU (type 1 or 5) plus 2: start code,
 * NALU header, one byte of slice header. Ignores frameType, to match
 * {@link CodecProfile.clearBytes}.
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
      // A real slice header exceeds 2 bytes, so this clamp should never bite.
      return clear > data.length ? data.length : clear;
    }
    sc = findStartCode(data, headerPos);
  }
  return 0;
};

/**
 * Escape-state seed for the clear-header boundary: how many 0x00 bytes end the
 * clear header, capped at 2 (a longer run does not change the escaper's next
 * decision).
 *
 * The clear header itself is never escaped, but its tail and the first escaped
 * bytes form one contiguous stream on the wire: a header ending in 0x00
 * followed by ciphertext starting 0x00 0x01 is a fake start code the
 * packetizer would split on. Seeding the escaper as if the header's zeros were
 * already scanned closes that gap. Encode and decode both derive the seed from
 * the same clear bytes, so nothing extra travels in the frame.
 */
export const boundarySeedZeros = (clearHeader: Uint8Array): number => {
  const n = clearHeader.length;
  let zeros = 0;
  while (zeros < 2 && zeros < n && clearHeader[n - 1 - zeros] === 0) zeros++;
  return zeros;
};

/**
 * Escaped length of `segments`, read as one contiguous stream so a 0x00 0x00
 * run spanning a boundary counts. Sizes the buffer for {@link rbspEscapeInto}.
 *
 * @param seedZeros zero-run state entering the stream; see
 *         {@link boundarySeedZeros}.
 */
export const rbspEscapedLength = (
  segments: Uint8Array[],
  seedZeros: number,
): number => {
  let total = 0;
  let zeros = seedZeros;
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
 * Escape `segments` into `dst` at `offset`, inserting 0x03 after each 0x00 0x00
 * run followed by 0x00-0x03. `dst` needs {@link rbspEscapedLength} bytes free,
 * computed with the same `seedZeros`.
 *
 * Sizing separately lets the encoder escape straight behind the clear header,
 * copying the ciphertext once instead of twice.
 */
export const rbspEscapeInto = (
  dst: Uint8Array,
  offset: number,
  segments: Uint8Array[],
  seedZeros: number,
): void => {
  let j = offset;
  let zeros = seedZeros;
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
 * Reverse of {@link rbspEscapeInto}: drop each 0x03 the escaper inserted,
 * tracked with the same zero-run state so an escape byte right at the
 * clear-header boundary (possible only with a non-zero `seedZeros`) is
 * recognized too.
 */
export const rbspUnescape = (
  data: Uint8Array,
  seedZeros: number,
): Uint8Array => {
  const isEscapeByte = (i: number, zeros: number): boolean =>
    zeros >= 2 && data[i] === 3 && i + 1 < data.length && data[i + 1] <= 3;
  let remove = 0;
  let zeros = seedZeros;
  for (let i = 0; i < data.length; ++i) {
    if (isEscapeByte(i, zeros)) {
      remove++;
      zeros = 0;
      continue;
    }
    zeros = data[i] === 0 ? zeros + 1 : 0;
  }
  if (remove === 0) return data;
  const result = new Uint8Array(data.length - remove);
  let j = 0;
  zeros = seedZeros;
  for (let i = 0; i < data.length; ++i) {
    if (isEscapeByte(i, zeros)) {
      zeros = 0;
      continue;
    }
    result[j++] = data[i];
    zeros = data[i] === 0 ? zeros + 1 : 0;
  }
  return result;
};

/**
 * How E2EE splits a frame, for one codec. The only place holding encode-side
 * codec knowledge: one entry wires support detection, clear-byte sizing and
 * RBSP escaping together, so no codec can be half-supported. An H265 entry
 * that forgot NALU escaping would ship start-code-corrupting ciphertext.
 */
export interface CodecProfile {
  /** Escape ciphertext and trailer against fake Annex-B start codes (H264). */
  rbsp: boolean;
  /**
   * The profile can frame audio only, so the encoder fails closed on a frame
   * that carries a key/delta type. Without this an unlabeled video frame would
   * be encrypted whole and unescaped: the SFU could not read its headers, and a
   * NALU packetizer would split it on a random start code in the ciphertext.
   */
  audioOnly: boolean;
  /** Leading bytes left clear and passed as AAD, so the SFU can select layers. */
  clearBytes: (frameType: string | undefined, data: Uint8Array) => number;
}

// Audio has no keyframes, so the absence of a frame type identifies it. Keep
// the Opus TOC byte clear. Only reached for audio: `audioOnly` rejects a video
// frame before this runs.
const defaultClearBytes = (frameType: string | undefined): number =>
  frameType === undefined ? 1 : 0;

// Clamped to the frame length. A short frame claiming more would make encode
// zero-pad the header and decode build an AAD of a different length.
const vpClearBytes = (
  frameType: string | undefined,
  data: Uint8Array,
): number => {
  const clear = frameType === 'key' ? 10 : 3;
  return clear > data.length ? data.length : clear;
};

// AV1 is absent on purpose: the AV1 RTP packetizer parses the OBU stream, so a
// frame trailer does not survive. It needs its own scheme. Without an entry it
// falls through to isSupportedCodec and fails closed.
const CODEC_PROFILES: Record<string, CodecProfile> = {
  opus: { rbsp: false, audioOnly: true, clearBytes: defaultClearBytes },
  vp8: { rbsp: false, audioOnly: false, clearBytes: vpClearBytes },
  vp9: { rbsp: false, audioOnly: false, clearBytes: vpClearBytes },
  h264: { rbsp: true, audioOnly: false, clearBytes: h264ClearBytes },
};

// Used when the caller names no codec. Audio is safe to frame unlabeled, since
// the TOC byte rule holds for any audio codec. Video is not: the right clear
// header and whether to escape both depend on the codec, so it fails closed.
const DEFAULT_PROFILE: CodecProfile = {
  rbsp: false,
  audioOnly: true,
  clearBytes: defaultClearBytes,
};

// Object.hasOwn, not `in`: `in` walks the prototype chain, so a codec named
// like an Object.prototype member ('toString') would resolve to a function
// instead of a profile.
export const getCodecProfile = (codec: string | undefined): CodecProfile =>
  codec !== undefined && Object.hasOwn(CODEC_PROFILES, codec)
    ? CODEC_PROFILES[codec]
    : DEFAULT_PROFILE;

export const isSupportedCodec = (codec: string | undefined): boolean =>
  codec === undefined || Object.hasOwn(CODEC_PROFILES, codec);
