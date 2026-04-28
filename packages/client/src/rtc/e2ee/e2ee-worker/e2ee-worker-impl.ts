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
 * - AV1: not supported
 *
 * Encrypted frames carry a 20-byte trailer:
 *   [4B frameCounter][8B ivPrefix][1B keyIndex][2B clearBytes|flags]
 *   [1B version][4B 0xDEADBEEF]
 *
 * The 12-byte AES-GCM IV is constructed as:
 *   [8 bytes ivPrefix][4 bytes frameCounter]
 * `ivPrefix` is a random 8-byte value chosen fresh per key import on the
 * sender side, and transmitted inline in every frame's trailer. This
 * guarantees IV uniqueness even when the same raw key material happens to
 * be imported more than once (either in the same worker or across worker
 * sessions), without relying on the host to never reuse keys.
 *
 * Clear bytes are passed as Additional Authenticated Data (AAD) so the SFU
 * can read them but tampering is detected on decrypt.
 *
 * Total overhead per frame: 36 bytes (16 GCM tag + 20 trailer).
 *
 * Bundled at build time by rollup-plugin-inline-worker into a
 * self-contained function exported from `../e2ee-worker.ts`.
 *
 * @see ../e2ee-worker.ts — the generated export consumed by EncryptionManager
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_Encoded_Transforms
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm
 */

import {
  E2EE_VERSION,
  EMPTY_AAD,
  IV_LEN,
  MAX_CLEAR_BYTES,
  TRAILER_LEN,
} from './constants';
import {
  getClearByteCount,
  isSupportedCodec,
  rbspEscape,
  rbspUnescape,
} from './codec';
import { enqueue, readTrailer, writeTrailer } from './utils';
import {
  checkReplayWindow,
  dispose as disposeCrypto,
  dumpKeyState,
  fillIV,
  getKey,
  getLatestKey,
  getSenderIvPrefix,
  hasDecryptionFailures,
  importKey,
  importSharedKey,
  isKeyInvalid,
  nextFrameCounter,
  recordDecryptionFailure,
  removeKeys,
  resetDecryptionFailures,
} from './crypto';

/** Minimal shape of an RTCEncodedVideoFrame / RTCEncodedAudioFrame. */
interface EncodedFrame {
  data: ArrayBuffer;
  type?: 'key' | 'delta' | 'empty';
  timestamp: number;
}

type FrameController = {
  enqueue(frame: EncodedFrame): void;
  terminate(): void;
};

let e2eeActive = true;

// --- Perf reporter state --------------------------------------------------

let perfEnabled = false;
let perfInterval: ReturnType<typeof setInterval> | null = null;
let perfLastTick = 0;
let encodeFrameCount = 0;
let encodeMaxCryptoMs = 0;
let decodeMaxCryptoMs = 0;
const decodeFrameCounts = new Map<string, number>();

const bumpDecodeCount = (userId: string) => {
  if (perfEnabled)
    decodeFrameCounts.set(userId, (decodeFrameCounts.get(userId) || 0) + 1);
};

