import { describe, expect, it } from 'vitest';
import {
  getClearByteCount,
  isSupportedCodec,
  rbspEscape,
  rbspUnescape,
} from '../e2ee-worker/codec';

describe('rbspEscape + rbspUnescape', () => {
  const roundTrip = (input: number[]) => {
    const data = new Uint8Array(input);
    const escaped = rbspEscape(data);
    const unescaped = rbspUnescape(escaped);
    return { escaped, unescaped: Array.from(unescaped) };
  };

  it('is identity when no escape needed', () => {
    const { escaped } = roundTrip([1, 2, 3, 4, 5]);
    // No zero pairs → the function returns the SAME underlying buffer.
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

describe('getClearByteCount', () => {
  it('returns 1 for audio (undefined frameType)', () => {
    expect(getClearByteCount(undefined, undefined, new Uint8Array(50))).toBe(1);
    expect(getClearByteCount('opus', undefined, new Uint8Array(50))).toBe(1);
  });

  it('returns 10 for VP8 keyframes, 3 for delta', () => {
    expect(getClearByteCount('vp8', 'key', new Uint8Array(50))).toBe(10);
    expect(getClearByteCount('vp8', 'delta', new Uint8Array(50))).toBe(3);
  });

  it('returns 0 for VP9 and unknown codecs', () => {
    expect(getClearByteCount('vp9', 'key', new Uint8Array(50))).toBe(0);
    expect(getClearByteCount('unknown', 'delta', new Uint8Array(50))).toBe(0);
  });

  it('returns clear bytes up to first slice NALU for H.264', () => {
    // Annex B: [00 00 00 01][SPS][00 00 00 01][slice NALU type 5][...]
    // SPS NALU type 7, slice IDR type 5.
    const sps = [0x00, 0x00, 0x00, 0x01, 0x67, 0x42, 0x00, 0x0a]; // 4-byte SC + 4 bytes
    const sliceSC = [0x00, 0x00, 0x00, 0x01]; // 4-byte SC at pos 8
    const sliceHeader = [0x65, 0xb8, 0x40]; // NALU type 5 + 2 bytes of slice header
    const payload = new Uint8Array([...sps, ...sliceSC, ...sliceHeader]);
    // Slice start at byte 8, start code length 4, so clear = 8 + 4 + 2 = 14.
    expect(getClearByteCount('h264', 'key', payload)).toBe(14);
  });

  it('returns 0 for H.264 with no slice NALU', () => {
    // Only SPS (type 7), no slice.
    const data = new Uint8Array([0x00, 0x00, 0x00, 0x01, 0x67, 0x42]);
    expect(getClearByteCount('h264', 'key', data)).toBe(0);
  });
});

describe('isSupportedCodec', () => {
  it('accepts known codecs', () => {
    expect(isSupportedCodec('opus')).toBe(true);
    expect(isSupportedCodec('vp8')).toBe(true);
    expect(isSupportedCodec('vp9')).toBe(true);
    expect(isSupportedCodec('h264')).toBe(true);
  });

  it('accepts undefined (audio codec passthrough)', () => {
    expect(isSupportedCodec(undefined)).toBe(true);
  });

  it('rejects unknown or mis-cased codecs', () => {
    expect(isSupportedCodec('av1')).toBe(false);
    expect(isSupportedCodec('H264')).toBe(false);
    expect(isSupportedCodec('video/vp8')).toBe(false);
  });
});
