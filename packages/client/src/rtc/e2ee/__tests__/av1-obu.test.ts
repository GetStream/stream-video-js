import { describe, expect, it } from 'vitest';
import {
  OBU_FRAME,
  OBU_TILE_GROUP,
  applySalt,
  packSalt,
  parseObus,
  readLeb128,
  serializeObus,
  writeLeb128,
} from '../e2ee-worker/av1-obu';

/** Build a single OBU: header byte (+ ext) + LEB128 size + payload. */
const makeObu = (
  type: number,
  payload: number[],
  opts: { ext?: boolean; temporalId?: number; spatialId?: number } = {},
): number[] => {
  const ext = opts.ext ?? false;
  // forbidden(0) type(4) ext_flag(1) has_size(1) reserved(0)
  const headerByte = (type << 3) | (ext ? 0x04 : 0) | 0x02;
  const bytes = [headerByte];
  if (ext) {
    bytes.push(((opts.temporalId ?? 0) << 5) | ((opts.spatialId ?? 0) << 3));
  }
  bytes.push(...Array.from(writeLeb128(payload.length)));
  bytes.push(...payload);
  return bytes;
};

describe('LEB128', () => {
  it('round-trips boundary values', () => {
    // Includes 4-byte (268435455) and 5-byte (268435456) values to exercise
    // the multiplication path that avoids a 32-bit shift wrap on the 5th group.
    for (const v of [
      0, 1, 127, 128, 16383, 16384, 2097151, 2097152, 268435455, 268435456,
    ]) {
      const enc = writeLeb128(v);
      const dec = readLeb128(enc, 0);
      expect(dec).toEqual({ value: v, length: enc.length });
    }
  });

  it('uses 1 byte below 128 and 2 bytes at 128', () => {
    expect(writeLeb128(127).length).toBe(1);
    expect(writeLeb128(128).length).toBe(2);
  });

  it('returns null on truncated input', () => {
    expect(readLeb128(new Uint8Array([0x80]), 0)).toBeNull();
  });

  it('reads from a non-zero offset', () => {
    // [pad, pad, 0x80, 0x01] => value 128 starting at offset 2
    expect(readLeb128(new Uint8Array([0xff, 0xff, 0x80, 0x01]), 2)).toEqual({
      value: 128,
      length: 2,
    });
  });
});

describe('parseObus', () => {
  it('parses a temporal-unit with a frame OBU carrying an extension header', () => {
    const td = makeObu(2, []); // temporal delimiter
    const frame = makeObu(OBU_FRAME, [0xaa, 0xbb, 0xcc], {
      ext: true,
      temporalId: 2,
      spatialId: 1,
    });
    const obus = parseObus(new Uint8Array([...td, ...frame]));
    expect(obus).not.toBeNull();
    expect(obus!.length).toBe(2);
    expect(obus![0].type).toBe(2);
    expect(obus![1].type).toBe(OBU_FRAME);
    expect(obus![1].hasExtension).toBe(true);
    expect(obus![1].temporalId).toBe(2);
    expect(obus![1].spatialId).toBe(1);
    expect(Array.from(obus![1].payload)).toEqual([0xaa, 0xbb, 0xcc]);
  });

  it('returns null when an OBU lacks the size field', () => {
    // header byte with has_size_field = 0
    const headerByte = (OBU_TILE_GROUP << 3) | 0x00;
    expect(parseObus(new Uint8Array([headerByte, 0x01, 0x02]))).toBeNull();
  });

  it('returns null on truncated payload', () => {
    const headerByte = (OBU_TILE_GROUP << 3) | 0x02;
    // size says 5 bytes but only 2 follow
    expect(parseObus(new Uint8Array([headerByte, 5, 0x01, 0x02]))).toBeNull();
  });

  it('returns null when the forbidden bit is set (not AV1)', () => {
    expect(parseObus(new Uint8Array([0x80, 0x00]))).toBeNull();
  });
});

describe('packSalt + applySalt', () => {
  it('packs spatial/temporal/tile into 16 bits', () => {
    // spatial=1 (<<14), temporal=2 (<<11), tile=3
    expect(packSalt(1, 2, 3)).toBe((1 << 14) | (2 << 11) | 3);
  });

  it('base layer (0,0,0) packs to 0', () => {
    expect(packSalt(0, 0, 0)).toBe(0);
  });

  it('XORs the salt into the low 2 prefix bytes only', () => {
    const prefix = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const salt = 0x5003; // hi=0x50, lo=0x03
    const salted = applySalt(prefix, salt);
    expect(Array.from(salted)).toEqual([1, 2, 3, 4, 5, 6, 7 ^ 0x50, 8 ^ 0x03]);
    // original is untouched
    expect(Array.from(prefix)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('base-layer salt leaves the prefix unchanged', () => {
    const prefix = new Uint8Array([9, 9, 9, 9, 9, 9, 9, 9]);
    expect(Array.from(applySalt(prefix, packSalt(0, 0, 0)))).toEqual(
      Array.from(prefix),
    );
  });

  it('produces a distinct salted prefix for every distinct layer/tile', () => {
    // The load-bearing IV-uniqueness invariant: distinct (spatial, temporal,
    // tile) must never collide into the same salted prefix within a frame.
    const prefix = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const seen = new Set<string>();
    for (let s = 0; s < 4; s++) {
      for (let t = 0; t < 8; t++) {
        for (let tile = 0; tile < 16; tile++) {
          const hex = Array.from(applySalt(prefix, packSalt(s, t, tile))).join(
            ',',
          );
          expect(seen.has(hex)).toBe(false);
          seen.add(hex);
        }
      }
    }
    expect(seen.size).toBe(4 * 8 * 16);
  });
});

describe('serializeObus', () => {
  it('round-trips through parse -> serialize', () => {
    const td = makeObu(2, []);
    const frame = makeObu(OBU_FRAME, [1, 2, 3, 4], {
      ext: true,
      temporalId: 1,
    });
    const input = new Uint8Array([...td, ...frame]);
    const obus = parseObus(input);
    const out = serializeObus(obus!);
    expect(Array.from(out)).toEqual(Array.from(input));
  });

  it('forces has_size_field and re-emits a resized payload', () => {
    const frame = makeObu(OBU_FRAME, [1, 2, 3]);
    const obus = parseObus(new Uint8Array(frame))!;
    obus[0].payload = new Uint8Array([9, 9, 9, 9, 9]); // grew from 3 to 5
    const out = serializeObus(obus);
    const reparsed = parseObus(out)!;
    expect(Array.from(reparsed[0].payload)).toEqual([9, 9, 9, 9, 9]);
    // has_size_field bit set on the emitted header
    expect(out[0] & 0x02).toBe(0x02);
  });

  it('does not mutate the source OBU header', () => {
    // Header byte without the size-field bit; serializeObus must not flip it
    // on the original Obu object (it should copy before setting the bit).
    const obus = [
      {
        type: OBU_FRAME,
        header: new Uint8Array([(OBU_FRAME << 3) & 0xff]), // has_size bit = 0
        temporalId: 0,
        spatialId: 0,
        hasExtension: false,
        payload: new Uint8Array([1, 2, 3]),
      },
    ];
    const before = obus[0].header[0];
    serializeObus(obus);
    expect(obus[0].header[0]).toBe(before);
  });
});
