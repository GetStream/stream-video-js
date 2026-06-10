/**
 * AV1 E2EE: encrypt the coded-data OBU payloads of a temporal unit, leaving all
 * framing OBUs clear. Each encrypted OBU carries an inline header plus the GCM
 * tag inside its (resized) payload - no frame trailer. See ./av1-obu.ts for the
 * pure OBU parsing and the layer-salt helpers.
 */
import {
  AV1_INLINE_HEADER_LEN,
  AV1_VERSION,
  IV_LEN,
  IV_PREFIX_LEN,
  MAGIC,
} from './constants';
import { fillIV } from './crypto';
import {
  AV1_ENCRYPTED_OBU_TYPES,
  applySalt,
  packSalt,
  parseObus,
  serializeObus,
  type Obu,
} from './av1-obu';

// Inline header offsets: magic|version|keyIndex|ivPrefix|frameCounter.
const IH_MAGIC = 0; // 4B
const IH_VERSION = 4; // 1B
const IH_KEY_INDEX = 5; // 1B
const IH_IV_PREFIX = 6; // 8B
const IH_FRAME_COUNTER = 14; // 4B (ends at 18)

export interface InlineHeader {
  keyIndex: number;
  /** View into the source buffer; copy if it must outlive the frame. */
  ivPrefix: Uint8Array;
  frameCounter: number;
}

/** Build the 18-byte inline header written at the start of an encrypted OBU. */
export const writeInlineHeader = (
  keyIndex: number,
  ivPrefix: Uint8Array,
  frameCounter: number,
): Uint8Array => {
  const buf = new Uint8Array(AV1_INLINE_HEADER_LEN);
  const view = new DataView(buf.buffer);
  view.setUint32(IH_MAGIC, MAGIC);
  buf[IH_VERSION] = AV1_VERSION;
  buf[IH_KEY_INDEX] = keyIndex;
  buf.set(ivPrefix, IH_IV_PREFIX);
  view.setUint32(IH_FRAME_COUNTER, frameCounter);
  return buf;
};

/**
 * Read the inline header from the start of an OBU payload. Returns null when
 * the payload is too short or the magic/version do not match (i.e. the OBU is
 * not one of ours).
 */
export const readInlineHeader = (payload: Uint8Array): InlineHeader | null => {
  if (payload.length < AV1_INLINE_HEADER_LEN) return null;
  const view = new DataView(
    payload.buffer,
    payload.byteOffset,
    payload.byteLength,
  );
  if (view.getUint32(IH_MAGIC) !== MAGIC) return null;
  if (payload[IH_VERSION] !== AV1_VERSION) return null;
  return {
    keyIndex: payload[IH_KEY_INDEX],
    ivPrefix: payload.subarray(IH_IV_PREFIX, IH_IV_PREFIX + IV_PREFIX_LEN),
    frameCounter: view.getUint32(IH_FRAME_COUNTER),
  };
};

const concatBytes = (a: Uint8Array, b: Uint8Array): Uint8Array => {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
};

const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

/**
 * The header bytes authenticated as AAD. We force obu_has_size_field on so the
 * value matches what serializeObus emits and what the depacketizer
 * reconstructs on the receive side (it always writes a size field). obu_size
 * itself is excluded from AAD because libwebrtc rewrites it.
 */
const aadHeader = (obu: Obu): Uint8Array => {
  const h = obu.header.slice();
  h[0] |= 0x02;
  return h;
};

/** Per-OBU IV into a fresh buffer (callbacks run concurrently). */
const buildIv = (
  ivPrefix: Uint8Array,
  salt: number,
  frameCounter: number,
): Uint8Array<ArrayBuffer> => {
  const iv = new Uint8Array(IV_LEN);
  fillIV(iv, new DataView(iv.buffer), applySalt(ivPrefix, salt), frameCounter);
  return iv;
};

/**
 * Encrypt the payload of every tile-group / frame OBU in a temporal unit.
 * Returns the re-serialized frame, the original buffer unchanged when there is
 * no coded data, or null when the stream is not parseable AV1.
 *
 * IV-REUSE CONTRACT: `frameCounter` MUST come from `nextFrameCounter(userId)`,
 * the single monotonic per-user counter shared with every other codec on this
 * key. A base-layer OBU has salt 0, so its IV is byte-identical to a v2 frame's
 * IV at the same counter; only the never-repeating counter keeps (key, IV)
 * pairs unique across a user's AV1 and non-AV1 tracks. Do not pass a
 * per-track or otherwise independent counter here.
 */
