import { describe, expect, it } from 'vitest';
import {
  decryptAv1Frame,
  encryptAv1Frame,
  parseEncryptedAv1,
  readInlineHeader,
  writeInlineHeader,
} from '../e2ee-worker/av1';
import { AV1_INLINE_HEADER_LEN, IV_LEN } from '../e2ee-worker/constants';
import { fillIV } from '../e2ee-worker/crypto';
import {
  OBU_FRAME,
  applySalt,
  packSalt,
  parseObus,
  writeLeb128,
} from '../e2ee-worker/av1-obu';

describe('inline header', () => {
  const ivPrefix = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

  it('round-trips keyIndex, ivPrefix, frameCounter', () => {
    const buf = writeInlineHeader(7, ivPrefix, 0x01020304);
    expect(buf.length).toBe(AV1_INLINE_HEADER_LEN);
    const ih = readInlineHeader(buf);
    expect(ih).not.toBeNull();
    expect(ih!.keyIndex).toBe(7);
    expect(Array.from(ih!.ivPrefix)).toEqual(Array.from(ivPrefix));
    expect(ih!.frameCounter).toBe(0x01020304);
  });

  it('returns null when the magic does not match', () => {
    const buf = writeInlineHeader(0, ivPrefix, 1);
    buf[0] ^= 0xff;
    expect(readInlineHeader(buf)).toBeNull();
  });

  it('returns null on a short buffer', () => {
    expect(readInlineHeader(new Uint8Array(4))).toBeNull();
  });
});

const importKey = (raw: number[]) =>
  crypto.subtle.importKey(
    'raw',
    new Uint8Array(raw),
    { name: 'AES-GCM', length: 128 },
    false,
    ['encrypt', 'decrypt'],
  );

/** Build a coded-data OBU (type 6) with an extension header. */
const codedObu = (
  payload: number[],
  temporalId = 0,
  spatialId = 0,
): number[] => {
  const headerByte = (OBU_FRAME << 3) | 0x04 | 0x02; // ext + has_size
  const extByte = (temporalId << 5) | (spatialId << 3);
  return [
    headerByte,
    extByte,
    ...Array.from(writeLeb128(payload.length)),
    ...payload,
  ];
};

const td = [(2 << 3) | 0x02, 0x00]; // temporal delimiter, empty payload

