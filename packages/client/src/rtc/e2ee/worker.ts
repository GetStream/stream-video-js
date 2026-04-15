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
 * - AV1: not supported (blocked at the EncryptionManager level)
 *
 * Encrypted frames carry a 12-byte trailer:
 *   [4 bytes frameCounter][1 byte keyIndex][2 bytes clearBytes|flags][1 byte version][4 bytes 0xDEADBEEF]
 *
 * The 12-byte AES-GCM IV is constructed as:
 *   [8 bytes SHA-256(rawKey + userId)][4 bytes frameCounter]
 * The prefix is derived once per (key, user) pair, ensuring unique
 * IVs across users (even with shared keys) and across key rotations,
 * without adding bytes to the trailer.
 *
 * The AES-GCM ciphertext includes a 16-byte authentication tag.
 * Clear bytes are passed as Additional Authenticated Data (AAD),
 * so the SFU can read them but tampering is detected on decrypt.
 *
 * Total overhead per frame: 28 bytes (16 GCM tag + 12 trailer).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_Encoded_Transforms
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm
 */
export const WORKER_SOURCE = `
'use strict';

const MAGIC = 0xDEADBEEF;
const E2EE_VERSION = 1;
const TRAILER_LEN = 12; // 4 frameCounter + 1 keyIndex + 2 clearBytes + 1 version + 4 magic
const IV_LEN = 12;
const RBSP_FLAG = 0x8000; // bit 15 of the 2-byte clearBytes field signals RBSP escaping
const EMPTY_AAD = new Uint8Array(0);

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

// ---- IV prefix derivation ----
// The first 8 bytes of the 12-byte AES-GCM IV are derived from
// SHA-256(rawKey + userId). This ensures unique IVs across users
// (even with a shared key) and across key rotations, without
// increasing the trailer size.
// Map<"userId:keyIndex", Uint8Array(8)> — cached IV prefixes
const ivPrefixes = new Map();
// Raw bytes of the shared key, kept for lazy IV prefix computation
// (the userId is only known when the transform runs, not at import time).
let sharedRawKeyBytes = null; // Uint8Array | null

async function computeIVPrefix(rawKeyBytes, userId) {
  const userIdBytes = new TextEncoder().encode(userId);
  const combined = new Uint8Array(rawKeyBytes.length + userIdBytes.length);
  combined.set(rawKeyBytes, 0);
  combined.set(userIdBytes, rawKeyBytes.length);
  const hash = await crypto.subtle.digest('SHA-256', combined);
  return new Uint8Array(hash, 0, 8);
}

// Synchronous hot-path lookup — returns cached prefix or null.
// All prefixes are pre-computed at key import time (per-user keys)
// or at transform creation time (shared keys via ensureIVPrefix).
function getIVPrefix(userId, keyIndex) {
  return ivPrefixes.get(userId + ':' + keyIndex) || null;
}

// Pre-compute and cache the IV prefix for a (userId, keyIndex) pair.
// Called once when a transform is created and a shared key is active.
async function ensureIVPrefix(userId, keyIndex) {
  const cacheKey = userId + ':' + keyIndex;
  if (ivPrefixes.has(cacheKey)) return;
  if (sharedKey && keyIndex === sharedKey.keyIndex && sharedRawKeyBytes) {
    const prefix = await computeIVPrefix(sharedRawKeyBytes, userId);
    ivPrefixes.set(cacheKey, prefix);
  }
}

async function importKey(userId, keyIndex, rawKey) {
  try {
    const rawKeyBytes = new Uint8Array(rawKey);
    const cryptoKey = await crypto.subtle.importKey(
      'raw', rawKey, { name: 'AES-GCM', length: 128 }, false, ['encrypt', 'decrypt']
    );
    if (!keyStore.has(userId)) keyStore.set(userId, new Map());
    keyStore.get(userId).set(keyIndex, cryptoKey);
    latestKeyIndex.set(userId, keyIndex);

    const prefix = await computeIVPrefix(rawKeyBytes, userId);
    ivPrefixes.set(userId + ':' + keyIndex, prefix);
  } catch (e) {
    self.postMessage({ type: 'error', message: 'Failed to import key for user ' + userId + ': ' + e.message });
  }
}

async function importSharedKey(keyIndex, rawKey) {
  try {
    sharedRawKeyBytes = new Uint8Array(rawKey);
    const cryptoKey = await crypto.subtle.importKey(
      'raw', rawKey, { name: 'AES-GCM', length: 128 }, false, ['encrypt', 'decrypt']
    );
    sharedKey = { key: cryptoKey, keyIndex };
    // Clear cached prefixes for the old shared key — they'll be
    // recomputed lazily with the new raw bytes.
    for (const key of ivPrefixes.keys()) {
      if (!keyStore.has(key.split(':')[0])) ivPrefixes.delete(key);
    }
  } catch (e) {
    self.postMessage({ type: 'error', message: 'Failed to import shared key: ' + e.message });
  }
}

function removeKeys(userId) {
  keyStore.delete(userId);
  latestKeyIndex.delete(userId);
  frameCounters.delete(userId);
  for (const key of ivPrefixes.keys()) {
    if (key.startsWith(userId + ':')) ivPrefixes.delete(key);
  }
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

// Fill a pre-allocated IV buffer: [8-byte prefix][4-byte frame counter big-endian].
// Called per-frame; the iv/ivView are allocated once per transform to reduce GC pressure.
function fillIV(iv, ivView, prefix, frameCounter) {
  iv.set(prefix, 0);
  ivView.setUint32(8, frameCounter);
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
// Single-pass: writes to a worst-case buffer (1.5x) and returns a subarray.
function rbspEscape(data) {
  // Worst case: every pair of bytes is 00 00 xx (xx <= 03),
  // adding one 03 per pair → ~50% expansion.
  const result = new Uint8Array(data.length + (data.length >> 1) + 1);
  let j = 0;
  let needsEscape = false;
  for (let i = 0; i < data.length; ++i) {
    result[j++] = data[i];
    if (i < data.length - 2 && data[i] === 0 && data[i + 1] === 0 && data[i + 2] <= 3) {
      result[j++] = data[++i]; // copy second 0x00
      result[j++] = 3; // insert emulation-prevention byte
      needsEscape = true;
    }
  }
  return needsEscape ? result.subarray(0, j) : data;
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

// Trailer layout (12 bytes):
// [4B frameCounter][1B keyIndex][2B clearBytes|flags][1B version][4B magic]
// clearBytes uses 15 bits (max 32767), bit 15 is the RBSP flag.
function writeTrailer(dst, offset, frameCounter, keyIndex, clearBytes, isRbsp) {
  const view = new DataView(dst.buffer, dst.byteOffset, dst.byteLength);
  view.setUint32(offset, frameCounter);
  dst[offset + 4] = keyIndex;
  view.setUint16(offset + 5, isRbsp ? (clearBytes | RBSP_FLAG) : clearBytes);
  dst[offset + 7] = E2EE_VERSION;
  view.setUint32(offset + 8, MAGIC);
}

function readTrailer(src) {
  if (src.length < TRAILER_LEN) return null;
  const view = new DataView(src.buffer, src.byteOffset, src.byteLength);
  if (view.getUint32(src.length - 4) !== MAGIC) return null;
  const raw = view.getUint16(src.length - 7);
  return {
    frameCounter: view.getUint32(src.length - TRAILER_LEN),
    keyIndex: src[src.length - 8],
    clearBytes: raw & 0x7FFF,
    isRbsp: (raw & RBSP_FLAG) !== 0,
    version: src[src.length - 5],
  };
}

// ---- Runtime toggle ----

let e2eeActive = true;

// ---- Perf reporting ----

let perfEnabled = false;
let perfInterval = null;
let encodeFrameCount = 0;
let encodeMaxCryptoMs = 0;
let decodeMaxCryptoMs = 0;
// Map<userId, number>
const decodeFrameCounts = new Map();

function startPerfReport() {
  perfEnabled = true;
  perfInterval = setInterval(() => {
    const decode = [];
    for (const [userId, count] of decodeFrameCounts) {
      decode.push({ userId, fps: count });
      decodeFrameCounts.set(userId, 0);
    }
    self.postMessage({
      type: 'perf-report',
      encode: { fps: encodeFrameCount, maxCryptoMs: encodeMaxCryptoMs },
      decode,
      decodeMaxCryptoMs,
    });
    encodeFrameCount = 0;
    encodeMaxCryptoMs = 0;
    decodeMaxCryptoMs = 0;
  }, 1000);
}

function stopPerfReport() {
  perfEnabled = false;
  if (perfInterval) {
    clearInterval(perfInterval);
    perfInterval = null;
  }
  encodeFrameCount = 0;
  encodeMaxCryptoMs = 0;
  decodeMaxCryptoMs = 0;
  decodeFrameCounts.clear();
}

// ---- Transforms ----

async function encodeTransform(userId, codec) {
  const isNalu = codec === 'h264';
  // Await IV prefix computation so the first frames aren't silently dropped
  const latestEntry = getLatestKey(userId);
  if (latestEntry && sharedKey) await ensureIVPrefix(userId, latestEntry.keyIndex);

  // Pre-allocate reusable IV buffer — safe because TransformStream
  // processes frames sequentially (next transform call waits for await).
  const iv = new Uint8Array(IV_LEN);
  const ivView = new DataView(iv.buffer);

  return new TransformStream({
    async transform(frame, controller) {
      if (!e2eeActive) {
        controller.enqueue(frame);
        if (perfEnabled) encodeFrameCount++;
        return;
      }

      const entry = getLatestKey(userId);
      if (!entry) {
        // No key set yet — drop frame to avoid leaking plaintext
        return;
      }

      const { key: cryptoKey, keyIndex } = entry;
      const prefix = getIVPrefix(userId, keyIndex);
      if (!prefix) return;

      const src = new Uint8Array(frame.data);
      const clearBytes = getClearByteCount(codec, frame.type, src);
      const counter = nextFrameCounter(userId);
      fillIV(iv, ivView, prefix, counter);
      const aad = clearBytes > 0 ? src.subarray(0, clearBytes) : EMPTY_AAD;
      const plaintext = clearBytes > 0 ? src.subarray(clearBytes) : src;

      try {
        const t0 = perfEnabled ? performance.now() : 0;
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv, additionalData: aad },
          cryptoKey,
          plaintext,
        );
        if (perfEnabled) {
          const dt = performance.now() - t0;
          if (dt > encodeMaxCryptoMs) encodeMaxCryptoMs = dt;
        }
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
        controller.enqueue(frame);
        if (perfEnabled) encodeFrameCount++;
      } catch {
        // Encryption failed — drop frame to avoid sending plaintext
      }
    },
  });
}

async function decodeTransform(userId) {
  // Throttle failure notifications to avoid flooding the main thread.
  let lastFailureNotification = 0;
  const FAILURE_THROTTLE_MS = 1000;

  function notifyFailure() {
    const now = Date.now();
    if (now - lastFailureNotification > FAILURE_THROTTLE_MS) {
      lastFailureNotification = now;
      self.postMessage({ type: 'decryptionFailed', userId });
    }
  }

  // Await IV prefix computation so the first frames aren't silently dropped
  if (sharedKey) await ensureIVPrefix(userId, sharedKey.keyIndex);

  // Pre-allocate reusable IV buffer — safe because TransformStream
  // processes frames sequentially (next transform call waits for await).
  const iv = new Uint8Array(IV_LEN);
  const ivView = new DataView(iv.buffer);

  return new TransformStream({
    async transform(frame, controller) {
      const src = new Uint8Array(frame.data);
      const trailer = readTrailer(src);

      if (!trailer) {
        // No valid trailer — unencrypted frame, pass through
        controller.enqueue(frame);
        if (perfEnabled) decodeFrameCounts.set(userId, (decodeFrameCounts.get(userId) || 0) + 1);
        return;
      }

      const { frameCounter, keyIndex, clearBytes, isRbsp, version } = trailer;

      if (version !== E2EE_VERSION) {
        // Unsupported frame version — drop and notify
        notifyFailure();
        return;
      }

      const cryptoKey = getKey(userId, keyIndex);

      if (!cryptoKey) {
        // Key not available yet — drop frame and notify
        notifyFailure();
        return;
      }

      const prefix = getIVPrefix(userId, keyIndex);
      if (!prefix) {
        notifyFailure();
        return;
      }

      const bodyEnd = src.length - TRAILER_LEN;
      fillIV(iv, ivView, prefix, frameCounter);
      const aad = clearBytes > 0 ? src.subarray(0, clearBytes) : EMPTY_AAD;

      try {
        let ciphertext;
        if (isRbsp) {
          ciphertext = rbspUnescape(src.subarray(clearBytes, bodyEnd));
        } else {
          ciphertext = src.subarray(clearBytes, bodyEnd);
        }

        const t0 = perfEnabled ? performance.now() : 0;
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv, additionalData: aad },
          cryptoKey,
          ciphertext,
        );
        if (perfEnabled) {
          const dt = performance.now() - t0;
          if (dt > decodeMaxCryptoMs) decodeMaxCryptoMs = dt;
        }

        const plaintext = new Uint8Array(decrypted);
        const dst = new Uint8Array(clearBytes + plaintext.length);
        if (clearBytes > 0) dst.set(src.subarray(0, clearBytes), 0);
        dst.set(plaintext, clearBytes);
        frame.data = dst.buffer;
        controller.enqueue(frame);
        if (perfEnabled) decodeFrameCounts.set(userId, (decodeFrameCounts.get(userId) || 0) + 1);
      } catch {
        // Decryption failed (wrong key, tampered frame) — drop frame and notify.
        // The decoder freezes on the last good frame; the app can show a
        // warning via EncryptionManager.onDecryptionFailed.
        notifyFailure();
      }
    },
  });
}

// ---- Message handling ----

async function setupTransform({ readable, writable, operation, userId, codec }) {
  const transform = operation === 'encode'
    ? await encodeTransform(userId, codec)
    : await decodeTransform(userId);
  readable.pipeThrough(transform).pipeTo(writable).catch((err) => {
    self.postMessage({
      type: 'error',
      message: 'Transform pipeline error (' + operation + ', ' + userId + '): ' + (err && err.message || err),
    });
  });
}

addEventListener('rtctransform', ({ transformer: { readable, writable, options } }) => {
  setupTransform({ readable, writable, ...options }).catch((err) => {
    self.postMessage({ type: 'error', message: 'Transform setup failed: ' + (err && err.message || err) });
  });
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
    case 'e2ee-enabled':
      e2eeActive = !!data.enabled;
      break;
    case 'perf-report':
      if (data.enabled) startPerfReport();
      else stopPerfReport();
      break;
    case 'dispose':
      stopPerfReport();
      keyStore.clear();
      latestKeyIndex.clear();
      frameCounters.clear();
      ivPrefixes.clear();
      sharedRawKeyBytes = null;
      sharedKey = null;
      break;
    default:
      // Transform setup (Insertable Streams fallback path)
      setupTransform(data).catch((err) => {
        self.postMessage({ type: 'error', message: 'Transform setup failed: ' + (err && err.message || err) });
      });
      break;
  }
});
`;
