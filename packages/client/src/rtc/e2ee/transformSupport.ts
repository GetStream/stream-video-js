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
 * - `'insertable'`: legacy Insertable Streams. Default on Chrome, where
 *   `RTCRtpScriptTransform` is still unreliable for E2EE.
 * - `'script'`: the standard API. Default elsewhere, and on Chrome when
 *   `forceRtpScriptTransform` is set.
 * - `undefined`: neither exists, so E2EE cannot run.
 */
export const preferredTransform = (options?: {
  forceRtpScriptTransform?: boolean;
}): 'script' | 'insertable' | undefined => {
  const insertable = hasInsertableStreams();
  const script = hasScriptTransform();
  if (!insertable && !script) return undefined;

  // Chrome's RTCRtpScriptTransform is still unreliable for E2EE.
  if (isChrome() && !options?.forceRtpScriptTransform) {
    return insertable ? 'insertable' : 'script';
  }

  // Everywhere else, prefer the standard API.
  return script ? 'script' : 'insertable';
};
