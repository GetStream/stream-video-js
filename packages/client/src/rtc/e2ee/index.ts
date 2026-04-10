/**
 * E2EE via WebRTC Encoded Transforms.
 *
 * Uses RTCRtpScriptTransform (W3C standard) when available,
 * falls back to Insertable Streams (createEncodedStreams) on Chrome
 * where RTCRtpScriptTransform support is incomplete.
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
 * Encrypted frames carry a 5-byte trailer: [1 byte offset][4 bytes 0xDEADBEEF].
 * The decoder reads the trailer to know how many clear bytes were used,
 * making decryption codec-agnostic.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_Encoded_Transforms
 * @see https://github.com/webrtc/samples/blob/gh-pages/src/content/insertable-streams/endtoend-encryption/js/worker.js
 */

import { isChrome } from '../../helpers/browsers';

/**
 * Checks whether the browser supports Encoded Transforms for E2EE.
 */
export const supportsE2EE = (): boolean =>
  typeof RTCRtpScriptTransform !== 'undefined' ||
  (typeof RTCRtpSender !== 'undefined' &&
    'createEncodedStreams' in RTCRtpSender.prototype);

/**
 * Chrome exposes RTCRtpScriptTransform, but it doesn't seem to work reliably.
 * Use Insertable Streams (createEncodedStreams) there instead.
 */
const shouldUseInsertableStreams = (): boolean =>
  isChrome() &&
  typeof RTCRtpSender !== 'undefined' &&
  'createEncodedStreams' in RTCRtpSender.prototype;

