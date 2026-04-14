/**
 * E2EE worker source and lifecycle management.
 *
 * The worker handles frame encryption/decryption using WebRTC Encoded Transforms
 * with AES-128-GCM authenticated encryption.
 *
 * ## Key Management
 *
 * Each participant has their own set of symmetric keys, identified by
 * (userId, keyIndex). The main thread distributes keys to the worker
 * via postMessage; transforms look up the correct key per frame.
 *
 * ## Frame Format
 *
 * Codec-specific clear-byte rules preserve frame headers so the SFU
 * can still detect keyframes and select layers:
 * - Audio (Opus): 1 byte clear
 * - VP8: 10 bytes (keyframe) / 3 bytes (delta)
 * - VP9: 0 bytes (descriptor is in RTP header)
 * - H264: NALU-aware — clear up to first slice NALU start + 2, then
 *   RBSP-escape the encrypted tail to prevent fake start codes
 * - AV1: not supported (frames pass through unencrypted)
 *
 * Encrypted frames carry a 10-byte trailer:
 *   [4 bytes frameCounter][1 byte keyIndex][1 byte clearBytes|flags][4 bytes 0xDEADBEEF]
 *
 * The AES-GCM ciphertext includes a 16-byte authentication tag.
 * Clear bytes are passed as Additional Authenticated Data (AAD),
 * so the SFU can read them but tampering is detected on decrypt.
 *
 * Total overhead per frame: 26 bytes (16 GCM tag + 10 trailer).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_Encoded_Transforms
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm
 */
