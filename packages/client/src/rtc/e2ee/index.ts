/**
 * E2EE via WebRTC Encoded Transforms.
 *
 * Uses RTCRtpScriptTransform (W3C standard) when available,
 * falls back to Insertable Streams (createEncodedStreams) on Chrome
 * where RTCRtpScriptTransform support is incomplete.
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

function xorTransform(key) {
  const keyLen = key.length;
  return new TransformStream({
    transform(encodedFrame, controller) {
      const view = new DataView(encodedFrame.data);
      const newData = new ArrayBuffer(encodedFrame.data.byteLength);
      const newView = new DataView(newData);
      for (let i = 0; i < encodedFrame.data.byteLength; ++i) {
        newView.setInt8(i, view.getInt8(i) ^ key.charCodeAt(i % keyLen));
      }
      encodedFrame.data = newData;
      controller.enqueue(encodedFrame);
    },
  });
}

function handleTransform({ readable, writable, key }) {
  readable.pipeThrough(xorTransform(key)).pipeTo(writable);
}

// Standard path: RTCRtpScriptTransform dispatches this event.
if (self.RTCTransformEvent) {
  self.onrtctransform = ({ transformer: { readable, writable, options } }) => {
    handleTransform({ readable, writable, key: options.key });
  };
}

// Insertable Streams path: main thread posts readable/writable via message.
self.onmessage = ({ data }) => handleTransform(data);
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
) => {
  const w = getWorker();
  if (!shouldUseInsertableStreams()) {
    target.transform = new RTCRtpScriptTransform(w, { operation, key });
    return;
  }

  if ((piped ??= new Set()).has(target)) return;
  piped.add(target);
  // @ts-expect-error createEncodedStreams is not in the standard typedefs
  const { readable, writable } = target.createEncodedStreams();
  w.postMessage({ operation, readable, writable, key }, [readable, writable]);
};

export const createEncryptor = (sender: RTCRtpSender, key: string) =>
  attachTransform(sender, key, 'encode');

export const createDecryptor = (receiver: RTCRtpReceiver, key: string) =>
  attachTransform(receiver, key, 'decode');
