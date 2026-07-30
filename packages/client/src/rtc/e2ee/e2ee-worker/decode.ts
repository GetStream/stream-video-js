/**
 * Decrypt side of the E2EE transform.
 *
 * **Codec-agnostic on purpose**: the format is self-describing, so the decoder
 * takes no codec hint. It reads the trailer, recovers the IV fields (un-escaping
 * first on the H264 RBSP path), and decrypts.
 *
 * A frame with no recognizable trailer is forwarded unchanged and reported as
 * `unencrypted_frame`: a peer may legitimately publish plain when the call's
 * mode allows it, and a downgrade must not be silent.
 *
 * @see encode.ts for the inverse
 */

import { EMPTY_AAD, IV_LEN, TRAILER_LEN } from './constants';
import { rbspUnescape } from './codec';
import { readTrailer, readTrailerIv } from './utils';
import {
  createFailureTracker,
  createReplayWindow,
  fillIV,
  getKey,
} from './crypto';
import { decodeStats } from './perf';
import { DecodeNotifier } from './notifications';
import type { EncodedFrame, FrameController } from './types';

export const decodeTransform = (
  userId: string,
  trackType: string | undefined,
) => {
  // Counts a peer's audio and video apart.
  const trackKey = trackType ?? 'unknown';
  const stats = decodeStats.track(`${userId}/${trackKey}`, {
    userId,
    trackType: trackKey,
  });
  const notify = new DecodeNotifier(userId, trackType);
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
      notify.missingKey(keyIndex);
      return;
    }
    // No state change. A replay or an out-of-window frame is dropped silently;
    // neither is a decryption failure.
    if (!replay.peek(frameCounter, ivPrefix)) return;
    try {
      const t0 = stats.startCrypto();
      const data = await decrypt(cryptoKey);
      stats.endCrypto(t0);
      // Authenticated: only now is it safe to advance the replay window.
      replay.commit(frameCounter, ivPrefix);
      // Independent on purpose: the count is per keyIndex, but
      // `decryption_failed` is per track, so a track recovering on a NEW
      // keyIndex must still clear it. Gating on recordSuccess would latch the
      // host on failed forever.
      failures.recordSuccess(keyIndex);
      notify.resumed();
      frame.data = data;
      controller.enqueue(frame);
      stats.bump();
    } catch {
      // True only on the failure crossing the tolerance, so `e2ee.broken` fires
      // once per run, not once per frame.
      const becameInvalid = failures.recordFailure(keyIndex);
      notify.failed();
      if (becameInvalid) notify.broken(keyIndex);
    }
  };

  return new TransformStream<EncodedFrame, EncodedFrame>({
    async transform(frame, controller) {
      if (frame.data.byteLength === 0) {
        controller.enqueue(frame);
        stats.bump();
        return;
      }

      const src = new Uint8Array(frame.data);
      const trailer = readTrailer(src);

      if (!trailer) {
        notify.unencrypted();
        controller.enqueue(frame);
        stats.bump();
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