const WORKER_SOURCE = `
'use strict';

const CHECKSUM = 0xDEADBEEF;
const TRAILER_LEN = 5; // 1 byte offset + 4 bytes checksum
const RBSP_FLAG = 0x80; // bit 7 of the offset byte signals RBSP escaping

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
// by 0x00–0x03, preventing fake Annex B start codes in encrypted data.
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

// Reverse of rbspEscape: strip 0x03 after 0x00 0x00 before 0x00–0x03.
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


function getClearByteCount(codec, frameType, data) {
  if (frameType === undefined) return 1; // audio
  if (codec === 'vp8') return frameType === 'key' ? 10 : 3;
  if (codec === 'h264') return h264ClearBytes(data);
  return 0; // VP9 / others
}

function xorPayload(src, dst, offset, key, keyLen, len) {
  for (let i = 0; i < len; ++i) {
    dst[i] = src[i] ^ key.charCodeAt((offset + i) % keyLen);
  }
}

function encodeTransform(key, codec) {
  const keyLen = key.length;
  const isNalu = codec === 'h264';

  return new TransformStream({
    transform(frame, controller) {
      // https://groups.google.com/g/discuss-webrtc/c/5CMOZ4JtERo
      // https://issues.chromium.org/issues/40287616
      if (codec === 'av1') {
        controller.enqueue(frame);
        return;
      }

      const src = new Uint8Array(frame.data);
      const clearBytes = getClearByteCount(codec, frame.type, src);

      if (isNalu && clearBytes > 0) {
        // Encrypt the payload portion
        const encrypted = new Uint8Array(src.length - clearBytes);
        xorPayload(src.subarray(clearBytes), encrypted, clearBytes, key, keyLen, encrypted.length);

        // RBSP-escape to prevent fake start codes
        const escaped = rbspEscape(encrypted);

        // Assemble: [clear header][escaped payload][trailer]
        const dst = new Uint8Array(clearBytes + escaped.length + TRAILER_LEN);
        dst.set(src.subarray(0, clearBytes), 0);
        dst.set(escaped, clearBytes);
        dst[dst.length - TRAILER_LEN] = clearBytes | RBSP_FLAG;
        new DataView(dst.buffer).setUint32(dst.length - 4, CHECKSUM);
        frame.data = dst.buffer;
      } else {
        // Standard path: single-pass XOR, no RBSP escaping
        const dst = new Uint8Array(src.length + TRAILER_LEN);
        for (let i = 0; i < src.length; ++i) {
          dst[i] = i < clearBytes ? src[i] : src[i] ^ key.charCodeAt(i % keyLen);
        }
        dst[src.length] = clearBytes;
        new DataView(dst.buffer).setUint32(src.length + 1, CHECKSUM);
        frame.data = dst.buffer;
      }

      controller.enqueue(frame);
    },
  });
}

function decodeTransform(key) {
  const keyLen = key.length;
  return new TransformStream({
    transform(frame, controller) {
      const src = new Uint8Array(frame.data);

      if (src.length > TRAILER_LEN) {
        const view = new DataView(src.buffer, src.byteOffset, src.byteLength);
        if (view.getUint32(src.length - 4) === CHECKSUM) {
          const raw = src[src.length - TRAILER_LEN];
          const isRbsp = (raw & RBSP_FLAG) !== 0;
          const clearBytes = raw & 0x7F;
          const bodyEnd = src.length - TRAILER_LEN;

          if (isRbsp) {
            // NALU path: unescape, then decrypt
            const unescaped = rbspUnescape(src.subarray(clearBytes, bodyEnd));
            const dst = new Uint8Array(clearBytes + unescaped.length);
            dst.set(src.subarray(0, clearBytes), 0);
            xorPayload(unescaped, dst.subarray(clearBytes), clearBytes, key, keyLen, unescaped.length);
            frame.data = dst.buffer;
          } else {
            // Standard path
            const dst = new Uint8Array(bodyEnd);
            for (let i = 0; i < bodyEnd; ++i) {
              dst[i] = i < clearBytes ? src[i] : src[i] ^ key.charCodeAt(i % keyLen);
            }
            frame.data = dst.buffer;
          }

          controller.enqueue(frame);
          return;
        }
      }

      // No checksum — unencrypted frame, pass through
      controller.enqueue(frame);
    },
  });
}

function handleTransform({ readable, writable, key, operation, codec }) {
  const transform = operation === 'encode'
    ? encodeTransform(key, codec)
    : decodeTransform(key);
  readable.pipeThrough(transform).pipeTo(writable);
}

addEventListener('rtctransform', ({ transformer: { readable, writable, options } }) => {
  handleTransform({ readable, writable, ...options });
});

addEventListener('message', ({ data }) => handleTransform(data));
`;

/** Tracks senders/receivers that already have encoded streams piped. */
let piped: Set<RTCRtpSender | RTCRtpReceiver> | undefined;
let worker: Worker | undefined;
let workerUrl: string | undefined;

const getWorker = () => {
  if (!worker) {
    if (!workerUrl) {
      const blob = new Blob([WORKER_SOURCE], {
        type: 'application/javascript',
      });
      workerUrl = URL.createObjectURL(blob);
    }
    worker = new Worker(workerUrl, { name: 'stream-video-e2ee' });
  }
  return worker;
};

const attachTransform = (
  target: RTCRtpSender | RTCRtpReceiver,
  key: string,
  operation: 'encode' | 'decode',
  codec?: string,
) => {
  const w = getWorker();
  if (!shouldUseInsertableStreams()) {
    target.transform = new RTCRtpScriptTransform(w, {
      operation,
      key,
      codec,
    });
    return;
  }

  if ((piped ??= new Set()).has(target)) return;
  piped.add(target);
  // @ts-expect-error createEncodedStreams is not in the standard typedefs
  const { readable, writable } = target.createEncodedStreams();
  w.postMessage({ operation, readable, writable, key, codec }, [
    readable,
    writable,
  ]);
};

export const createEncryptor = (
  sender: RTCRtpSender,
  key: string,
  codec?: string,
) => attachTransform(sender, key, 'encode', codec);

export const createDecryptor = (receiver: RTCRtpReceiver, key: string) =>
  attachTransform(receiver, key, 'decode');
