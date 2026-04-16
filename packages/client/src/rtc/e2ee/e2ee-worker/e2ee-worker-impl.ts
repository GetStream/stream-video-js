/**
 * E2EE Web Worker entry point.
 *
 * Wires up WebRTC Encoded Transforms for frame encryption/decryption
 * using AES-128-GCM authenticated encryption.
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
 * Bundled at build time by rollup-plugin-inline-worker into a
 * self-contained function exported from `../e2ee-worker.ts`.
 *
 * @see ../e2ee-worker.ts — the generated export consumed by EncryptionManager
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_Encoded_Transforms
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm
 */

import { E2EE_VERSION, EMPTY_AAD, IV_LEN, TRAILER_LEN } from './constants';
import { getClearByteCount, rbspEscape, rbspUnescape } from './codec';
import { enqueue, readTrailer, writeTrailer } from './utils';
import {
  dispose as disposeCrypto,
  ensureIVPrefix,
  fillIV,
  getIVPrefix,
  getKey,
  getLatestKey,
  getSharedKey,
  hasDecryptionFailures,
  importKey,
  importSharedKey,
  isKeyInvalid,
  nextFrameCounter,
  recordDecryptionFailure,
  removeKeys,
  resetDecryptionFailures,
} from './crypto';

let e2eeActive = true;

let perfEnabled = false;
let perfInterval: ReturnType<typeof setInterval> | null = null;
let encodeFrameCount = 0;
let encodeMaxCryptoMs = 0;
let decodeMaxCryptoMs = 0;
const decodeFrameCounts = new Map<string, number>();

const bumpDecodeCount = (userId: string) => {
  if (perfEnabled)
    decodeFrameCounts.set(userId, (decodeFrameCounts.get(userId) || 0) + 1);
};

const startPerfReport = () => {
  perfEnabled = true;
  perfInterval = setInterval(() => {
    const decode: Array<{ userId: string; fps: number }> = [];
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
};

const stopPerfReport = () => {
  perfEnabled = false;
  if (perfInterval) {
    clearInterval(perfInterval);
    perfInterval = null;
  }
  encodeFrameCount = 0;
  encodeMaxCryptoMs = 0;
  decodeMaxCryptoMs = 0;
  decodeFrameCounts.clear();
};

const encodeTransform = async (userId: string, codec: string | undefined) => {
  const isNalu = codec === 'h264';
  const latestEntry = getLatestKey(userId);
  if (latestEntry && getSharedKey())
    await ensureIVPrefix(userId, latestEntry.keyIndex);

  const iv = new Uint8Array(IV_LEN);
  const ivView = new DataView(iv.buffer);

  return new TransformStream({
    async transform(frame: any, controller: any) {
      // e2eeActive only gates encoding — the decoder always accepts both
      // encrypted (trailer present) and unencrypted frames from peers.
      if (!e2eeActive || frame.data.byteLength === 0) {
        controller.enqueue(frame);
        if (perfEnabled) encodeFrameCount++;
        return;
      }

      const entry = getLatestKey(userId);
      if (!entry) return;

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
          { name: 'AES-GCM', iv, additionalData: aad as BufferSource },
          cryptoKey,
          plaintext as BufferSource,
        );
        if (perfEnabled) {
          const dt = performance.now() - t0;
          if (dt > encodeMaxCryptoMs) encodeMaxCryptoMs = dt;
        }
        const ciphertext = new Uint8Array(encrypted);

        if (isNalu && clearBytes > 0) {
          const escaped = rbspEscape(ciphertext);
          const dst = new Uint8Array(clearBytes + escaped.length + TRAILER_LEN);
          dst.set(aad, 0);
          dst.set(escaped, clearBytes);
          writeTrailer(
            dst,
            clearBytes + escaped.length,
            counter,
            keyIndex,
            clearBytes,
            true,
          );
          frame.data = dst.buffer;
        } else {
          const dst = new Uint8Array(
            clearBytes + ciphertext.length + TRAILER_LEN,
          );
          if (clearBytes > 0) dst.set(aad, 0);
          dst.set(ciphertext, clearBytes);
          writeTrailer(
            dst,
            clearBytes + ciphertext.length,
            counter,
            keyIndex,
            clearBytes,
            false,
          );
          frame.data = dst.buffer;
        }
        controller.enqueue(frame);
        if (perfEnabled) encodeFrameCount++;
      } catch {
        // Encryption failed — drop frame to avoid sending plaintext
      }
    },
  });
};

