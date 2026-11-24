import { decodeUtf8 } from '../src/utils/internal/utf8TextDecoder';

const native = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
const encoder = new TextEncoder();

describe('decodeUtf8', () => {
  it.each([
    ['empty', ''],
    ['ASCII', 'participant-id_42:~ \t\r\n\0'],
    ['2-byte sequences', 'żółć ñandú Ελληνικά \u0080߿'],
    ['3-byte sequences', '日本語 한국어 € ࠀ퟿￿'],
    ['4-byte sequences', '\u{10000}\u{1f600}\u{10ffff}'],
    ['emoji with joiners', '👨‍👩‍👧‍👦 🏳️‍🌈 👍🏽'],
    ['a leading BOM', '﻿with a BOM'],
    ['a BOM in the middle', 'with ﻿ a BOM'],
  ])('should decode %s like the native decoder', (_, text) => {
    const bytes = encoder.encode(text);
    expect(decodeUtf8(bytes)).toBe(native.decode(bytes));
    expect(decodeUtf8(bytes)).toBe(text);
  });

  it('should decode without an input', () => {
    expect(decodeUtf8()).toBe('');
  });

  it('should respect the bounds of a subarray', () => {
    const bytes = encoder.encode('__héllo 👋__');
    const view = bytes.subarray(2, bytes.length - 2);
    expect(decodeUtf8(view)).toBe('héllo 👋');
  });

  it('should decode every code point like the native decoder', () => {
    let text = '';
    for (let codePoint = 0; codePoint <= 0x10ffff; codePoint++) {
      if (codePoint >= 0xd800 && codePoint <= 0xdfff) continue;
      text += String.fromCodePoint(codePoint);
    }
    const bytes = encoder.encode(text);
    const decoded = decodeUtf8(bytes);
    expect(decoded === native.decode(bytes)).toBe(true);
    expect(decoded === text).toBe(true);
  });

  it.each([
    ['ASCII', 'a=candidate:1 1 udp 2122260223 192.168.1.2 54321 typ host\r\n'],
    ['mixed', 'aé日😀'],
  ])('should decode long %s strings', (_, pattern) => {
    // sequences straddle the chunk boundary with the shifted variants
    for (const prefix of ['', 'x', 'xx', 'xxx']) {
      const text = prefix + pattern.repeat(300_000);
      const bytes = encoder.encode(text);
      expect(decodeUtf8(bytes) === text).toBe(true);
    }
  });

  it.each<[string, number[]]>([
    ['truncated 2-byte sequence', [0x61, 0xc3]],
    ['truncated 3-byte sequence', [0xe2, 0x82]],
    ['truncated 4-byte sequence', [0xf0, 0x9f, 0x98]],
    ['lone continuation byte', [0x80]],
    ['continuation byte after ASCII', [0x61, 0xbf, 0x62]],
    ['missing continuation byte', [0xc3, 0x28]],
    ['missing second continuation byte', [0xe2, 0x82, 0x28]],
    ['missing third continuation byte', [0xf0, 0x9f, 0x98, 0x28]],
    ['overlong 2-byte encoding (0xc0)', [0xc0, 0xaf]],
    ['overlong 2-byte encoding (0xc1)', [0xc1, 0xbf]],
    ['overlong 3-byte encoding', [0xe0, 0x80, 0xaf]],
    ['overlong 3-byte encoding, upper bound', [0xe0, 0x9f, 0xbf]],
    ['overlong 4-byte encoding', [0xf0, 0x80, 0x80, 0xaf]],
    ['overlong 4-byte encoding, upper bound', [0xf0, 0x8f, 0xbf, 0xbf]],
    ['encoded high surrogate', [0xed, 0xa0, 0x80]],
    ['encoded low surrogate', [0xed, 0xbf, 0xbf]],
    ['encoded surrogate pair', [0xed, 0xa0, 0xbd, 0xed, 0xb8, 0x80]],
    ['code point above U+10FFFF', [0xf4, 0x90, 0x80, 0x80]],
    ['lead byte 0xf5', [0xf5, 0x80, 0x80, 0x80]],
    ['5-byte sequence', [0xf8, 0x88, 0x80, 0x80, 0x80]],
    ['byte 0xfe', [0xfe]],
    ['byte 0xff', [0xff]],
  ])('should throw on malformed input: %s', (_, input) => {
    const bytes = new Uint8Array(input);
    // thrown outside of the jest sandbox, so not an instance of its TypeError
    expect(() => native.decode(bytes)).toThrow('not valid');
    expect(() => decodeUtf8(bytes)).toThrow(TypeError);
  });

  it('should agree with the native decoder on random bytes', () => {
    // deterministic, biased towards multi-byte lead and continuation bytes
    let seed = 0x2f6e2b1;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    const pool = [0x24, 0x7f, 0x80, 0x8f, 0x90, 0x9f, 0xa0, 0xbf, 0xc2, 0xdf];
    pool.push(0xe0, 0xe1, 0xec, 0xed, 0xee, 0xef, 0xf0, 0xf1, 0xf3, 0xf4, 0xf5);
    for (let round = 0; round < 50_000; round++) {
      const bytes = new Uint8Array(1 + Math.floor(random() * 6));
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = pool[Math.floor(random() * pool.length)] ?? 0;
      }
      let expected: string | undefined;
      try {
        expected = native.decode(bytes);
      } catch {
        expected = undefined;
      }
      let actual: string | undefined;
      try {
        actual = decodeUtf8(bytes);
      } catch {
        actual = undefined;
      }
      if (actual !== expected) {
        throw new Error(`Mismatch for [${Array.from(bytes).join(', ')}]`);
      }
    }
  });
});
