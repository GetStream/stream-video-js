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
 * - AV1: does not use the clear-byte/trailer scheme above. Each coded OBU
 *   (tile group / frame) carries an 18-byte inline header + GCM tag inside its
 *   payload; no frame trailer, since the AV1 RTP packetizer parses OBUs. The
 *   per-OBU IV is salted by layer id so it survives SVC layer dropping. See
 *   ./av1.ts.
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
import { decryptAv1Frame, encryptAv1Frame, parseEncryptedAv1 } from './av1';
import { enqueue, readTrailer, writeTrailer } from './utils';
import {
  createReplayWindow,
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

/**
 * Throttled per-user notification that the encoder has no key for the local
 * user, so outgoing frames are being dropped — the sender publishes nothing.
 * Without this, a missing key (host never called setKey, or a key import
 * failed) is completely silent: black video with no actionable signal.
 * Throttled to one message per second per user; it stops firing on its own
 * once a key is imported and frames start flowing.
 */
const missingKeyNotifiedAt = new Map<string, number>();
const MISSING_KEY_THROTTLE_MS = 1000;
const notifyMissingKey = (userId: string) => {
  const now = Date.now();
  const last = missingKeyNotifiedAt.get(userId) || 0;
  if (now - last > MISSING_KEY_THROTTLE_MS) {
    missingKeyNotifiedAt.set(userId, now);
    self.postMessage({ type: 'e2ee.missing_key', userId });
  }
};

/**
 * Shared encode tail: time the encryption, emit the produced frame, and surface
 * failures. `produce` returns the new frame bytes, or null if it already
 * decided to drop the frame (after signaling its own specific reason). Any
 * throw is reported via signalEncodeFailure and the frame is dropped - never
 * emitted in the clear.
 */
const finishEncode = async (
  frame: EncodedFrame,
  controller: FrameController,
  produce: () => Promise<Uint8Array<ArrayBuffer> | null>,
) => {
  try {
    const t0 = perfEnabled ? performance.now() : 0;
    const out = await produce();
    if (perfEnabled) {
      const dt = performance.now() - t0;
      if (dt > encodeMaxCryptoMs) encodeMaxCryptoMs = dt;
    }
    if (!out) return;
    frame.data = out.buffer;
    controller.enqueue(frame);
    if (perfEnabled) encodeFrameCount++;
  } catch (err: any) {
    signalEncodeFailure(err?.message || String(err));
  }
};

const encodeTransform = (userId: string, codec: string | undefined) => {
  const isNalu = codec === 'h264';
  const iv = new Uint8Array(IV_LEN);
  const ivView = new DataView(iv.buffer);

  return new TransformStream<EncodedFrame, EncodedFrame>({
    async transform(frame, controller) {
      // e2eeActive only gates encoding — the decoder always accepts both
      // encrypted (trailer present) and unencrypted frames from peers.
      if (!e2eeActive || frame.data.byteLength === 0) {
        controller.enqueue(frame);
        if (perfEnabled) encodeFrameCount++;
        return;
      }

      const entry = getLatestKey(userId);
      if (!entry) {
        notifyMissingKey(userId);
        return;
      }

      const { key: cryptoKey, keyIndex } = entry;
      const prefix = getSenderIvPrefix(userId, keyIndex);
      if (!prefix) {
        notifyMissingKey(userId);
        return;
      }

      if (codec === 'av1') {
        return finishEncode(frame, controller, async () => {
          // frameCounter MUST come from the shared monotonic per-user counter
          // (same source as the v2 path) - a base-layer OBU has salt 0, so its
          // IV matches a v2 frame's at the same counter; only the never-
          // repeating counter keeps (key, IV) pairs unique across this user's
          // AV1 and non-AV1 tracks.
          const counter = nextFrameCounter(userId);
          const out = await encryptAv1Frame(
            new Uint8Array(frame.data),
            cryptoKey,
            keyIndex,
            prefix,
            counter,
          );
          if (!out) {
            signalEncodeFailure('AV1 frame not parseable');
            return null;
          }
          return out;
        });
      }

      return finishEncode(frame, controller, async () => {
        const src = new Uint8Array(frame.data);
        const clearBytes = getClearByteCount(codec, frame.type, src);
        if (clearBytes > MAX_CLEAR_BYTES) {
          // Impossibly large clear header - drop instead of corrupting the
          // trailer by overflowing the RBSP flag bit.
          signalEncodeFailure('clearBytes exceeds trailer capacity');
          return null;
        }
        // nextFrameCounter throws at the 32-bit ceiling; finishEncode catches
        // it and fails closed if the integrator ignored the rekey signal.
        const counter = nextFrameCounter(userId);
        fillIV(iv, ivView, prefix, counter);
        const aad = clearBytes > 0 ? src.subarray(0, clearBytes) : EMPTY_AAD;
        const plaintext = clearBytes > 0 ? src.subarray(clearBytes) : src;
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv, additionalData: aad as BufferSource },
          cryptoKey,
          plaintext as BufferSource,
        );
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
          return dst;
        }
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
        return dst;
      });
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

  // Replay state is scoped to this transform — i.e. this single remote track —
  // so a remote user's audio/video/screenshare tracks never share a window.
  const replay = createReplayWindow();

  /**
   * Shared decode tail: gate on key availability / replay, time the
   * decryption, emit the plaintext, and run the failure / recovery bookkeeping.
   * `decrypt` returns the plaintext frame bytes and throws on a GCM tag failure
   * (which drops the whole frame). Only the param extraction and the decrypt
   * itself differ between the v2-trailer and AV1-inline formats.
   *
   * Trust ordering (the SFrame / SRTP rule): everything read before the decrypt
   * call — `frameCounter`, `ivPrefix`, `keyIndex` — is plaintext in the trailer
   * and forgeable by a relay, so nothing here mutates trust state until GCM
   * authenticates the frame. The replay window is only *peeked* up front and
   * *committed* after success; the failure counter is diagnostic only (it
   * gates the `e2ee.broken` signal, never the decrypt attempt) so a burst of
   * forged frames cannot latch a genuine key invalid (review findings 1-3).
   */
  const finishDecode = async (
    frame: EncodedFrame,
    controller: FrameController,
    keyIndex: number,
    ivPrefix: Uint8Array,
    frameCounter: number,
    decrypt: (key: CryptoKey) => Promise<ArrayBuffer>,
  ) => {
    const cryptoKey = getKey(userId, keyIndex);
    if (!cryptoKey) {
      notifyFailure();
      return;
    }
    // Read-only replay check. A replay or a frame older than the sliding
    // window is dropped silently - these are not true decryption failures.
    if (!replay.peek(frameCounter, ivPrefix)) return;
    try {
      const t0 = perfEnabled ? performance.now() : 0;
      const data = await decrypt(cryptoKey);
      if (perfEnabled) {
        const dt = performance.now() - t0;
        if (dt > decodeMaxCryptoMs) decodeMaxCryptoMs = dt;
      }
      // Authenticated: only now is it safe to advance the replay window.
      replay.commit(frameCounter, ivPrefix);
      if (hasDecryptionFailures(userId, keyIndex)) {
        resetDecryptionFailures(userId, keyIndex);
        self.postMessage({ type: 'e2ee.decryption_resumed', userId });
      }
      frame.data = data;
      controller.enqueue(frame);
      bumpDecodeCount(userId);
    } catch {
      // Only fire `e2ee.broken` on the transition - otherwise the host would
      // receive one notification per frame once tolerance is hit.
      const wasInvalid = isKeyInvalid(userId, keyIndex);
      recordDecryptionFailure(userId, keyIndex);
      notifyFailure();
      if (!wasInvalid && isKeyInvalid(userId, keyIndex)) {
        self.postMessage({ type: 'e2ee.broken', userId, keyIndex });
      }
    }
  };

  return new TransformStream<EncodedFrame, EncodedFrame>({
    async transform(frame, controller) {
      if (frame.data.byteLength === 0) {
        controller.enqueue(frame);
        bumpDecodeCount(userId);
        return;
      }

      const src = new Uint8Array(frame.data);
      const trailer = readTrailer(src);

      if (!trailer) {
        // No v2 trailer. Could be a v3-encrypted AV1 frame (OBU-inline, no
        // trailer) or a genuinely unencrypted frame. Detect AV1 from the OBU
        // stream; anything else passes through untouched.
        const parsed = parseEncryptedAv1(src);
        if (!parsed) {
          controller.enqueue(frame);
          bumpDecodeCount(userId);
          return;
        }
        return finishDecode(
          frame,
          controller,
          parsed.keyIndex,
          parsed.ivPrefix,
          parsed.frameCounter,
          (key) => decryptAv1Frame(parsed, key).then((out) => out.buffer),
        );
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

      return finishDecode(
        frame,
        controller,
        keyIndex,
        ivPrefix,
        frameCounter,
        async (key) => {
          const bodyEnd = src.length - TRAILER_LEN;
          fillIV(iv, ivView, ivPrefix, frameCounter);
          const aad = clearBytes > 0 ? src.subarray(0, clearBytes) : EMPTY_AAD;
          const ciphertext = isRbsp
            ? rbspUnescape(src.subarray(clearBytes, bodyEnd))
            : src.subarray(clearBytes, bodyEnd);
          const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv, additionalData: aad as BufferSource },
            key,
            ciphertext as BufferSource,
          );
          if (clearBytes === 0) return decrypted;
          const plaintext = new Uint8Array(decrypted);
          const dst = new Uint8Array(clearBytes + plaintext.length);
          dst.set(src.subarray(0, clearBytes), 0);
          dst.set(plaintext, clearBytes);
          return dst.buffer;
        },
      );
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
  if (operation === 'encode' && !isSupportedCodec(codec)) {
    self.postMessage({
      type: 'e2ee.error',
      message: `Unsupported codec for E2EE: ${codec}`,
    });
    return;
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
        type: 'e2ee.error',
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

addEventListener('rtctransform', (event) => {
  const { readable, writable, options } = event.transformer;
  // Route through the same queue as message-based setup so that any
  // in-flight key import completes before we wire up the transform.
  enqueue(async () => {
    setupTransform({ readable, writable, ...options });
  }).catch((err: any) => {
    self.postMessage({
      type: 'e2ee.error',
      message: `Transform setup failed: ${err?.message || err}`,
    });
  });
});

addEventListener('message', ({ data }) => {
  enqueue(async () => {
    switch (data.type) {
      case 'cmd.set_key':
        await importKey(data.userId, data.keyIndex, data.rawKey);
        break;
      case 'cmd.set_shared_key':
        await importSharedKey(data.keyIndex, data.rawKey);
        break;
      case 'cmd.remove_keys':
        removeKeys(data.userId);
        decodeFrameCounts.delete(data.userId);
        break;
      case 'cmd.set_enabled':
        e2eeActive = !!data.enabled;
        break;
      case 'cmd.set_perf_report':
        if (data.enabled) startPerfReport();
        else stopPerfReport();
        break;
      case 'cmd.dump_key_state':
        self.postMessage({ type: 'e2ee.key_state', ...dumpKeyState() });
        break;
      case 'cmd.dispose':
        stopPerfReport();
        teardownAllTransforms();
        disposeCrypto();
        missingKeyNotifiedAt.clear();
        break;
      case 'cmd.setup_transform':
        setupTransform(data);
        break;
      default:
        self.postMessage({
          type: 'e2ee.error',
          message: `Unknown command type: ${data.type}`,
        });
        break;
    }
  }).catch((err: any) => {
    self.postMessage({
      type: 'e2ee.error',
      message: `Message handler error: ${err?.message || err}`,
    });
  });
});
