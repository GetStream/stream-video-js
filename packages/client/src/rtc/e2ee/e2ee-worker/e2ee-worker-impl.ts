/**
 * E2EE Web Worker entry point. Wires AES-GCM encrypt/decrypt into WebRTC
 * Encoded Transforms. The main thread distributes keys by postMessage, and
 * transforms look one up per frame by (userId, keyIndex).
 *
 * Frame layout is [clear header][ciphertext + GCM tag][20B trailer], so 36
 * bytes of overhead. The trailer holds:
 *   [4B frameCounter][8B ivPrefix][1B keyIndex][2B clearBytes|flags]
 *   [1B version][4B 0xE2EEFEED]
 *
 * The clear header keeps codec headers readable so the SFU can detect keyframes
 * and select layers: 1 byte for Opus, 10/3 for VP8 and VP9 (key/delta), and for
 * H264 everything up to the first slice NALU + 2, with the encrypted tail
 * RBSP-escaped against fake start codes. It doubles as the AAD, so the SFU can
 * read it but decrypt still detects tampering.
 *
 * The 12-byte IV is [ivPrefix][frameCounter]. `ivPrefix` is random per key
 * import and travels in the trailer, so IVs stay unique even when the host
 * imports the same raw key twice.
 *
 * rollup-plugin-inline-worker bundles this into the function
 * `../e2ee-worker.ts` exports.
 *
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

/** Minimal shape of an RTCEncodedVideo/AudioFrame. */
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
// Keyed by trackType, unique per local sender, so a vp8 camera and a vp8 screen
// share are reported apart instead of summed.
const encodeStats = new Map<
  string,
  { userId: string; codec: string; count: number; maxCryptoMs: number }
>();
// Keyed by (userId, trackType) for the same reason.
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
  if (perfInterval) return; // a second interval would leak
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
 * In-flight pipelines, so `dispose` tears them down instead of leaving them to
 * fail per frame once the crypto state is cleared.
 */
const activePipelines = new Set<AbortController>();

