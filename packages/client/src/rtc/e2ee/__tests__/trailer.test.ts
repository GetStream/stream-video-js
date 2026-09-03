import { describe, expect, it } from 'vitest';
import {
  IV_PREFIX_LEN,
  MAX_CLEAR_BYTES,
  TRAILER_LEN,
} from '../e2ee-worker/constants';
import {
  readFramingVersion,
  readTrailer,
  writeTrailer,
} from '../e2ee-worker/trailer';

const makeFrame = (bodyLen: number): Uint8Array =>
  new Uint8Array(bodyLen + TRAILER_LEN);

const randomPrefix = (): Uint8Array => {
  const p = new Uint8Array(IV_PREFIX_LEN);
  for (let i = 0; i < p.length; i++) p[i] = (i * 17 + 3) & 0xff;
  return p;
};

describe('writeTrailer + readTrailer', () => {
  it.each([
    ['without the RBSP flag', false],
    ['with the RBSP flag', true],
  ])('round-trips the full payload %s', (_label, isRbsp) => {
    const body = 32;
    const dst = makeFrame(body);
    const prefix = randomPrefix();
    writeTrailer(dst, body, 123456, prefix, 7, 10, isRbsp);

    const trailer = readTrailer(dst);
    expect(trailer).not.toBeNull();
    expect(trailer!.frameCounter).toBe(123456);
    expect(trailer!.keyIndex).toBe(7);
    expect(trailer!.clearBytes).toBe(10);
    expect(trailer!.isRbsp).toBe(isRbsp);
    expect(Array.from(trailer!.ivPrefix)).toEqual(Array.from(prefix));
  });

  it('rejects a trailer it could not encode', () => {
    const dst = makeFrame(100);
    expect(() =>
      writeTrailer(dst, 100, 1, randomPrefix(), 0, MAX_CLEAR_BYTES + 1, false),
    ).toThrow(/15-bit/);
    expect(() =>
      writeTrailer(dst, 20, 1, new Uint8Array(IV_PREFIX_LEN - 1), 0, 0, false),
    ).toThrow(/ivPrefix/);
  });

  // Anything unrecognized means "not our trailer", so the frame is forwarded as
  // cleartext rather than sent to a decrypt that would fail. The exact bytes of
  // a valid trailer are pinned by the SPEC vectors in conformance.test.ts.
  it.each([
    [
      'the frame is shorter than a trailer',
      () => new Uint8Array(TRAILER_LEN - 1),
    ],
    [
      'the magic does not match',
      (f: Uint8Array) => {
        f[f.length - 1] ^= 0x01;
        return f;
      },
    ],
    [
      'the version is unknown',
      (f: Uint8Array) => {
        f[f.length - 5] = 99;
        return f;
      },
    ],
    [
      'the declared clearBytes overruns the body',
      (f: Uint8Array) => {
        // Still inside the 15-bit limit, so only the length check catches it.
        new DataView(f.buffer).setUint16(f.length - 7, 6);
        return f;
      },
    ],
  ])('returns null when %s', (_label, corrupt) => {
    const body = 5;
    const dst = makeFrame(body);
    writeTrailer(dst, body, 1, randomPrefix(), 0, 0, false);
    expect(readTrailer(corrupt(dst))).toBeNull();
  });
});

// The identification suffix is frozen across versions, so this must keep
// working against a frame written by a version this build knows nothing about.
describe('readFramingVersion', () => {
  const framed = (): Uint8Array => {
    const body = 5;
    const dst = makeFrame(body);
    writeTrailer(dst, body, 1, randomPrefix(), 0, 0, false);
    return dst;
  };

  // Frozen across every version (SPEC 5.2): an older receiver identifies our
  // frames from these 5 bytes alone, so a layout change that moves them has to
  // fail here rather than silently strand those receivers. Literal values on
  // purpose - reading them from the constants would move with the break.
  it('pins the identification suffix to the last 5 bytes written', () => {
    const dst = framed();
    const view = new DataView(dst.buffer);
    expect(dst[dst.length - 5]).toBe(1);
    expect(view.getUint32(dst.length - 4)).toBe(0xe2eefeed);
  });

  it('reports the version of a frame carrying our framing', () => {
    expect(readFramingVersion(framed())).toBe(1);
  });

  it('accepts a caller-supplied view over the same bytes', () => {
    const dst = framed();
    const view = new DataView(dst.buffer, dst.byteOffset, dst.byteLength);
    expect(readFramingVersion(dst, view)).toBe(readFramingVersion(dst));
  });

  it('reports a version this build cannot read, where readTrailer only says null', () => {
    const future = framed();
    future[future.length - 5] = 99;
    expect(readFramingVersion(future)).toBe(99);
    expect(readTrailer(future)).toBeNull();
  });

  it('reads the suffix from the end, so a longer future trailer still resolves', () => {
    const grown = new Uint8Array(framed().length + 4);
    const src = framed();
    // Simulate a v2 trailer with 4 extra bytes ahead of the frozen suffix.
    grown.set(src.subarray(0, src.length - 5), 0);
    grown.set(src.subarray(src.length - 5), grown.length - 5);
    grown[grown.length - 5] = 2;
    expect(readFramingVersion(grown)).toBe(2);
  });

  it('returns null when the frame is not ours', () => {
    const notOurs = framed();
    notOurs[notOurs.length - 1] ^= 0x01;
    expect(readFramingVersion(notOurs)).toBeNull();
    expect(readFramingVersion(new Uint8Array(4))).toBeNull();
  });
});