const startPerfReport = () => {
  if (perfInterval) return; // already running — avoid leaking a second interval
  perfEnabled = true;
  perfLastTick = performance.now();
  perfInterval = setInterval(() => {
    const now = performance.now();
    const dtSec = Math.max(0.001, (now - perfLastTick) / 1000);
    perfLastTick = now;
    const decode: Array<{ userId: string; fps: number }> = [];
    for (const [userId, count] of decodeFrameCounts) {
      decode.push({ userId, fps: count / dtSec });
      decodeFrameCounts.set(userId, 0);
    }
    self.postMessage({
      type: 'e2ee.perf_report',
      encode: { fps: encodeFrameCount / dtSec, maxCryptoMs: encodeMaxCryptoMs },
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

// --- Transform lifecycle --------------------------------------------------

/**
 * Track in-flight pipelines so `dispose` can tear them down cleanly instead
 * of leaving them to fail per-frame after crypto state has been cleared.
 */
const activePipelines = new Set<AbortController>();

let encodeFailureSignaled = false;
const signalEncodeFailure = (reason: string) => {
  if (encodeFailureSignaled) return;
  encodeFailureSignaled = true;
  self.postMessage({ type: 'e2ee.encryption_failed', reason });
};

const encodeTransform = (userId: string, codec: string | undefined) => {
  const isNalu = codec === 'h264';
  const iv = new Uint8Array(IV_LEN);
  const ivView = new DataView(iv.buffer);

  return new TransformStream<EncodedFrame, EncodedFrame>({
    async transform(frame, controller: FrameController) {
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
      const prefix = getSenderIvPrefix(userId, keyIndex);
      if (!prefix) return;

      const src = new Uint8Array(frame.data);
      const clearBytes = getClearByteCount(codec, frame.type, src);
      if (clearBytes > MAX_CLEAR_BYTES) {
        // Impossibly large clear header — drop instead of corrupting the
        // trailer by overflowing the RBSP flag bit.
        signalEncodeFailure('clearBytes exceeds trailer capacity');
        return;
      }

      try {
        // nextFrameCounter throws at the 32-bit ceiling; catching here keeps
        // the sender fail-closed if the integrator ignored the earlier
        // rekeyRequested signal.
        const counter = nextFrameCounter(userId);
        fillIV(iv, ivView, prefix, counter);
        const aad = clearBytes > 0 ? src.subarray(0, clearBytes) : EMPTY_AAD;
        const plaintext = clearBytes > 0 ? src.subarray(clearBytes) : src;

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
            prefix,
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
            prefix,
            keyIndex,
            clearBytes,
            false,
          );
          frame.data = dst.buffer;
        }
        controller.enqueue(frame);
        if (perfEnabled) encodeFrameCount++;
      } catch (err: any) {
        // Dropping the frame here avoids leaking plaintext, but the host
        // needs to know — otherwise the sender publishes nothing with no
        // surfaced error.
        signalEncodeFailure(err?.message || String(err));
      }
    },
  });
};

const decodeTransform = (userId: string) => {
  let lastFailureNotification = 0;
  const FAILURE_THROTTLE_MS = 1000;

  const notifyFailure = () => {
    const now = Date.now();
    if (now - lastFailureNotification > FAILURE_THROTTLE_MS) {
      lastFailureNotification = now;
      self.postMessage({ type: 'e2ee.decryption_failed', userId });
    }
  };

  const iv = new Uint8Array(IV_LEN);
  const ivView = new DataView(iv.buffer);

  return new TransformStream<EncodedFrame, EncodedFrame>({
    async transform(frame, controller: FrameController) {
      if (frame.data.byteLength === 0) {
        controller.enqueue(frame);
        bumpDecodeCount(userId);
        return;
      }

      const src = new Uint8Array(frame.data);
      const trailer = readTrailer(src);

      if (!trailer) {
        // Unencrypted frame (or version mismatch); pass through untouched.
        controller.enqueue(frame);
        bumpDecodeCount(userId);
        return;
      }

      const { frameCounter, ivPrefix, keyIndex, clearBytes, isRbsp, version } =
        trailer;

      if (version !== E2EE_VERSION) {
        // readTrailer already filters wrong versions, but keep the explicit
        // branch so future bumps surface via notifyFailure rather than
        // silently dropping as "not our trailer".
        notifyFailure();
        return;
      }

      if (isKeyInvalid(userId, keyIndex)) return;

      const cryptoKey = getKey(userId, keyIndex);
      if (!cryptoKey) {
        notifyFailure();
        return;
      }

      if (!checkReplayWindow(userId, keyIndex, frameCounter)) {
        // Frame is a replay or older than the sliding window. Drop it
        // silently — these are not true decryption failures.
        return;
      }

      const bodyEnd = src.length - TRAILER_LEN;
      fillIV(iv, ivView, ivPrefix, frameCounter);
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
          self.postMessage({ type: 'e2ee.decryption_resumed', userId });
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
        // Only fire `e2ee.broken` on the transition — otherwise the host
        // would receive one notification per frame once tolerance is hit.
        const wasInvalid = isKeyInvalid(userId, keyIndex);
        recordDecryptionFailure(userId, keyIndex);
        notifyFailure();
        if (!wasInvalid && isKeyInvalid(userId, keyIndex)) {
          self.postMessage({ type: 'e2ee.broken', userId, keyIndex });
        }
      }
    },
  });
};

const setupTransform = ({
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
  if (operation === 'encode') {
    if (codec === 'av1') {
      // Defence in depth: EncryptionManager also blocks this, but any
      // caller that bypasses it would otherwise silently produce frames
      // with `clearBytes = 0` and break SFU layer selection.
      self.postMessage({
        type: 'error',
        message: 'AV1 is not supported for E2EE',
      });
      return;
    }
    if (!isSupportedCodec(codec)) {
      self.postMessage({
        type: 'error',
        message: `Unsupported codec for E2EE: ${codec}`,
      });
      return;
    }
  }

  const transform =
    operation === 'encode'
      ? encodeTransform(userId, codec)
      : decodeTransform(userId);

  const abort = new AbortController();
  activePipelines.add(abort);
  readable
    .pipeThrough(transform)
    .pipeTo(writable, { signal: abort.signal })
    .catch((err: any) => {
      if (abort.signal.aborted) return; // clean shutdown, not an error
      self.postMessage({
        type: 'error',
        message: `Transform pipeline error (${operation}, ${userId}): ${err?.message || err}`,
      });
    })
    .finally(() => {
      activePipelines.delete(abort);
    });
};

const teardownAllTransforms = () => {
  for (const abort of activePipelines) abort.abort();
  activePipelines.clear();
};

addEventListener('rtctransform', ((event: Event) => {
  const { readable, writable, options } = (
    event as unknown as {
      transformer: {
        readable: ReadableStream;
        writable: WritableStream;
        options: { operation: string; userId: string; codec?: string };
      };
    }
  ).transformer;
  // Route through the same queue as message-based setup so that any
  // in-flight key import completes before we wire up the transform.
  enqueue(async () => {
    setupTransform({ readable, writable, ...options });
  }).catch((err: any) => {
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
        decodeFrameCounts.delete(data.userId);
        break;
      case 'e2ee-enabled':
        e2eeActive = !!data.enabled;
        break;
      case 'perf-report':
        if (data.enabled) startPerfReport();
        else stopPerfReport();
        break;
      case 'dumpKeyState':
        self.postMessage({ type: 'keyState', ...dumpKeyState() });
        break;
      case 'dispose':
        stopPerfReport();
        teardownAllTransforms();
        disposeCrypto();
        break;
      default:
        // Insertable Streams fallback: Chrome sends transform setup as
        // untyped messages with {readable, writable, operation, ...}.
        if (data.readable && data.writable) {
          setupTransform(data);
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
