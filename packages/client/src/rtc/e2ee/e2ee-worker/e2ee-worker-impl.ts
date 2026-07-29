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

import { EMPTY_AAD, IV_LEN, MAX_CLEAR_BYTES, TRAILER_LEN } from './constants';
import {
  getCodecProfile,
  isSupportedCodec,
  rbspEscapeInto,
  rbspEscapedLength,
  rbspUnescape,
} from './codec';
import { decryptAv1Frame, encryptAv1Frame, parseEncryptedAv1 } from './av1';
import {
  createThrottle,
  enqueue,
  readTrailer,
  readTrailerIv,
  writeTrailer,
} from './utils';
import {
  createFailureTracker,
  createReplayWindow,
  dispose as disposeCrypto,
  dumpKeyState,
  fillIV,
  getKey,
  getLatestKey,
  importKey,
  importSharedKey,
  nextFrameCounter,
  removeKeys,
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

// --- Perf reporter state --------------------------------------------------

let perfEnabled = false;
let perfInterval: ReturnType<typeof setInterval> | null = null;
let perfLastTick = 0;
// Encode stats are bucketed per outgoing track (keyed by trackType, which is
// unique per local sender) so two same-codec senders - e.g. a vp8 camera and a
// vp8 screen share - are reported apart instead of summed into one figure. The
// codec rides along for display.
const encodeStats = new Map<
  string,
  { userId: string; codec: string; count: number; maxCryptoMs: number }
>();
// Decode stats are bucketed per (userId, trackType) for the same reason: a
// remote peer's video and audio are reported apart, not summed under one userId.
const decodeStats = new Map<
  string,
  { userId: string; trackType: string; count: number; maxCryptoMs: number }
>();
const decodeStatKey = (userId: string, trackType: string) =>
  `${userId}/${trackType}`;

const bumpDecodeCount = (userId: string, trackType: string) => {
  if (!perfEnabled) return;
  const key = decodeStatKey(userId, trackType);
  const stat = decodeStats.get(key);
  if (stat) stat.count++;
  else decodeStats.set(key, { userId, trackType, count: 1, maxCryptoMs: 0 });
};

const recordDecodeCrypto = (userId: string, trackType: string, dt: number) => {
  if (!perfEnabled) return;
  const key = decodeStatKey(userId, trackType);
  const stat = decodeStats.get(key);
  if (stat) stat.maxCryptoMs = Math.max(stat.maxCryptoMs, dt);
  else decodeStats.set(key, { userId, trackType, count: 0, maxCryptoMs: dt });
};

const bumpEncodeCount = (track: string, userId: string, codec: string) => {
  if (!perfEnabled) return;
  const stat = encodeStats.get(track);
  if (stat) stat.count++;
  else encodeStats.set(track, { userId, codec, count: 1, maxCryptoMs: 0 });
};

const recordEncodeCrypto = (
  track: string,
  userId: string,
  codec: string,
  dt: number,
) => {
  if (!perfEnabled) return;
  const stat = encodeStats.get(track);
  if (stat) stat.maxCryptoMs = Math.max(stat.maxCryptoMs, dt);
  else encodeStats.set(track, { userId, codec, count: 0, maxCryptoMs: dt });
};

const startPerfReport = () => {
  if (perfInterval) return; // already running — avoid leaking a second interval
  perfEnabled = true;
  perfLastTick = performance.now();
  perfInterval = setInterval(() => {
    const now = performance.now();
    const dtSec = Math.max(0.001, (now - perfLastTick) / 1000);
    perfLastTick = now;
    const decode: Array<{
      userId: string;
      trackType: string;
      fps: number;
      maxCryptoMs: number;
    }> = [];
    for (const stat of decodeStats.values()) {
      decode.push({
        userId: stat.userId,
        trackType: stat.trackType,
        fps: stat.count / dtSec,
        maxCryptoMs: stat.maxCryptoMs,
      });
    }
    decodeStats.clear();
    const encode: Array<{
      userId: string;
      trackType: string;
      codec: string;
      fps: number;
      maxCryptoMs: number;
    }> = [];
    for (const [trackType, stat] of encodeStats) {
      encode.push({
        userId: stat.userId,
        trackType,
        codec: stat.codec,
        fps: stat.count / dtSec,
        maxCryptoMs: stat.maxCryptoMs,
      });
    }
    encodeStats.clear();
    self.postMessage({ type: 'e2ee.perf_report', encode, decode });
  }, 1000);
};

const stopPerfReport = () => {
  perfEnabled = false;
  if (perfInterval) {
    clearInterval(perfInterval);
    perfInterval = null;
  }
  encodeStats.clear();
  decodeStats.clear();
};

// --- Transform lifecycle --------------------------------------------------

/**
 * Track in-flight pipelines so `dispose` can tear them down cleanly instead
 * of leaving them to fail per-frame after crypto state has been cleared.
 */
const activePipelines = new Set<AbortController>();

/**
 * Throttled per-user notification that the encoder has no key for the local
 * user, so outgoing frames are being dropped — the sender publishes nothing.
 * Without this, a missing key (host never called setKey, or a key import
 * failed) is completely silent: black video with no actionable signal.
 * Throttled to one message per second per user; it stops firing on its own
 * once a key is imported and frames start flowing.
 */
const missingKeyThrottle = createThrottle(1000);
const notifyMissingKey = (userId: string) => {
  if (missingKeyThrottle.tryFire(userId)) {
    self.postMessage({ type: 'e2ee.missing_key', userId });
  }
};

const encodeTransform = (
  userId: string,
  codec: string | undefined,
  trackType: string | undefined,
) => {
  const profile = getCodecProfile(codec);
  const isNalu = profile.rbsp;
  // Bucket this sender's perf stats by trackType (unique per sender); fall back
  // to codec when a caller does not label the track.
  const trackKey = trackType ?? codec ?? 'unknown';
  const codecKey = codec ?? 'unknown';
  const iv = new Uint8Array(IV_LEN);
  const ivView = new DataView(iv.buffer);

  // Per-track encode-failure latch: signal the first failure of a run, then stay
  // quiet until a frame encrypts again. Scoping it per transform and re-arming
  // on success means a later permanent fail-closed (e.g. the counter hard limit)
  // is still surfaced instead of being swallowed by one earlier transient error
  // for the rest of the worker's life.
  let encodeFailed = false;
  const signalEncodeFailure = (reason: string) => {
    if (encodeFailed) return;
    encodeFailed = true;
    self.postMessage({ type: 'e2ee.encryption_failed', reason });
  };

  /**
   * Encode tail: time the encryption, emit the produced frame, and surface
   * failures. `produce` returns the new frame bytes, or null if it already
   * decided to drop the frame (after signaling its own specific reason). Any
   * throw is reported via signalEncodeFailure and the frame is dropped - never
   * emitted in the clear. A successful emit re-arms the failure latch.
   */
  const finishEncode = async (
    frame: EncodedFrame,
    controller: FrameController,
    produce: () => Promise<Uint8Array<ArrayBuffer> | null>,
  ) => {
    try {
      const t0 = perfEnabled ? performance.now() : 0;
      const out = await produce();
      if (perfEnabled)
        recordEncodeCrypto(trackKey, userId, codecKey, performance.now() - t0);
      if (!out) return;
      frame.data = out.buffer;
      controller.enqueue(frame);
      encodeFailed = false;
      bumpEncodeCount(trackKey, userId, codecKey);
    } catch (err: any) {
      signalEncodeFailure(err?.message || String(err));
    }
  };

  return new TransformStream<EncodedFrame, EncodedFrame>({
    async transform(frame, controller) {
      // Empty frames carry no payload to encrypt - pass them straight through.
      if (frame.data.byteLength === 0) {
        controller.enqueue(frame);
        bumpEncodeCount(trackKey, userId, codecKey);
        return;
      }

      const entry = getLatestKey(userId);
      if (!entry) {
        notifyMissingKey(userId);
        return;
      }

      const { key: cryptoKey, keyIndex, ivPrefix: prefix } = entry;

      if (profile.scheme === 'av1') {
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
        const clearBytes = profile.clearBytes(frame.type, src);
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
          // RBSP-escape the ciphertext AND the trailer as one unit so the
          // trailer's counter bytes can't form fake Annex-B start codes that
          // libwebrtc's H264 packetizer would split on. The last 7
          // trailer bytes (clearBytes|RBSP_FLAG, version, magic) are start-code
          // safe by construction - the RBSP flag forces the clearBytes high byte
          // >= 0x80 - so they pass through escaping unchanged and the decoder can
          // still read clearBytes from the raw frame tail to locate the unit.
          // Escape ciphertext + trailer straight behind the clear header so the
          // ciphertext is copied once, not staged through an intermediate unit
          // buffer then copied again behind the header.
          const trailer = new Uint8Array(TRAILER_LEN);
          writeTrailer(trailer, 0, counter, prefix, keyIndex, clearBytes, true);
          const body = [ciphertext, trailer];
          const dst = new Uint8Array(clearBytes + rbspEscapedLength(body));
          dst.set(aad, 0);
          rbspEscapeInto(dst, clearBytes, body);
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

const decodeTransform = (userId: string, trackType: string | undefined) => {
  // Bucket this receiver's perf stats by trackType (falling back to a constant
  // when unlabeled) so a peer's audio and video are counted separately.
  const trackKey = trackType ?? 'unknown';
  // Per-track throttles (one userId per transform); rate-limit the failure and
  // recovery signals to at most once per second each so a flapping track can't
  // flood the host.
  const failureThrottle = createThrottle(1000);
  const notifyFailure = () => {
    if (failureThrottle.tryFire(userId)) {
      self.postMessage({ type: 'e2ee.decryption_failed', userId, trackType });
    }
  };
  const resumedThrottle = createThrottle(1000);
  // Not holding a key yet is the ordinary state while a peer's key is in flight,
  // or right after a rotation whose new keyIndex has not arrived. It gets its own
  // signal rather than being reported as a decryption failure, which a host
  // cannot tell apart from a key mismatch or a tampered frame. Keyed by keyIndex
  // so each new key epoch is announced once.
  const decodeKeyThrottle = createThrottle(1000);
  const notifyMissingDecodeKey = (keyIndex: number) => {
    if (decodeKeyThrottle.tryFire(String(keyIndex))) {
      self.postMessage({ type: 'e2ee.missing_key', userId, keyIndex });
    }
  };
  // Cleartext frames are still forwarded - a peer may legitimately publish plain
  // when the call's encryption mode is `available` - but staying silent would
  // make an unexpected downgrade invisible to the host, so announce it.
  const cleartextThrottle = createThrottle(1000);
  const notifyUnencrypted = () => {
    if (cleartextThrottle.tryFire(userId)) {
      self.postMessage({ type: 'e2ee.unencrypted_frame', userId });
    }
  };

  const iv = new Uint8Array(IV_LEN);
  const ivView = new DataView(iv.buffer);

  // Replay state and failure accounting are scoped to this transform — i.e. this
  // single remote track — so a user's audio/video/screenshare tracks never share
  // a window or a failure count (the latter is what lets e2ee.broken fire).
  const replay = createReplayWindow();
  const failures = createFailureTracker();

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
   * forged frames cannot latch a genuine key invalid.
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
      notifyMissingDecodeKey(keyIndex);
      return;
    }
    // Read-only replay check. A replay or a frame older than the sliding
    // window is dropped silently - these are not true decryption failures.
    if (!replay.peek(frameCounter, ivPrefix)) return;
    try {
      const t0 = perfEnabled ? performance.now() : 0;
      const data = await decrypt(cryptoKey);
      if (perfEnabled)
        recordDecodeCrypto(userId, trackKey, performance.now() - t0);
      // Authenticated: only now is it safe to advance the replay window.
      replay.commit(frameCounter, ivPrefix);
      // Recovery edge: fire only when this track had been failing, throttled so
      // a flapping track can't emit resumed once per frame.
      if (failures.recordSuccess(keyIndex) && resumedThrottle.tryFire(userId)) {
        self.postMessage({
          type: 'e2ee.decryption_resumed',
          userId,
          trackType,
        });
      }
      frame.data = data;
      controller.enqueue(frame);
      bumpDecodeCount(userId, trackKey);
    } catch {
      // recordFailure returns true only on the failure that crosses the
      // tolerance, so `e2ee.broken` fires once per failure run rather than once
      // per frame after the threshold.
      const becameInvalid = failures.recordFailure(keyIndex);
      notifyFailure();
      if (becameInvalid) {
        self.postMessage({ type: 'e2ee.broken', userId, keyIndex, trackType });
      }
    }
  };

  return new TransformStream<EncodedFrame, EncodedFrame>({
    async transform(frame, controller) {
      if (frame.data.byteLength === 0) {
        controller.enqueue(frame);
        bumpDecodeCount(userId, trackKey);
        return;
      }

      const src = new Uint8Array(frame.data);
      const trailer = readTrailer(src);

      if (!trailer) {
        // No trailer. Could be a an AV1 frame (OBU-inline, no trailer) or
        // a genuinely unencrypted frame. Detect AV1 from the OBU stream
        const parsed = parseEncryptedAv1(src);
        if (!parsed) {
          notifyUnencrypted();
          controller.enqueue(frame);
          bumpDecodeCount(userId, trackKey);
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

      const { clearBytes, isRbsp } = trailer;

      // For an RBSP (H264) frame the ciphertext AND the counter/ivPrefix/keyIndex
      // were escaped as one unit, so recover them by un-escaping
      // from the clear header to the end - only the start-code-safe trailer tail
      // (clearBytes/version/magic, read above) stayed in the clear. A non-RBSP
      // frame keeps the whole trailer raw, so the fields read straight off it.
      let { frameCounter, ivPrefix, keyIndex } = trailer;
      let ciphertext: Uint8Array;
      if (isRbsp) {
        const unit = rbspUnescape(src.subarray(clearBytes));
        // Un-escaping drops one byte per escape sequence, so it can leave less
        // than a trailer behind - readTrailer only sized clearBytes against the
        // raw frame. Re-check before reading: a negative trailer offset throws
        // out of transform(), which errors the TransformStream and kills this
        // track's pipeline for the rest of the session. Both clearBytes and the
        // RBSP flag are plaintext, so a relay can forge exactly this shape.
        if (unit.length < TRAILER_LEN) return;
        ({ frameCounter, ivPrefix, keyIndex } = readTrailerIv(unit));
        ciphertext = unit.subarray(0, unit.length - TRAILER_LEN);
      } else {
        ciphertext = src.subarray(clearBytes, src.length - TRAILER_LEN);
      }

      return finishDecode(
        frame,
        controller,
        keyIndex,
        ivPrefix,
        frameCounter,
        async (key) => {
          fillIV(iv, ivView, ivPrefix, frameCounter);
          const aad = clearBytes > 0 ? src.subarray(0, clearBytes) : EMPTY_AAD;
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

/**
 * Pick the transform for a pipeline. Decode frames are always processed; encode
 * frames whose codec the worker can't split fail closed - every frame is dropped
 * (never published in the clear) and the failure is surfaced as an observable
 * `e2ee.encryption_failed`. Previously the unsupported case returned without
 * piping, leaving the encoder's frames to buffer forever with no signal.
 */
const selectTransform = (
  operation: string,
  userId: string,
  codec: string | undefined,
  trackType: string | undefined,
): TransformStream<EncodedFrame, EncodedFrame> => {
  if (operation !== 'encode') return decodeTransform(userId, trackType);
  if (isSupportedCodec(codec)) return encodeTransform(userId, codec, trackType);
  self.postMessage({
    type: 'e2ee.encryption_failed',
    reason: `unsupported codec for E2EE: ${codec}`,
  });
  // A transform that enqueues nothing - every frame is dropped (fail closed).
  return new TransformStream<EncodedFrame, EncodedFrame>({ transform() {} });
};

const setupTransform = ({
  readable,
  writable,
  operation,
  userId,
  codec,
  trackType,
}: {
  readable: ReadableStream;
  writable: WritableStream;
  operation: string;
  userId: string;
  codec?: string;
  trackType?: string;
}) => {
  const transform = selectTransform(operation, userId, codec, trackType);
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
        for (const [key, stat] of decodeStats) {
          if (stat.userId === data.userId) decodeStats.delete(key);
        }
        break;
      case 'cmd.enable_performance_reporting':
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
        missingKeyThrottle.reset();
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
