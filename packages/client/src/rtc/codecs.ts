import { getOSInfo } from '../client-details';
import { isReactNative } from '../helpers/platforms';
import { isFirefox, isSafari } from '../helpers/browsers';
import type { PreferredCodec } from '../types';

/**
 * Returns back a list of supported publish codecs for the given kind.
 */
export const getSupportedCodecs = (
  kind: 'audio' | 'video',
): RTCRtpCodecCapability[] => {
  if (!('getCapabilities' in RTCRtpSender)) return [];
  const capabilities = RTCRtpSender.getCapabilities(kind);
  if (!capabilities) return [];

  return capabilities.codecs;
};

/**
 * Returns a generic SDP for the given direction.
 * We use this SDP to send it as part of our JoinRequest so that the SFU
 * can use it to determine the client's codec capabilities.
 *
 * @param direction the direction of the transceiver.
 */
export const getGenericSdp = async (direction: RTCRtpTransceiverDirection) => {
  const tempPc = new RTCPeerConnection();
  tempPc.addTransceiver('video', { direction });
  tempPc.addTransceiver('audio', { direction });

  const offer = await tempPc.createOffer();
  const sdp = offer.sdp ?? '';

  tempPc.getTransceivers().forEach((t) => {
    t.stop?.();
  });
  tempPc.close();
  return sdp;
};

/**
 * Returns the optimal video codec for the device.
 */
export const getOptimalVideoCodec = (
  preferredCodec: PreferredCodec | undefined,
): PreferredCodec => {
  if (isReactNative()) {
    const os = getOSInfo()?.name.toLowerCase();
    if (os === 'android') return preferredOr(preferredCodec, 'vp8');
    if (os === 'ios' || os === 'ipados') return 'h264';
    return preferredOr(preferredCodec, 'h264');
  }
  // Safari and Firefox do not have a good support encoding to SVC codecs,
  // so we disable it for them.
  if (isSafari()) return 'h264';
  if (isFirefox()) return 'vp8';
  return preferredOr(preferredCodec, 'vp8');
};

/**
 * Determines if the platform supports the preferred codec.
 * If not, it returns the fallback codec.
 */
const preferredOr = (
  codec: PreferredCodec | undefined,
  fallback: PreferredCodec,
): PreferredCodec => {
  return codec && isCodecSupported(`video/${codec}`) ? codec : fallback;
};

/**
 * Returns whether the codec is supported by the platform.
 *
 * @param codecMimeType the codec to check.
 */
export const isCodecSupported = (codecMimeType: string): boolean => {
  codecMimeType = codecMimeType.toLowerCase();
  const [kind] = codecMimeType.split('/') as ('audio' | 'video')[];
  const codecs = getSupportedCodecs(kind);
  return codecs.some((c) => c.mimeType.toLowerCase() === codecMimeType);
};

/**
 * Returns whether the codec is an SVC codec.
 *
 * @param codecOrMimeType the codec to check.
 */
export const isSvcCodec = (codecOrMimeType: string | undefined) => {
  if (!codecOrMimeType) return false;
  codecOrMimeType = codecOrMimeType.toLowerCase();
  return (
    codecOrMimeType === 'vp9' ||
    codecOrMimeType === 'av1' ||
    codecOrMimeType === 'video/vp9' ||
    codecOrMimeType === 'video/av1'
  );
};