describe('encryptAv1Frame / decryptAv1Frame', () => {
  const ivPrefix = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);

  it('round-trips a single-layer frame back to the original bytes', async () => {
    const key = await importKey([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
    const original = new Uint8Array([...td, ...codedObu([1, 2, 3, 4, 5])]);
    const enc = await encryptAv1Frame(original.slice(), key, 0, ivPrefix, 42);
    expect(enc).not.toBeNull();
    expect(enc).not.toEqual(original); // payload is now ciphertext
    const parsed = parseEncryptedAv1(enc!);
    expect(parsed).not.toBeNull();
    expect(parsed!.keyIndex).toBe(0);
    expect(parsed!.frameCounter).toBe(42);
    const dec = await decryptAv1Frame(parsed!, key);
    expect(Array.from(dec)).toEqual(Array.from(original));
  });

  it('survives the SFU dropping an enhancement layer', async () => {
    const key = await importKey([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
    const base = codedObu([1, 1, 1, 1], 0, 0);
    const enh = codedObu([2, 2, 2, 2], 0, 1);
    const enc = await encryptAv1Frame(
      new Uint8Array([...td, ...base, ...enh]),
      key,
      0,
      ivPrefix,
      7,
    );
    // Simulate the SFU forwarding only the base layer.
    const parsedFull = parseEncryptedAv1(enc!)!;
    const baseOnly = parsedFull.obus.filter((o) => o.spatialId === 0);
    const droppedFrame = { ...parsedFull, obus: baseOnly };
    const dec = await decryptAv1Frame(droppedFrame, key);
    const expected = new Uint8Array([...td, ...codedObu([1, 1, 1, 1], 0, 0)]);
    expect(Array.from(dec)).toEqual(Array.from(expected));
  });

  it('fails to decrypt when the extension header is tampered', async () => {
    const key = await importKey([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
    const enc = await encryptAv1Frame(
      new Uint8Array([...td, ...codedObu([5, 5, 5], 1, 1)]),
      key,
      0,
      ivPrefix,
      9,
    );
    const parsed = parseEncryptedAv1(enc!)!;
    // Flip a bit in the coded OBU's extension header byte (index 1 of its header).
    parsed.obus[1].header[1] ^= 0x20;
    await expect(decryptAv1Frame(parsed, key)).rejects.toBeTruthy();
  });

  it('fails to decrypt with the wrong key', async () => {
    const key = await importKey([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
    const wrong = await importKey([
      15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
    ]);
    const enc = await encryptAv1Frame(
      new Uint8Array([...td, ...codedObu([7, 7, 7])]),
      key,
      0,
      ivPrefix,
      3,
    );
    const parsed = parseEncryptedAv1(enc!)!;
    await expect(decryptAv1Frame(parsed, wrong)).rejects.toBeTruthy();
  });

  it('returns the frame unchanged when there are no coded OBUs', async () => {
    const key = await importKey([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
    const noCoded = new Uint8Array([...td]); // only a temporal delimiter
    const enc = await encryptAv1Frame(noCoded.slice(), key, 0, ivPrefix, 1);
    expect(Array.from(enc!)).toEqual(Array.from(noCoded));
    expect(parseEncryptedAv1(enc!)).toBeNull();
  });

  it('returns null for non-AV1 bytes', async () => {
    const key = await importKey([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
    expect(
      await encryptAv1Frame(new Uint8Array([0x80, 0x80]), key, 0, ivPrefix, 1),
    ).toBeNull();
    expect(parseEncryptedAv1(new Uint8Array([0x80, 0x80]))).toBeNull();
  });

  it('round-trips multiple tiles in the same layer with distinct IVs', async () => {
    const key = await importKey([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
    // Two coded OBUs with identical layer (0,0) and identical payload. The
    // per-layer tileIdx (0 then 1) must give them distinct IVs, so the two
    // ciphertexts differ even though the plaintext is the same.
    const tile0 = codedObu([9, 9, 9, 9], 0, 0);
    const tile1 = codedObu([9, 9, 9, 9], 0, 0);
    const original = new Uint8Array([...td, ...tile0, ...tile1]);
    const enc = await encryptAv1Frame(original.slice(), key, 0, ivPrefix, 5);
    const parsed = parseEncryptedAv1(enc!)!;
    expect(Array.from(parsed.obus[1].payload)).not.toEqual(
      Array.from(parsed.obus[2].payload),
    );
    const dec = await decryptAv1Frame(parseEncryptedAv1(enc!)!, key);
    expect(Array.from(dec)).toEqual(Array.from(original));
  });

  it('leaves a coded OBU without our inline header untouched on decrypt', async () => {
    const key = await importKey([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
    const enc = await encryptAv1Frame(
      new Uint8Array([...td, ...codedObu([1, 2, 3])]),
      key,
      0,
      ivPrefix,
      11,
    );
    const parsed = parseEncryptedAv1(enc!)!;
    // Append a plain (unencrypted) coded OBU that is not ours; decrypt must
    // pass it through verbatim rather than throw or corrupt it.
    parsed.obus.push({
      type: OBU_FRAME,
      header: new Uint8Array([(OBU_FRAME << 3) | 0x04 | 0x02, 0]),
      temporalId: 0,
      spatialId: 0,
      hasExtension: true,
      payload: new Uint8Array([7, 7, 7]),
    });
    const dec = await decryptAv1Frame(parsed, key);
    const obus = parseObus(dec)!;
    const payloads = obus.map((o) => Array.from(o.payload));
    expect(payloads).toContainEqual([1, 2, 3]); // decrypted OBU
    expect(payloads).toContainEqual([7, 7, 7]); // untouched plain OBU
  });

  it('survives dropping the base layer (enhancement-only, multi-tile)', async () => {
    const key = await importKey([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
    const base = codedObu([1, 1], 0, 0); // spatial 0
    const enhA = codedObu([2, 2, 2], 0, 1); // spatial 1, tile 0
    const enhB = codedObu([3, 3, 3], 0, 1); // spatial 1, tile 1
    const enc = await encryptAv1Frame(
      new Uint8Array([...td, ...base, ...enhA, ...enhB]),
      key,
      0,
      ivPrefix,
      13,
    );
    // SFU forwards only the enhancement layer: keep TD + the two spatial-1 OBUs,
    // drop the spatial-0 base. The per-layer tileIdx (0, 1) for spatial 1 must
    // be unaffected by the base layer's absence.
    const parsedFull = parseEncryptedAv1(enc!)!;
    const enhOnly = parsedFull.obus.filter(
      (o) => o.type === 2 || o.spatialId === 1,
    );
    const dec = await decryptAv1Frame({ ...parsedFull, obus: enhOnly }, key);
    const expected = new Uint8Array([
      ...td,
      ...codedObu([2, 2, 2], 0, 1),
      ...codedObu([3, 3, 3], 0, 1),
    ]);
    expect(Array.from(dec)).toEqual(Array.from(expected));
  });

  it('base-layer IV equals the v2 IV at the same counter (shared-counter contract)', () => {
    // Documents WHY AV1 must draw frameCounter from the same nextFrameCounter
    // as v2: a base-layer OBU (salt 0) builds the byte-identical IV to a v2
    // frame at the same counter, so only the never-repeating shared counter
    // prevents (key, IV) reuse across a user's AV1 and non-AV1 tracks.
    const prefix = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);
    const counter = 12345;
    const v2Iv = new Uint8Array(IV_LEN);
    fillIV(v2Iv, new DataView(v2Iv.buffer), prefix, counter);
    const av1BaseIv = new Uint8Array(IV_LEN);
    fillIV(
      av1BaseIv,
      new DataView(av1BaseIv.buffer),
      applySalt(prefix, packSalt(0, 0, 0)),
      counter,
    );
    expect(Array.from(av1BaseIv)).toEqual(Array.from(v2Iv));
  });
});