export const WORKER_SOURCE = `
'use strict';

const MAGIC = 0xDEADBEEF;
const TRAILER_LEN = 10; // 4 frameCounter + 1 keyIndex + 1 clearBytes + 4 magic
const IV_LEN = 12;
const RBSP_FLAG = 0x80; // bit 7 of the clearBytes byte signals RBSP escaping

// ---- Key Store ----

// Map<userId, Map<keyIndex, CryptoKey>>
const keyStore = new Map();
// Map<userId, number> — latest key index for encoding
const latestKeyIndex = new Map();
// Map<userId, number> — monotonic frame counter for encoding
const frameCounters = new Map();
// Shared fallback: used when no per-user key is set for a given userId.
// Enables the simple "everyone uses the same key" scenario.
let sharedKey = null; // { key: CryptoKey, keyIndex: number } | null
let sharedKeyIndex = 0;

async function importKey(userId, keyIndex, rawKey) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', rawKey, { name: 'AES-GCM', length: 128 }, false, ['encrypt', 'decrypt']
  );
  if (!keyStore.has(userId)) keyStore.set(userId, new Map());
  keyStore.get(userId).set(keyIndex, cryptoKey);
  latestKeyIndex.set(userId, keyIndex);
}

async function importSharedKey(keyIndex, rawKey) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', rawKey, { name: 'AES-GCM', length: 128 }, false, ['encrypt', 'decrypt']
  );
  sharedKey = { key: cryptoKey, keyIndex };
  sharedKeyIndex = keyIndex;
}

function removeKeys(userId) {
  keyStore.delete(userId);
  latestKeyIndex.delete(userId);
  frameCounters.delete(userId);
}

function getKey(userId, keyIndex) {
  const perUser = keyStore.get(userId)?.get(keyIndex);
  if (perUser) return perUser;
  // Fall back to shared key if keyIndex matches
  if (sharedKey && keyIndex === sharedKey.keyIndex) return sharedKey.key;
  return undefined;
}

function getLatestKey(userId) {
  const idx = latestKeyIndex.get(userId);
  if (idx !== undefined) {
    const key = keyStore.get(userId)?.get(idx);
    if (key) return { key, keyIndex: idx };
  }
  // Fall back to shared key
  if (sharedKey) return { key: sharedKey.key, keyIndex: sharedKey.keyIndex };
  return null;
}

// IV = [8 zero bytes][4-byte frame counter big-endian]
// Unique per (key, counter) pair — safe because each participant has their own key
// and the counter is monotonically increasing.
function buildIV(frameCounter) {
  const iv = new ArrayBuffer(IV_LEN);
  new DataView(iv).setUint32(8, frameCounter);
  return iv;
}

function nextFrameCounter(userId) {
  const c = (frameCounters.get(userId) || 0) + 1;
  frameCounters.set(userId, c);
  return c;
}

// ---- H.264 NALU helpers ----

function findStartCode(data, offset) {
  for (let i = offset; i < data.length - 2; ++i) {
    if (data[i] === 0 && data[i + 1] === 0) {
      if (data[i + 2] === 1) return { pos: i, len: 3 };
      if (data[i + 2] === 0 && i + 3 < data.length && data[i + 3] === 1) {
        return { pos: i, len: 4 };
      }
    }
  }
  return null;
}

// Returns clear-byte count for H264: everything up to the first slice
// NALU's start index + 2 (start code + NALU header + 1 byte of slice header).
// Slice NALUs: type 1 (non-IDR) and type 5 (IDR).
function h264ClearBytes(data) {
  let sc = findStartCode(data, 0);
  while (sc) {
    const headerPos = sc.pos + sc.len;
    if (headerPos >= data.length) break;
    const naluType = data[headerPos] & 0x1F;
    if (naluType === 1 || naluType === 5) {
      return sc.pos + sc.len + 2;
    }
    sc = findStartCode(data, headerPos);
  }
  return 0;
}

// Insert emulation-prevention bytes (0x03) after 0x00 0x00 when followed
// by 0x00-0x03, preventing fake Annex B start codes in encrypted data.
function rbspEscape(data) {
  let extra = 0;
  for (let i = 0; i < data.length - 2; ++i) {
    if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] <= 3) {
      extra++;
      i++;
    }
  }
  if (extra === 0) return data;
  const result = new Uint8Array(data.length + extra);
  let j = 0;
  for (let i = 0; i < data.length; ++i) {
    result[j++] = data[i];
    if (i < data.length - 2 && data[i] === 0 && data[i + 1] === 0 && data[i + 2] <= 3) {
      result[j++] = data[++i]; // copy second 0x00
      result[j++] = 3; // insert emulation-prevention byte
    }
  }
  return result.subarray(0, j);
}

// Reverse of rbspEscape: strip 0x03 after 0x00 0x00 before 0x00-0x03.
function rbspUnescape(data) {
  let remove = 0;
  for (let i = 0; i < data.length - 2; ++i) {
    if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 3
        && i + 3 < data.length && data[i + 3] <= 3) {
      remove++;
      i += 2;
    }
  }
  if (remove === 0) return data;
  const result = new Uint8Array(data.length - remove);
  let j = 0;
  for (let i = 0; i < data.length; ++i) {
    if (i < data.length - 2 && data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 3
        && i + 3 < data.length && data[i + 3] <= 3) {
      result[j++] = 0;
      result[j++] = 0;
      i += 2; // skip 00 00 03
      continue;
    }
    result[j++] = data[i];
  }
  return result.subarray(0, j);
}

// ---- Codec clear-byte rules ----

function getClearByteCount(codec, frameType, data) {
  if (frameType === undefined) return 1; // audio
  if (codec === 'vp8') return frameType === 'key' ? 10 : 3;
  if (codec === 'h264') return h264ClearBytes(data);
  return 0; // VP9 / others
}

// ---- Trailer read/write ----

function writeTrailer(dst, offset, frameCounter, keyIndex, clearBytes, isRbsp) {
  const view = new DataView(dst.buffer, dst.byteOffset, dst.byteLength);
  view.setUint32(offset, frameCounter);
  dst[offset + 4] = keyIndex;
  dst[offset + 5] = isRbsp ? (clearBytes | RBSP_FLAG) : clearBytes;
  view.setUint32(offset + 6, MAGIC);
}

function readTrailer(src) {
  if (src.length < TRAILER_LEN) return null;
  const view = new DataView(src.buffer, src.byteOffset, src.byteLength);
  if (view.getUint32(src.length - 4) !== MAGIC) return null;
  return {
    frameCounter: view.getUint32(src.length - TRAILER_LEN),
    keyIndex: src[src.length - 6],
    clearBytes: src[src.length - 5] & 0x7F,
    isRbsp: (src[src.length - 5] & RBSP_FLAG) !== 0,
  };
}

// ---- Transforms ----

function encodeTransform(userId, codec) {
  const isNalu = codec === 'h264';

  return new TransformStream({
    async transform(frame, controller) {
      // https://groups.google.com/g/discuss-webrtc/c/5CMOZ4JtERo
      // https://issues.chromium.org/issues/40287616
      if (codec === 'av1') {
        controller.enqueue(frame);
        return;
      }

      const entry = getLatestKey(userId);
      if (!entry) {
        // No key set yet — pass through unencrypted
        controller.enqueue(frame);
        return;
      }

      const { key: cryptoKey, keyIndex } = entry;
      const src = new Uint8Array(frame.data);
      const clearBytes = getClearByteCount(codec, frame.type, src);
      const counter = nextFrameCounter(userId);
      const iv = buildIV(counter);
      const aad = clearBytes > 0 ? src.slice(0, clearBytes) : new Uint8Array(0);
      const plaintext = src.subarray(clearBytes);

      try {
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv, additionalData: aad },
          cryptoKey,
          plaintext,
        );
        const ciphertext = new Uint8Array(encrypted);

        if (isNalu && clearBytes > 0) {
          // RBSP-escape ciphertext to prevent fake Annex B start codes
          const escaped = rbspEscape(ciphertext);
          const dst = new Uint8Array(clearBytes + escaped.length + TRAILER_LEN);
          dst.set(aad, 0);
          dst.set(escaped, clearBytes);
          writeTrailer(dst, clearBytes + escaped.length, counter, keyIndex, clearBytes, true);
          frame.data = dst.buffer;
        } else {
          const dst = new Uint8Array(clearBytes + ciphertext.length + TRAILER_LEN);
          if (clearBytes > 0) dst.set(aad, 0);
          dst.set(ciphertext, clearBytes);
          writeTrailer(dst, clearBytes + ciphertext.length, counter, keyIndex, clearBytes, false);
          frame.data = dst.buffer;
        }
      } catch {
        // Encryption failed — pass through unencrypted
      }

      controller.enqueue(frame);
    },
  });
}

function decodeTransform(userId) {
  return new TransformStream({
    async transform(frame, controller) {
      const src = new Uint8Array(frame.data);
      const trailer = readTrailer(src);

      if (!trailer) {
        // No valid trailer — unencrypted frame, pass through
        controller.enqueue(frame);
        return;
      }

      const { frameCounter, keyIndex, clearBytes, isRbsp } = trailer;
      const cryptoKey = getKey(userId, keyIndex);

      if (!cryptoKey) {
        // Key not available yet — pass through
        controller.enqueue(frame);
        return;
      }

      const bodyEnd = src.length - TRAILER_LEN;
      const iv = buildIV(frameCounter);
      const aad = clearBytes > 0 ? src.slice(0, clearBytes) : new Uint8Array(0);

      try {
        let ciphertext;
        if (isRbsp) {
          ciphertext = rbspUnescape(src.subarray(clearBytes, bodyEnd));
        } else {
          ciphertext = src.subarray(clearBytes, bodyEnd);
        }

        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv, additionalData: aad },
          cryptoKey,
          ciphertext,
        );

        const plaintext = new Uint8Array(decrypted);
        const dst = new Uint8Array(clearBytes + plaintext.length);
        if (clearBytes > 0) dst.set(src.subarray(0, clearBytes), 0);
        dst.set(plaintext, clearBytes);
        frame.data = dst.buffer;
      } catch {
        // Decryption failed (wrong key, corrupted) — pass through as-is
      }

      controller.enqueue(frame);
    },
  });
}

// ---- Message handling ----

function setupTransform({ readable, writable, operation, userId, codec }) {
  const transform = operation === 'encode'
    ? encodeTransform(userId, codec)
    : decodeTransform(userId);
  readable.pipeThrough(transform).pipeTo(writable);
}

addEventListener('rtctransform', ({ transformer: { readable, writable, options } }) => {
  setupTransform({ readable, writable, ...options });
});

addEventListener('message', ({ data }) => {
  switch (data.type) {
    case 'setKey':
      importKey(data.userId, data.keyIndex, data.rawKey);
      break;
    case 'setSharedKey':
      importSharedKey(data.keyIndex, data.rawKey);
      break;
    case 'removeKeys':
      removeKeys(data.userId);
      break;
    case 'dispose':
      keyStore.clear();
      latestKeyIndex.clear();
      frameCounters.clear();
      sharedKey = null;
      break;
    default:
      // Transform setup (Insertable Streams fallback path)
      setupTransform(data);
      break;
  }
});
`;
