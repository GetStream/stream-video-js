import { isChrome } from '../../helpers/browsers';

/**
 * Feature detection and selection policy for the two WebRTC Encoded Transform
 * APIs that E2EE can be attached with.
 *
 * Internal: which API the SDK attaches is an implementation detail of the RTC
 * layer, so nothing here is part of the public surface. Consumers that only need
 * to know whether E2EE can run at all should use `EncryptionManager.isSupported`.
 */

/**
 * Whether the legacy Insertable Streams API (`createEncodedStreams`) exists.
 *
 * Chrome-only, and the reason an RTCPeerConnection carrying E2EE has to be
 * created with the non-standard `encodedInsertableStreams` flag.
 */
export const hasInsertableStreams = (): boolean =>
  typeof RTCRtpSender !== 'undefined' &&
  'createEncodedStreams' in RTCRtpSender.prototype;

/** Whether the standard `RTCRtpScriptTransform` API exists. */
export const hasScriptTransform = (): boolean =>
  typeof RTCRtpScriptTransform !== 'undefined';

/**
 * Decide which Encoded Transform API to attach E2EE with in the current browser.
 *
 * - `'insertable'` - the legacy Insertable Streams (`createEncodedStreams`)
 *    path. The default on Chrome, whose `RTCRtpScriptTransform` is still
 *    unreliable for E2EE.
 * - `'script'` - the standard `RTCRtpScriptTransform` API. The default on
 *    Firefox/Safari, and on Chrome when `forceRtpScriptTransform` is set.
 * - `undefined` - neither API is available, so E2EE is unsupported.
 *
 * @param options.forceRtpScriptTransform - Opt a Chrome-based browser onto
 *        the standard `RTCRtpScriptTransform` API. No effect elsewhere.
 */
export const preferredTransform = (options?: {
  forceRtpScriptTransform?: boolean;
}): 'script' | 'insertable' | undefined => {
  const insertable = hasInsertableStreams();
  const script = hasScriptTransform();
  if (!insertable && !script) return undefined;

  // Chrome's RTCRtpScriptTransform is still unreliable: default Chrome to the
  // Insertable Streams path unless the caller forces the standard API.
  if (isChrome() && !options?.forceRtpScriptTransform) {
    return insertable ? 'insertable' : 'script';
  }

  // Everywhere else (and Chrome with forceRtpScriptTransform): prefer the
  // standard RTCRtpScriptTransform, falling back to Insertable Streams only
  // when it's unavailable.
  return script ? 'script' : 'insertable';
};
