import { describe, expect, it } from 'vitest';
import {
  getCodecProfile,
  isSupportedCodec,
  rbspEscapeInto,
  rbspEscapedLength,
  rbspUnescape,
} from '../e2ee-worker/codec';

// Single-buffer escape helper. Production only ever escapes the
// [ciphertext, trailer] segment pair via rbspEscapedLength + rbspEscapeInto, so
// this convenience wrapper lives in the test rather than the shipped worker.
const rbspEscape = (data: Uint8Array): Uint8Array => {
  const out = new Uint8Array(rbspEscapedLength([data]));
  rbspEscapeInto(out, 0, [data]);
  return out;
};

describe('rbspEscape + rbspUnescape', () => {
  const roundTrip = (input: number[]) => {
    const data = new Uint8Array(input);
    const escaped = rbspEscape(data);
    const unescaped = rbspUnescape(escaped);
    return { escaped, unescaped: Array.from(unescaped) };
  };

  it('is identity when no escape needed', () => {
    const { escaped } = roundTrip([1, 2, 3, 4, 5]);
    // No zero pairs → no emulation-prevention bytes inserted.
    expect(escaped).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
  });

  it('inserts 0x03 between 00 00 and 00-03', () => {
    // [0, 0, 1] → [0, 0, 3, 1]
    const out = rbspEscape(new Uint8Array([0, 0, 1]));
    expect(Array.from(out)).toEqual([0, 0, 3, 1]);
  });

  it('round-trips a run of zeros', () => {
    const { unescaped } = roundTrip([0, 0, 0, 0, 0, 0]);
    expect(unescaped).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('round-trips mixed content', () => {
    const input = [0xaa, 0, 0, 1, 0xbb, 0xcc, 0, 0, 2, 0xdd];
    const { unescaped } = roundTrip(input);
    expect(unescaped).toEqual(input);
  });

  it('round-trips empty input', () => {
    const { unescaped } = roundTrip([]);
    expect(unescaped).toEqual([]);
  });

  it('round-trips a 256-byte pseudo-random buffer', () => {
    const input = new Uint8Array(256);
    // deterministic "random" to exercise many byte values
    for (let i = 0; i < input.length; i++) input[i] = (i * 31) & 0xff;
    const escaped = rbspEscape(input);
    const unescaped = rbspUnescape(escaped);
    expect(Array.from(unescaped)).toEqual(Array.from(input));
  });

  it('produces a buffer free of forbidden start-code-like sequences', () => {
    // After RBSP escaping, the sequences 00 00 00, 00 00 01, and 00 00 02
    // must not appear. 00 00 03 is allowed — it's the escape marker itself.
    const escaped = rbspEscape(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]));
    for (let i = 0; i < escaped.length - 2; i++) {
      if (escaped[i] === 0 && escaped[i + 1] === 0) {
        expect(escaped[i + 2]).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe('rbspEscapeInto + rbspEscapedLength (multi-segment)', () => {
  // The H264 encode path escapes [ciphertext, trailer] as one stream straight
  // behind the clear header. These lock in that escaping the segments is
  // byte-identical to escaping their concatenation, including when an escape
  // sequence straddles the segment boundary.
  const concat = (...segs: number[][]) => new Uint8Array(segs.flat());

  const escapeSegments = (segs: number[][]) => {
    const segments = segs.map((s) => new Uint8Array(s));
    const out = new Uint8Array(rbspEscapedLength(segments));
    rbspEscapeInto(out, 0, segments);
    return out;
  };

  it('matches single-buffer escaping of the concatenation', () => {
    const a = [0xaa, 0, 0, 1, 0xbb];
    const b = [0, 0, 2, 0xcc];
    expect(Array.from(escapeSegments([a, b]))).toEqual(
      Array.from(rbspEscape(concat(a, b))),
    );
  });

  it('escapes a 00 00 run that straddles the segment boundary', () => {
    // a ends in 00 00, b starts with 01 -> the escape byte must be inserted at
    // the boundary exactly as if the bytes were one buffer.
    const a = [0xaa, 0, 0];
    const b = [1, 0xbb];
    const escaped = escapeSegments([a, b]);
    expect(Array.from(escaped)).toEqual([0xaa, 0, 0, 3, 1, 0xbb]);
    expect(Array.from(rbspUnescape(escaped))).toEqual([...a, ...b]);
  });

  it('writes at a non-zero offset, leaving earlier bytes untouched', () => {
    const segments = [new Uint8Array([0, 0, 1])];
    const out = new Uint8Array(2 + rbspEscapedLength(segments));
    out[0] = 0x11;
    out[1] = 0x22;
    rbspEscapeInto(out, 2, segments);
    expect(Array.from(out)).toEqual([0x11, 0x22, 0, 0, 3, 1]);
  });
});

describe('codec clear-byte rules', () => {
  // The clear-byte count per codec, via the same profile.clearBytes path the
  // encoder uses (getClearByteCount delegate removed to save a hot-path frame).
  const clearBytes = (
    codec: string | undefined,
    frameType: string | undefined,
    data: Uint8Array,
  ) => getCodecProfile(codec).clearBytes(frameType, data);

  it('returns 1 for audio (undefined frameType)', () => {
    expect(clearBytes(undefined, undefined, new Uint8Array(50))).toBe(1);
    expect(clearBytes('opus', undefined, new Uint8Array(50))).toBe(1);
  });

  it('returns 10 for VP8/VP9 keyframes, 3 for delta', () => {
    expect(clearBytes('vp8', 'key', new Uint8Array(50))).toBe(10);
    expect(clearBytes('vp8', 'delta', new Uint8Array(50))).toBe(3);
    expect(clearBytes('vp9', 'key', new Uint8Array(50))).toBe(10);
    expect(clearBytes('vp9', 'delta', new Uint8Array(50))).toBe(3);
  });

  it('returns 0 for unknown codecs', () => {
    expect(clearBytes('unknown', 'delta', new Uint8Array(50))).toBe(0);
  });

  it('clamps VP8/VP9 clear bytes to the frame length', () => {
    // A frame shorter than the nominal clear-byte count must not claim more
    // clear bytes than it has (matches the H264 clamp). Otherwise encode builds
    // a zero-padded clear header and decode a length-mismatched AAD -> GCM
    // fails for a frame that should have round-tripped.
    expect(clearBytes('vp8', 'delta', new Uint8Array(2))).toBe(2);
    expect(clearBytes('vp9', 'key', new Uint8Array(5))).toBe(5);
  });

  it('returns clear bytes up to first slice NALU for H.264', () => {
    // Annex B: [00 00 00 01][SPS][00 00 00 01][slice NALU type 5][...]
    // SPS NALU type 7, slice IDR type 5.
    const sps = [0x00, 0x00, 0x00, 0x01, 0x67, 0x42, 0x00, 0x0a]; // 4-byte SC + 4 bytes
    const sliceSC = [0x00, 0x00, 0x00, 0x01]; // 4-byte SC at pos 8
    const sliceHeader = [0x65, 0xb8, 0x40]; // NALU type 5 + 2 bytes of slice header
    const payload = new Uint8Array([...sps, ...sliceSC, ...sliceHeader]);
    // Slice start at byte 8, start code length 4, so clear = 8 + 4 + 2 = 14.
    expect(clearBytes('h264', 'key', payload)).toBe(14);
  });

  it('returns 0 for H.264 with no slice NALU', () => {
    // Only SPS (type 7), no slice.
    const data = new Uint8Array([0x00, 0x00, 0x00, 0x01, 0x67, 0x42]);
    expect(clearBytes('h264', 'key', data)).toBe(0);
  });
});

describe('getCodecProfile', () => {
  it('marks only h264 for RBSP escaping and only av1 as the OBU scheme', () => {
    // The load-bearing invariant of the table: a codec is fully described in one
    // place, so a half-wired codec (e.g. NALU escaping forgotten) is impossible.
    expect(getCodecProfile('h264')).toMatchObject({
      scheme: 'trailer',
      rbsp: true,
    });
    expect(getCodecProfile('av1')).toMatchObject({
      scheme: 'av1',
      rbsp: false,
    });
    for (const codec of ['opus', 'vp8', 'vp9']) {
      expect(getCodecProfile(codec)).toMatchObject({
        scheme: 'trailer',
        rbsp: false,
      });
    }
  });

  it('falls back to a passthrough trailer profile for unknown / absent codecs', () => {
    for (const codec of [undefined, 'h265', 'video/vp8']) {
      expect(getCodecProfile(codec)).toMatchObject({
        scheme: 'trailer',
        rbsp: false,
      });
    }
  });
});

describe('isSupportedCodec', () => {
  it('accepts known codecs', () => {
    expect(isSupportedCodec('opus')).toBe(true);
    expect(isSupportedCodec('vp8')).toBe(true);
    expect(isSupportedCodec('vp9')).toBe(true);
    expect(isSupportedCodec('h264')).toBe(true);
    expect(isSupportedCodec('av1')).toBe(true);
  });

  it('accepts undefined (audio codec passthrough)', () => {
    expect(isSupportedCodec(undefined)).toBe(true);
  });

  it('rejects unknown or mis-cased codecs', () => {
    expect(isSupportedCodec('H264')).toBe(false);
    expect(isSupportedCodec('video/vp8')).toBe(false);
  });
});
