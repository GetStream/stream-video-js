import { getWorker } from './worker';

/**
 * Chrome exposes RTCRtpScriptTransform, but it doesn't seem to work reliably.
 * Use Insertable Streams (createEncodedStreams) there instead.
 */
const shouldUseInsertableStreams = (): boolean =>
  typeof navigator !== 'undefined' &&
  navigator.userAgent?.includes('Chrome') &&
  typeof RTCRtpSender !== 'undefined' &&
  'createEncodedStreams' in RTCRtpSender.prototype;

/** Tracks senders/receivers that already have encoded streams piped. */
let piped: WeakSet<RTCRtpSender | RTCRtpReceiver> | undefined;

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

  if ((piped ??= new WeakSet()).has(target)) return;
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