const decodeTransform = async (userId: string) => {
  let lastFailureNotification = 0;
  const FAILURE_THROTTLE_MS = 1000;

  const notifyFailure = () => {
    const now = Date.now();
    if (now - lastFailureNotification > FAILURE_THROTTLE_MS) {
      lastFailureNotification = now;
      self.postMessage({ type: 'decryptionFailed', userId });
    }
  };

  const sk = getSharedKey();
  if (sk) await ensureIVPrefix(userId, sk.keyIndex);

  const iv = new Uint8Array(IV_LEN);
  const ivView = new DataView(iv.buffer);

  return new TransformStream({
    async transform(frame: any, controller: any) {
      if (frame.data.byteLength === 0) {
        controller.enqueue(frame);
        bumpDecodeCount(userId);
        return;
      }

      const src = new Uint8Array(frame.data);
      const trailer = readTrailer(src);

      if (!trailer) {
        controller.enqueue(frame);
        bumpDecodeCount(userId);
        return;
      }

      const { frameCounter, keyIndex, clearBytes, isRbsp, version } = trailer;

      if (version !== E2EE_VERSION) {
        notifyFailure();
        return;
      }

      if (isKeyInvalid(userId, keyIndex)) return;

      const cryptoKey = getKey(userId, keyIndex);
      if (!cryptoKey) {
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
        let ciphertext: Uint8Array;
        if (isRbsp) {
          ciphertext = rbspUnescape(src.subarray(clearBytes, bodyEnd));
        } else {
          ciphertext = src.subarray(clearBytes, bodyEnd);
        }

        const t0 = perfEnabled ? performance.now() : 0;
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv, additionalData: aad as BufferSource },
          cryptoKey,
          ciphertext as BufferSource,
        );
        if (perfEnabled) {
          const dt = performance.now() - t0;
          if (dt > decodeMaxCryptoMs) decodeMaxCryptoMs = dt;
        }

        if (hasDecryptionFailures(userId, keyIndex)) {
          resetDecryptionFailures(userId, keyIndex);
        }

        if (clearBytes === 0) {
          frame.data = decrypted;
        } else {
          const plaintext = new Uint8Array(decrypted);
          const dst = new Uint8Array(clearBytes + plaintext.length);
          dst.set(src.subarray(0, clearBytes), 0);
          dst.set(plaintext, clearBytes);
          frame.data = dst.buffer;
        }
        controller.enqueue(frame);
        bumpDecodeCount(userId);
      } catch {
        recordDecryptionFailure(userId, keyIndex);
        notifyFailure();
      }
    },
  });
};

const setupTransform = async ({
  readable,
  writable,
  operation,
  userId,
  codec,
}: {
  readable: ReadableStream;
  writable: WritableStream;
  operation: string;
  userId: string;
  codec?: string;
}) => {
  const transform =
    operation === 'encode'
      ? await encodeTransform(userId, codec)
      : await decodeTransform(userId);
  readable
    .pipeThrough(transform)
    .pipeTo(writable)
    .catch((err: any) => {
      self.postMessage({
        type: 'error',
        message: `Transform pipeline error (${operation}, ${userId}): ${err?.message || err}`,
      });
    });
};

addEventListener('rtctransform', ((event: any) => {
  const { readable, writable, options } = event.transformer;
  setupTransform({ readable, writable, ...options }).catch((err: any) => {
    self.postMessage({
      type: 'error',
      message: `Transform setup failed: ${err?.message || err}`,
    });
  });
}) as EventListener);

addEventListener('message', ({ data }: MessageEvent) => {
  enqueue(async () => {
    switch (data.type) {
      case 'setKey':
        await importKey(data.userId, data.keyIndex, data.rawKey);
        break;
      case 'setSharedKey':
        await importSharedKey(data.keyIndex, data.rawKey);
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
        disposeCrypto();
        break;
      default:
        // Insertable Streams fallback: Chrome sends transform setup
        // as untyped messages with {readable, writable, operation, ...}
        if (data.readable && data.writable) {
          await setupTransform(data);
        } else {
          self.postMessage({
            type: 'error',
            message: `Unknown message type: ${data.type}`,
          });
        }
        break;
    }
  }).catch((err: any) => {
    self.postMessage({
      type: 'error',
      message: `Message handler error: ${err?.message || err}`,
    });
  });
});
