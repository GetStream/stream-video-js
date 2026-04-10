/**
 * Checks whether the browser supports Encoded Transforms for E2EE.
 */
export const supportsE2EE = (): boolean =>
  typeof RTCRtpScriptTransform !== 'undefined' ||
  (typeof RTCRtpSender !== 'undefined' &&
    'createEncodedStreams' in RTCRtpSender.prototype);
