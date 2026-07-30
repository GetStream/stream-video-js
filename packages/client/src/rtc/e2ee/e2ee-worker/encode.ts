/**
 * Encrypt side of the E2EE transform: plaintext frame in,
 * `[clear header][ciphertext + GCM tag][20B trailer]` out.
 *
 * **Fail closed, always.** Every error path here drops the frame. A frame is
 * never forwarded in the clear because encryption failed.
 *
 * @see decode.ts for the inverse
 */

import { EMPTY_AAD, IV_LEN, MAX_CLEAR_BYTES, TRAILER_LEN } from './constants';
import {
  boundarySeedZeros,
  getCodecProfile,
  rbspEscapeInto,
  rbspEscapedLength,
} from './codec';
import { writeTrailer } from './utils';
import { fillIV, getLatestKey, nextFrameCounter } from './crypto';
import { encodeStats } from './perf';
import { EncodeNotifier, notifyMissingEncodeKey } from './notifications';
import type { EncodedFrame, FrameController } from './types';

export const encodeTransform = (
  userId: string,
  codec: string | undefined,
  trackType: string | undefined,
) => {
  const profile = getCodecProfile(codec);
  const isNalu = profile.rbsp;
  // trackType is unique per sender; fall back to codec when it is unlabeled.
  const trackKey = trackType ?? codec ?? 'unknown';
  const codecKey = codec ?? 'unknown';
  const stats = encodeStats.track(trackKey, {
    userId,
    trackType: trackKey,
    codec: codecKey,
  });
  const notify = new EncodeNotifier(userId, trackType);
  const iv = new Uint8Array(IV_LEN);
  const ivView = new DataView(iv.buffer);

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
      const t0 = stats.startCrypto();
      const out = await produce();
      stats.endCrypto(t0);
      if (!out) return;
      frame.data = out.buffer;
      controller.enqueue(frame);
      notify.recovered();
      stats.bump();
    } catch (err: any) {
      notify.failed(err?.message || String(err));
    }
  };

  return new TransformStream<EncodedFrame, EncodedFrame>({
    async transform(frame, controller) {
      // No payload to encrypt.
      if (frame.data.byteLength === 0) {
        controller.enqueue(frame);
        stats.bump();
        return;
      }

      const entry = getLatestKey(userId);
      if (!entry) {
        notifyMissingEncodeKey(userId);
        return;
      }

      const { key: cryptoKey, keyIndex, ivPrefix: prefix } = entry;

      return finishEncode(frame, controller, async () => {
        // A key/delta type marks a video frame. An audio-only profile has no
        // clear-byte rule for one, so drop it rather than ship a whole-frame,
        // unescaped encrypt the SFU cannot read and a NALU packetizer would
        // split. Checked before the counter, so a dropped frame costs no IV.
        if (profile.audioOnly && frame.type !== undefined) {
          notify.failed(`no clear-byte rule for video on codec ${codecKey}`);
          return null;
        }
        const src = new Uint8Array(frame.data);
        const clearBytes = profile.clearBytes(frame.type, src);
        if (clearBytes > MAX_CLEAR_BYTES) {
          // Writing this would overflow into the RBSP flag bit.
          notify.failed('clearBytes exceeds trailer capacity');
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
          // Escape ciphertext and trailer as one unit: random ciphertext or
          // the counter bytes could otherwise form a fake Annex-B start code
          // that libwebrtc's H264 packetizer would split on. The escaper is
          // seeded with the clear header's trailing zeros so a start code
          // cannot form across the clear/encrypted boundary either.
          //
          // The last 7 trailer bytes survive escaping untouched: the RBSP flag
          // holds the clearBytes high byte at >= 0x80, which breaks any zero
          // run before it can reach them. The decoder reads them off the raw
          // frame tail to locate the unit.
          //
          // Escaping straight behind the clear header copies the ciphertext
          // once, instead of staging it through an intermediate unit buffer
          // and copying it again.
          const trailer = new Uint8Array(TRAILER_LEN);
          writeTrailer(trailer, 0, counter, prefix, keyIndex, clearBytes, true);
          const body = [ciphertext, trailer];
          const seed = boundarySeedZeros(aad);
          const dst = new Uint8Array(
            clearBytes + rbspEscapedLength(body, seed),
          );
          dst.set(aad, 0);
          rbspEscapeInto(dst, clearBytes, body, seed);
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
