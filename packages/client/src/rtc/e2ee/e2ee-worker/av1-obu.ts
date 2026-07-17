/**
 * AV1 OBU (Open Bitstream Unit) parsing and serialization.
 *
 * Pure, crypto-free helpers for walking an AV1 temporal unit's OBU stream and
 * re-emitting it. The E2EE worker uses these to encrypt only the coded-data
 * OBUs (tile group / frame) while leaving framing intact. See ./av1.ts.
 *
 * Only the "low overhead bitstream format" is supported (every OBU carries
 * obu_has_size_field); anything else makes parseObus return null so the caller
 * treats the frame as non-AV1 / unencryptable.
 */

/** obu_type values (AV1 spec). */
export const OBU_TILE_GROUP = 4;
export const OBU_FRAME = 6;

/** OBU types whose payload carries coded pixel data and gets encrypted. */
export const AV1_ENCRYPTED_OBU_TYPES = new Set<number>([
  OBU_TILE_GROUP,
  OBU_FRAME,
]);

export interface Obu {
  /** obu_type (4-bit field from the header byte). */
  type: number;
  /** The 1- or 2-byte OBU header (header byte + optional extension byte). */
  header: Uint8Array;
  /** temporal_id from the extension header, or 0 when absent. */
  temporalId: number;
  /** spatial_id from the extension header, or 0 when absent. */
  spatialId: number;
  /** Whether an extension header byte is present. */
  hasExtension: boolean;
  /** OBU payload (mutable; replaced with ciphertext during encryption). */
  payload: Uint8Array;
  /**
   * Optional bytes serialized immediately before {@link payload}, counted in
   * obu_size. Lets the encryptor prepend the inline header without copying the
   * ciphertext to splice it on (see encryptAv1Frame).
   */
  prefix?: Uint8Array;
}

/**
 * Read a LEB128 unsigned integer (little-endian 7-bit groups, MSB =
 * continuation; AV1 caps it at 8 bytes). Multiplication avoids the 32-bit
 * wrap that `<<` would hit on the 5th group. Returns null on truncation or a
 * missing terminator.
 */
export const readLeb128 = (
  data: Uint8Array,
  offset: number,
): { value: number; length: number } | null => {
  let value = 0;
  for (let i = 0; i < 8; i++) {
    if (offset + i >= data.length) return null;
    const byte = data[offset + i];
    value += (byte & 0x7f) * 2 ** (i * 7);
    if ((byte & 0x80) === 0) return { value, length: i + 1 };
  }
  return null;
};

/** Encode an unsigned integer as LEB128. */
export const writeLeb128 = (value: number): Uint8Array => {
  if (value < 0) throw new Error('writeLeb128: negative value');
  const bytes: number[] = [];
  let v = value;
  do {
    let b = v % 128;
    v = Math.floor(v / 128);
    if (v > 0) b |= 0x80;
    bytes.push(b);
  } while (v > 0);
  return new Uint8Array(bytes);
};

/**
 * Parse a temporal unit into its OBUs. Returns null if the byte stream is not
 * valid low-overhead AV1 (forbidden bit set, missing size field, truncated).
 * Payloads are views into `data` (no copy).
 */
export const parseObus = (data: Uint8Array): Obu[] | null => {
  const obus: Obu[] = [];
  let pos = 0;
  while (pos < data.length) {
    const headerByte = data[pos];
    if ((headerByte & 0x80) !== 0) return null; // obu_forbidden_bit
    if ((headerByte & 0x01) !== 0) return null; // obu_reserved_1bit
    const type = (headerByte >> 3) & 0x0f;
    const hasExtension = (headerByte & 0x04) !== 0;
    const hasSizeField = (headerByte & 0x02) !== 0;
    let headerLen = 1;
    let temporalId = 0;
    let spatialId = 0;
    if (hasExtension) {
      if (pos + 1 >= data.length) return null;
      const ext = data[pos + 1];
      temporalId = (ext >> 5) & 0x07;
      spatialId = (ext >> 3) & 0x03;
      headerLen = 2;
    }
    if (!hasSizeField) return null;
    const sizeStart = pos + headerLen;
    const leb = readLeb128(data, sizeStart);
    if (!leb) return null;
    const payloadStart = sizeStart + leb.length;
    const payloadEnd = payloadStart + leb.value;
    if (payloadEnd > data.length) return null;
    obus.push({
      type,
      header: data.subarray(pos, pos + headerLen),
      temporalId,
      spatialId,
      hasExtension,
      payload: data.subarray(payloadStart, payloadEnd),
    });
    pos = payloadEnd;
  }
  return obus;
};

/**
 * Pack a layer identity into a 16-bit salt:
 *   bits 15-14 spatial_id (2), bits 13-11 temporal_id (3), bits 10-0 tileIdx.
 * tileIdx disambiguates multiple coded OBUs sharing the same layer in one
 * temporal unit; it is positional within a layer and re-derived identically on
 * decode (same-layer OBUs are never dropped independently). It is masked to 11
 * bits (max 2047); a frame with 2048+ tiles in one layer is physically absurd
 * for AV1, and a wrap would only yield a self-consistent wrong IV on both sides
 * (a clean decrypt failure), never an IV reuse.
 */
export const packSalt = (
  spatialId: number,
  temporalId: number,
  tileIdx: number,
): number =>
  ((spatialId & 0x03) << 14) | ((temporalId & 0x07) << 11) | (tileIdx & 0x07ff);

/**
 * XOR a 16-bit salt into the low 2 bytes of a copy of the 8-byte IV prefix.
 * Base-layer salt 0 leaves the prefix unchanged, so single-stream AV1 yields a
 * byte-identical IV to the v2 construction.
 */
export const applySalt = (ivPrefix: Uint8Array, salt16: number): Uint8Array => {
  const salted = ivPrefix.slice();
  salted[6] ^= (salt16 >> 8) & 0xff;
  salted[7] ^= salt16 & 0xff;
  return salted;
};

/**
 * Re-emit OBUs, forcing obu_has_size_field and recomputing each obu_size for
 * the current (possibly replaced) payload. Produces a tight buffer.
 */
export const serializeObus = (obus: Obu[]): Uint8Array<ArrayBuffer> => {
  const parts: Uint8Array[] = [];
  let total = 0;
  for (const obu of obus) {
    const header = obu.header.slice();
    header[0] |= 0x02; // obu_has_size_field
    const prefixLen = obu.prefix ? obu.prefix.length : 0;
    const size = writeLeb128(prefixLen + obu.payload.length);
    parts.push(header, size);
    if (obu.prefix) parts.push(obu.prefix);
    parts.push(obu.payload);
    total += header.length + size.length + prefixLen + obu.payload.length;
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const part of parts) {
    out.set(part, off);
    off += part.length;
  }
  return out;
};
