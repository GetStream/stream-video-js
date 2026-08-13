/**
 * E2EE Web Worker entry point. Owns the worker's message interface and wires
 * the encrypt/decrypt transforms into WebRTC Encoded Transforms. The main
 * thread distributes keys by postMessage, and transforms look one up per frame
 * by (userId, keyIndex).
 *
 * ## Wire format
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

import { isSupportedCodec } from './codec';
import { enqueue } from './queue';
import { keyStore } from './keyStore';
import { decodeStats, startPerfReport, stopPerfReport } from './perf';
import { EncodeNotifier, reportError } from './notifications';
import { encodeTransform } from './encode';
import { decodeTransform } from './decode';
import type { EncodedFrame } from './types';

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
  new EncodeNotifier(userId, trackType).failed(
    `unsupported codec for E2EE: ${codec}`,
  );
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
  readable
    .pipeThrough(transform)
    .pipeTo(writable)
    .catch((err: any) => {
      reportError(
        `Transform pipeline error (${operation}, ${userId}): ${
          err?.message || err
        }`,
      );
    });
};

addEventListener('rtctransform', (event) => {
  const { readable, writable, options } = event.transformer;
  // Same queue as message-based setup, so an in-flight key import completes
  // before the transform is wired up.
  enqueue(async () => {
    setupTransform({ readable, writable, ...options });
  }).catch((err: any) => {
    reportError(`Transform setup failed: ${err?.message || err}`);
  });
});

addEventListener('message', ({ data }) => {
  enqueue(async () => {
    switch (data.type) {
      case 'cmd.set_key':
        await keyStore.importKey(data.userId, data.keyIndex, data.rawKey);
        break;
      case 'cmd.set_shared_key':
        await keyStore.importSharedKey(data.keyIndex, data.rawKey);
        break;
      case 'cmd.remove_shared_key':
        keyStore.removeSharedKey(data.keyIndex);
        break;
      case 'cmd.remove_key':
        // Deliberately keeps this user's decode stats: they are still
        // publishing, one epoch was retired.
        keyStore.removeKey(data.userId, data.keyIndex);
        break;
      case 'cmd.remove_all_keys':
        keyStore.removeAllKeys(data.userId);
        decodeStats.removeUser(data.userId);
        break;
      case 'cmd.enable_performance_reporting':
        if (data.enabled) startPerfReport();
        else stopPerfReport();
        break;
      case 'cmd.request_key_state':
        self.postMessage({ type: 'e2ee.key_state', ...keyStore.keyState() });
        break;
      case 'cmd.setup_transform':
        setupTransform(data);
        break;
      default:
        reportError(`Unknown command type: ${data.type}`);
        break;
    }
  }).catch((err: any) => {
    reportError(`Message handler error: ${err?.message || err}`);
  });
});