export const encryptAv1Frame = async (
  data: Uint8Array<ArrayBuffer>,
  key: CryptoKey,
  keyIndex: number,
  ivPrefix: Uint8Array,
  frameCounter: number,
): Promise<Uint8Array<ArrayBuffer> | null> => {
  const obus = parseObus(data);
  if (!obus) return null;
  const tileCounts = new Map<number, number>();
  let encryptedAny = false;

  // Frame-global: keyIndex, ivPrefix and frameCounter are identical for every
  // OBU in this temporal unit, so build the inline header once instead of
  // re-allocating it per OBU. It is read-only below, safe across the concurrent
  // per-OBU encrypts.
  const inlineHeader = writeInlineHeader(keyIndex, ivPrefix, frameCounter);

  await Promise.all(
    obus.map(async (obu) => {
      if (!AV1_ENCRYPTED_OBU_TYPES.has(obu.type)) return;
      encryptedAny = true;
      const layerKey = (obu.spatialId << 3) | obu.temporalId;
      const tileIdx = tileCounts.get(layerKey) ?? 0;
      tileCounts.set(layerKey, tileIdx + 1);

      const salt = packSalt(obu.spatialId, obu.temporalId, tileIdx);
      const iv = buildIv(ivPrefix, salt, frameCounter);
      const aad = concatBytes(aadHeader(obu), inlineHeader);
      const cipher = new Uint8Array(
        await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv, additionalData: aad as BufferSource },
          key,
          obu.payload as BufferSource,
        ),
      );
      obu.payload = concatBytes(inlineHeader, cipher);
    }),
  );

  return encryptedAny ? serializeObus(obus) : data;
};

export interface EncryptedAv1 {
  obus: Obu[];
  keyIndex: number;
  /** Copied out of the frame so it survives buffer reuse. */
  ivPrefix: Uint8Array;
  frameCounter: number;
}

/**
 * Detect a v3-encrypted AV1 frame. Returns the parsed OBUs and frame-global
 * fields, or null if the bytes are not AV1 or the first coded OBU is not ours.
 */
export const parseEncryptedAv1 = (data: Uint8Array): EncryptedAv1 | null => {
  const obus = parseObus(data);
  if (!obus) return null;
  for (const obu of obus) {
    if (!AV1_ENCRYPTED_OBU_TYPES.has(obu.type)) continue;
    const ih = readInlineHeader(obu.payload);
    if (!ih) return null; // first coded OBU isn't encrypted -> not our frame
    return {
      obus,
      keyIndex: ih.keyIndex,
      ivPrefix: ih.ivPrefix.slice(),
      frameCounter: ih.frameCounter,
    };
  }
  return null; // no coded OBUs
};

/**
 * Decrypt every encrypted OBU of a frame returned by parseEncryptedAv1. Throws
 * if any GCM tag fails (the caller drops the whole frame). Returns the
 * re-serialized plaintext frame.
 *
 * Every encrypted OBU must carry the same keyIndex, ivPrefix, and frameCounter
 * as the frame-global values parseEncryptedAv1 read from the first coded OBU -
 * the only tuple the caller's replay window checks. A legitimate temporal unit
 * always satisfies this (encryptAv1Frame stamps one counter across the frame;
 * SVC dropping only removes OBUs). A mismatch means an OBU was spliced in from
 * another frame to dodge replay protection, so the whole frame is dropped.
 */
export const decryptAv1Frame = async (
  parsed: EncryptedAv1,
  key: CryptoKey,
): Promise<Uint8Array<ArrayBuffer>> => {
  const tileCounts = new Map<number, number>();
  await Promise.all(
    parsed.obus.map(async (obu) => {
      if (!AV1_ENCRYPTED_OBU_TYPES.has(obu.type)) return;
      const ih = readInlineHeader(obu.payload);
      if (!ih) return; // a coded OBU without our header: leave as-is
      if (
        ih.keyIndex !== parsed.keyIndex ||
        ih.frameCounter !== parsed.frameCounter ||
        !bytesEqual(ih.ivPrefix, parsed.ivPrefix)
      ) {
        throw new Error('AV1 OBU header does not match the frame');
      }
      const layerKey = (obu.spatialId << 3) | obu.temporalId;
      const tileIdx = tileCounts.get(layerKey) ?? 0;
      tileCounts.set(layerKey, tileIdx + 1);

      const salt = packSalt(obu.spatialId, obu.temporalId, tileIdx);
      const iv = buildIv(ih.ivPrefix, salt, ih.frameCounter);
      const inlineHeader = obu.payload.subarray(0, AV1_INLINE_HEADER_LEN);
      const cipher = obu.payload.subarray(AV1_INLINE_HEADER_LEN);
      const aad = concatBytes(aadHeader(obu), inlineHeader);
      const plain = new Uint8Array(
        await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv, additionalData: aad as BufferSource },
          key,
          cipher as BufferSource,
        ),
      );
      obu.payload = plain;
    }),
  );
  return serializeObus(parsed.obus);
};