/**
 * The encoder holds no key, so every outgoing frame is dropped. Without this
 * the host just sees black video with nothing to act on. Throttled per user,
 * and stops on its own once a key arrives.
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
  // trackType is unique per sender; fall back to codec when it is unlabeled.
  const trackKey = trackType ?? codec ?? 'unknown';
  const codecKey = codec ?? 'unknown';
  const iv = new Uint8Array(IV_LEN);
  const ivView = new DataView(iv.buffer);

  // Signals the first failure of a run, then stays quiet until a frame encrypts
  // again. Re-arming on success stops one early transient error from hiding a
  // later permanent one, such as the counter hard limit.
  let encodeFailed = false;
  const signalEncodeFailure = (reason: string) => {
    if (encodeFailed) return;
    encodeFailed = true;
    self.postMessage({
      type: 'e2ee.encryption_failed',
      userId,
      trackType,
      reason,
    });
  };

  /**
   * Times the encryption, emits the frame, reports failures. `produce` returns
   * the new bytes, or null when it already dropped the frame with its own
   * reason. Any throw drops the frame; it is never emitted in the clear.
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
      // No payload to encrypt.
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

      return finishEncode(frame, controller, async () => {
        // A key/delta type marks a video frame. An audio-only profile has no
        // clear-byte rule for one, so drop it rather than ship a whole-frame,
        // unescaped encrypt the SFU cannot read and a NALU packetizer would
        // split. Checked before the counter, so a dropped frame costs no IV.
        if (profile.audioOnly && frame.type !== undefined) {
          signalEncodeFailure(
            `no clear-byte rule for video on codec ${codecKey}`,
          );
          return null;
        }
        const src = new Uint8Array(frame.data);
        const clearBytes = profile.clearBytes(frame.type, src);
        if (clearBytes > MAX_CLEAR_BYTES) {
          // Writing this would overflow into the RBSP flag bit.
          signalEncodeFailure('clearBytes exceeds trailer capacity');
          return null;
        }
        // Throws at the 32-bit ceiling; finishEncode catches it, so the track
        // fails closed instead of reusing an IV.
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
          // Escape ciphertext and trailer as one unit: the counter bytes could
          // otherwise form a fake Annex-B start code that libwebrtc's H264
          // packetizer would split on.
          //
          // The last 7 trailer bytes survive untouched, since the RBSP flag
          // holds the clearBytes high byte at >= 0x80 and breaks any zero run.
          // The decoder needs them to locate the unit.
          //
          // Escaping behind the clear header copies the ciphertext once.|RBSP_FLAG, version, magic) are start-code
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
  // Counts a peer's audio and video apart.
  const trackKey = trackType ?? 'unknown';
  // One transform is one track, so `userId` is constant: each throttle holds a
  // single entry and limits that track alone.
  const failureThrottle = createThrottle(1000);
  /**
   * True once a `decryption_failed` reached the host. Pairs the two signals:
   * only a delivered failure needs clearing, and clearing it re-arms this.
   */
  let failureReported = false;
  const notifyFailure = () => {
    if (failureThrottle.tryFire(userId)) {
      failureReported = true;
      self.postMessage({ type: 'e2ee.decryption_failed', userId, trackType });
    }
  };
  /**
   * Not throttled, on purpose: this is an edge, not a level, so a throttle
   * would discard the transition for good and leave the host latched on
   * `decryption_failed` for a healthy track. Pairing bounds the rate instead.
   */
  const notifyResumed = () => {
    if (!failureReported) return;
    failureReported = false;
    self.postMessage({ type: 'e2ee.decryption_resumed', userId, trackType });
  };
  // A key in flight, or a rotation whose keyIndex has not arrived, are both
  // normal. Reported as a decryption failure the host could not tell them from
  // a key mismatch or tampering. Keyed by keyIndex: one signal per epoch.
  const decodeKeyThrottle = createThrottle(1000);
  const notifyMissingDecodeKey = (keyIndex: number) => {
    if (decodeKeyThrottle.tryFire(String(keyIndex))) {
      self.postMessage({
        type: 'e2ee.missing_key',
        userId,
        keyIndex,
        trackType,
      });
    }
  };
  // Still forwarded, since a peer may publish plain when the call's mode is
  // `available`. Announced anyway, or a downgrade would be invisible.
  const cleartextThrottle = createThrottle(1000);
  const notifyUnencrypted = () => {
    if (cleartextThrottle.tryFire(userId)) {
      self.postMessage({ type: 'e2ee.unencrypted_frame', userId, trackType });
    }
  };

  const iv = new Uint8Array(IV_LEN);
  const ivView = new DataView(iv.buffer);

  // Per track, so a user's audio, video and screen share never share a window
  // or a failure count. The separate count is what lets e2ee.broken fire.
  const replay = createReplayWindow();
  const failures = createFailureTracker();

  /**
   * Gates on key and replay, decrypts, emits, then records failure or recovery.
   * `decrypt` throws on a GCM tag failure, dropping the frame. Separate from
   * the framing parse so the trust ordering lives in one place.
   *
   * Trust ordering (the SFrame/SRTP rule): a relay can forge `frameCounter`,
   * `ivPrefix` and `keyIndex`, which are plaintext in the trailer, so nothing
   * changes trust state until GCM authenticates. Hence peek before, commit
   * after. The failure counter is diagnostic only - it gates `e2ee.broken`,
   * never the decrypt attempt - so forged frames cannot mark a key invalid.
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
    // No state change. A replay or an out-of-window frame is dropped silently;
    // neither is a decryption failure.
    if (!replay.peek(frameCounter, ivPrefix)) return;
    try {
      const t0 = perfEnabled ? performance.now() : 0;
      const data = await decrypt(cryptoKey);
      if (perfEnabled)
        recordDecodeCrypto(userId, trackKey, performance.now() - t0);
      // Authenticated: only now is it safe to advance the replay window.
      replay.commit(frameCounter, ivPrefix);
      // Independent on purpose: the count is per keyIndex, but
      // `decryption_failed` is per track, so a track recovering on a NEW
      // keyIndex must still clear it. Gating on recordSuccess would latch the
      // host on failed forever.
      failures.recordSuccess(keyIndex);
      notifyResumed();
      frame.data = data;
      controller.enqueue(frame);
      bumpDecodeCount(userId, trackKey);
    } catch {
      // True only on the failure crossing the tolerance, so `e2ee.broken` fires
      // once per run, not once per frame.
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
        notifyUnencrypted();
        controller.enqueue(frame);
        bumpDecodeCount(userId, trackKey);
        return;
      }

      const { clearBytes, isRbsp } = trailer;

      // An RBSP (H264) frame escaped the ciphertext together with the counter,
      // ivPrefix and keyIndex, so un-escape to recover them; only the trailer
      // tail read above stayed clear. A non-RBSP frame keeps the trailer raw.
      let { frameCounter, ivPrefix, keyIndex } = trailer;
      let ciphertext: Uint8Array;
      if (isRbsp) {
        const unit = rbspUnescape(src.subarray(clearBytes));
        // Un-escaping can leave less than a trailer, since readTrailer sized
        // clearBytes against the raw frame. A negative offset would throw out
        // of transform() and kill this track's pipeline for the session, and a
        // relay can forge the shape: clearBytes and the flag are plaintext.
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
 * Decode always runs. An encode whose codec the worker cannot split fails
 * closed: it still installs a transform, but one that drops every frame, since
 * returning without one leaves the encoder buffering forever with no signal.
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
    userId,
    trackType,
    reason: `unsupported codec for E2EE: ${codec}`,
  });
  // Enqueues nothing: every frame is dropped.
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
      if (abort.signal.aborted) return; // clean shutdown
      self.postMessage({
        type: 'e2ee.error',
        message: `Transform pipeline error (${operation}, ${userId}): ${
          err?.message || err
        }`,
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
  // Same queue as message-based setup, so an in-flight key import completes
  // before the transform is wired up.
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
