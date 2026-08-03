import { isChrome } from '../../helpers/browsers';

/**
 * Detection and selection policy for the two WebRTC Encoded Transform APIs.
 * Internal: which one the SDK attaches is an RTC-layer detail. Consumers want
 * `EncryptionManager.isSupported` instead.
 */

/**
 * Chrome only, and the reason an RTCPeerConnection carrying E2EE needs the
 * non-standard `encodedInsertableStreams` flag.
 */
export const hasInsertableStreams = (): boolean =>
  typeof RTCRtpSender !== 'undefined' &&
  'createEncodedStreams' in RTCRtpSender.prototype;

/** Whether the standard `RTCRtpScriptTransform` API exists. */
export const hasScriptTransform = (): boolean =>
  typeof RTCRtpScriptTransform !== 'undefined';

/**
 * Which Encoded Transform API to attach E2EE with here.
 *
 * - `'insertable'`: legacy Insertable Streams. Used on Chrome, where
 *   `RTCRtpScriptTransform` is still unreliable for E2EE.
 * - `'script'`: the standard API. Used everywhere else.
 * - `undefined`: neither exists, so E2EE cannot run.
 */
export const preferredTransform = (): 'script' | 'insertable' | undefined => {
  const insertable = hasInsertableStreams();
  // Chrome's RTCRtpScriptTransform is still unreliable for E2EE.
  if (isChrome() && insertable) return 'insertable';
  if (hasScriptTransform()) return 'script';
  return insertable ? 'insertable' : undefined;
};
