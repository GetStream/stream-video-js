import { describe, expect, it } from 'vitest';
import {
  boundarySeedZeros,
  getCodecProfile,
  isSupportedCodec,
  rbspEscapeInto,
  rbspEscapedLength,
  rbspUnescape,
} from '../e2ee-worker/codec';

// Single-buffer escape helper. Production only ever escapes the
// [ciphertext, trailer] segment pair via rbspEscapedLength + rbspEscapeInto, so
// this convenience wrapper lives in the test rather than the shipped worker.
const rbspEscape = (data: Uint8Array, seedZeros = 0): Uint8Array => {
  const out = new Uint8Array(rbspEscapedLength([data], seedZeros));
  rbspEscapeInto(out, 0, [data], seedZeros);
  return out;
};

describe('rbspEscape + rbspUnescape', () => {
  // deterministic "random" to exercise many byte values
  const pseudoRandom = Array.from({ length: 256 }, (_, i) => (i * 31) & 0xff);

  it.each([
    ['no escapable sequence', [1, 2, 3, 4, 5]],
    ['a run of zeros', [0, 0, 0, 0, 0, 0]],
    ['mixed content', [0xaa, 0, 0, 1, 0xbb, 0xcc, 0, 0, 2, 0xdd]],
    ['empty input', []],
    ['a 256-byte buffer', pseudoRandom],
  ])('round-trips %s', (_label, input) => {
    const escaped = rbspEscape(new Uint8Array(input));
    expect(Array.from(rbspUnescape(escaped, 0))).toEqual(input);
  });

  it('is byte-identical when nothing needs escaping', () => {
    // No zero pairs → no emulation-prevention bytes inserted.
    expect(rbspEscape(new Uint8Array([1, 2, 3, 4, 5]))).toEqual(
      new Uint8Array([1, 2, 3, 4, 5]),
    );
  });

  it('inserts 0x03 between 00 00 and 00-03', () => {
    // [0, 0, 1] → [0, 0, 3, 1]
    const out = rbspEscape(new Uint8Array([0, 0, 1]));
    expect(Array.from(out)).toEqual([0, 0, 3, 1]);
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

  const escapeSegments = (segs: number[][], seedZeros = 0) => {
    const segments = segs.map((s) => new Uint8Array(s));
    const out = new Uint8Array(rbspEscapedLength(segments, seedZeros));
    rbspEscapeInto(out, 0, segments, seedZeros);
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
    expect(Array.from(rbspUnescape(escaped, 0))).toEqual([...a, ...b]);
  });

  it('writes at a non-zero offset, leaving earlier bytes untouched', () => {
    const segments = [new Uint8Array([0, 0, 1])];
    const out = new Uint8Array(2 + rbspEscapedLength(segments, 0));
    out[0] = 0x11;
    out[1] = 0x22;
    rbspEscapeInto(out, 2, segments, 0);
    expect(Array.from(out)).toEqual([0x11, 0x22, 0, 0, 3, 1]);
  });
});

describe('boundary seeding (clear header ending in zeros)', () => {
  // The encoder never escapes the clear header itself, but on the wire the
  // header's tail and the escaped unit are contiguous. Seeding the escaper
  // with the header's trailing zeros keeps a start code from forming across
  // that boundary, e.g. header ...00 + ciphertext 00 01 -> 00 00 01.

  it('boundarySeedZeros counts trailing zeros, capped at 2', () => {
    expect(boundarySeedZeros(new Uint8Array([1, 2, 3]))).toBe(0);
    expect(boundarySeedZeros(new Uint8Array([1, 2, 0]))).toBe(1);
    expect(boundarySeedZeros(new Uint8Array([1, 0, 0]))).toBe(2);
    expect(boundarySeedZeros(new Uint8Array([0, 0, 0, 0]))).toBe(2);
    expect(boundarySeedZeros(new Uint8Array([0]))).toBe(1);
    expect(boundarySeedZeros(new Uint8Array([]))).toBe(0);
  });

  it('escapes a start code forming across the clear/encrypted boundary', () => {
    // Header ends in one 0x00 (seed 1); the unit starts 00 01. Unseeded this
    // would ship ...00 | 00 01 (a 3-byte start code); seeded, an escape byte
    // lands before the 01.
    const escaped = rbspEscape(new Uint8Array([0, 1, 0xbb]), 1);
    expect(Array.from(escaped)).toEqual([0, 3, 1, 0xbb]);
    expect(Array.from(rbspUnescape(escaped, 1))).toEqual([0, 1, 0xbb]);
  });

  it('escapes the very first unit byte when the header ends in 00 00', () => {
    const escaped = rbspEscape(new Uint8Array([1, 0xbb]), 2);
    expect(Array.from(escaped)).toEqual([3, 1, 0xbb]);
    expect(Array.from(rbspUnescape(escaped, 2))).toEqual([1, 0xbb]);
  });

  it('leaves a safe boundary alone', () => {
    // The unit starts with a non-start-code byte; nothing to escape.
    const escaped = rbspEscape(new Uint8Array([0xaa, 0, 1]), 2);
    expect(Array.from(escaped)).toEqual([0xaa, 0, 1]);
    expect(Array.from(rbspUnescape(escaped, 2))).toEqual([0xaa, 0, 1]);
  });

  it('round-trips with any seed on content needing internal escapes', () => {
    const input = [0, 0, 1, 0xaa, 0, 0, 0, 2, 0xbb];
    for (const seed of [0, 1, 2]) {
      const escaped = rbspEscape(new Uint8Array(input), seed);
      expect(Array.from(rbspUnescape(escaped, seed))).toEqual(input);
    }
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

  // Annex B: [00 00 00 01][SPS][00 00 00 01][slice NALU type 5][...]. The slice
  // start code sits at byte 8 and is 4 bytes long, so clear = 8 + 4 + 2 = 14.
  const h264Idr = new Uint8Array([
    0x00, 0x00, 0x00, 0x01, 0x67, 0x42, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x01,
    0x65, 0xb8, 0x40,
  ]);
  // Only SPS (type 7), so no slice NALU to end the clear header on.
  const h264NoSlice = new Uint8Array([0x00, 0x00, 0x00, 0x01, 0x67, 0x42]);
  const big = new Uint8Array(50);

  it.each([
    // Audio is identified by the absence of a key/delta type; the Opus TOC
    // byte stays clear so the SFU can read it.
    ['audio, codec unlabeled', undefined, undefined, big, 1],
    ['audio, opus', 'opus', undefined, big, 1],
    ['vp8 keyframe', 'vp8', 'key', big, 10],
    ['vp8 delta', 'vp8', 'delta', big, 3],
    ['vp9 keyframe', 'vp9', 'key', big, 10],
    ['vp9 delta', 'vp9', 'delta', big, 3],
    // A frame shorter than the nominal count must not claim more clear bytes
    // than it has, or encode zero-pads the header and decode builds an AAD of
    // a different length, failing GCM for a frame that should round-trip.
    ['vp8 delta shorter than 3 bytes', 'vp8', 'delta', new Uint8Array(2), 2],
    ['vp9 keyframe shorter than 10 bytes', 'vp9', 'key', new Uint8Array(5), 5],
    ['h264 up to the first slice NALU', 'h264', 'key', h264Idr, 14],
    ['h264 with no slice NALU', 'h264', 'key', h264NoSlice, 0],
    ['an unknown codec', 'unknown', 'delta', big, 0],
  ])('%s -> %s clear bytes', (_label, codec, frameType, data, expected) => {
    expect(clearBytes(codec, frameType, data)).toBe(expected);
  });
});

describe('getCodecProfile', () => {
  it('marks only h264 for RBSP escaping', () => {
    // The load-bearing invariant of the table: a codec is fully described in one
    // place, so a half-wired codec (e.g. NALU escaping forgotten) is impossible.
    expect(getCodecProfile('h264')).toMatchObject({ rbsp: true });
    for (const codec of ['opus', 'vp8', 'vp9']) {
      expect(getCodecProfile(codec)).toMatchObject({ rbsp: false });
    }
  });

  it('falls back to a passthrough profile for unknown / absent codecs', () => {
    for (const codec of [undefined, 'h265', 'video/vp8']) {
      expect(getCodecProfile(codec)).toMatchObject({ rbsp: false });
    }
  });

  it('does not resolve Object.prototype members to a profile', () => {
    // Looked up with `in` rather than Object.hasOwn, 'toString' resolves to a
    // function: getCodecProfile returns it and profile.clearBytes is undefined,
    // so every frame on that track throws inside the encode path.
    for (const codec of ['toString', 'constructor', 'valueOf', '__proto__']) {
      expect(getCodecProfile(codec)).toBe(getCodecProfile('no-such-codec'));
      expect(typeof getCodecProfile(codec).clearBytes).toBe('function');
    }
  });
});

describe('isSupportedCodec', () => {
  it('accepts the known codecs, and undefined for unlabeled audio', () => {
    for (const codec of ['opus', 'vp8', 'vp9', 'h264', undefined]) {
      expect(isSupportedCodec(codec)).toBe(true);
    }
  });

  it('rejects unknown or mis-cased codecs', () => {
    expect(isSupportedCodec('H264')).toBe(false);
    expect(isSupportedCodec('video/vp8')).toBe(false);
  });

  it('rejects Object.prototype members', () => {
    // `codec in CODEC_PROFILES` walks the prototype chain and would report
    // these as supported, sending the track down the encode path with no
    // usable profile behind it.
    for (const codec of [
      'toString',
      'constructor',
      'valueOf',
      'hasOwnProperty',
    ])
      expect(isSupportedCodec(codec)).toBe(false);
  });

  it('rejects av1, which has no E2EE framing scheme yet', () => {
    // The encode path turns this into a fail-closed transform: every frame is
    // dropped and e2ee.encryption_failed is emitted, so an AV1 track can never
    // be published in the clear on an encrypted call.
    expect(isSupportedCodec('av1')).toBe(false);
  });
});
