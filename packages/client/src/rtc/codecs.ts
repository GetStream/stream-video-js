import { getOSInfo } from '../client-details';
import { isReactNative } from '../helpers/platforms';
import { isFirefox, isSafari } from '../helpers/browsers';
import type { PreferredCodec } from '../types';

/**
 * Returns back a list of sorted codecs, with the preferred codec first.
 *
 * @param kind the kind of codec to get.
 * @param preferredCodec the codec to prioritize (vp8, h264, vp9, av1...).
 * @param codecToRemove the codec to exclude from the list.
 * @param codecPreferencesSource the source of the codec preferences.
 */
export const getPreferredCodecs = (
  kind: 'audio' | 'video',
  preferredCodec: string,
  codecToRemove: string | undefined,
  codecPreferencesSource: 'sender' | 'receiver',
): RTCRtpCodec[] | undefined => {
  const source =
    codecPreferencesSource === 'receiver' ? RTCRtpReceiver : RTCRtpSender;
  if (!('getCapabilities' in source)) return;

  const capabilities = source.getCapabilities(kind);
  if (!capabilities) return;

  const preferred: RTCRtpCodecCapability[] = [];
  const partiallyPreferred: RTCRtpCodecCapability[] = [];
  const unpreferred: RTCRtpCodecCapability[] = [];

  const preferredCodecMimeType = `${kind}/${preferredCodec.toLowerCase()}`;
  const codecToRemoveMimeType =
    codecToRemove && `${kind}/${codecToRemove.toLowerCase()}`;

  for (const codec of capabilities.codecs) {
    const codecMimeType = codec.mimeType.toLowerCase();

    const shouldRemoveCodec = codecMimeType === codecToRemoveMimeType;
    if (shouldRemoveCodec) continue; // skip this codec

    const isPreferredCodec = codecMimeType === preferredCodecMimeType;
    if (!isPreferredCodec) {
      unpreferred.push(codec);
      continue;
    }

    // h264 is a special case, we want to prioritize the baseline codec with
    // profile-level-id is 42e01f and packetization-mode=0 for maximum
    // cross-browser compatibility.
    // this branch covers the other cases, such as vp8.
    if (codecMimeType !== 'video/h264') {
      preferred.push(codec);
      continue;
    }

    const sdpFmtpLine = codec.sdpFmtpLine;
    if (!sdpFmtpLine || !sdpFmtpLine.includes('profile-level-id=42')) {
      // this is not the baseline h264 codec, prioritize it lower
      partiallyPreferred.push(codec);
      continue;
    }

    if (sdpFmtpLine.includes('packetization-mode=1')) {
      preferred.unshift(codec);
    } else {
      preferred.push(codec);
    }
  }

  // return a sorted list of codecs, with the preferred codecs first
  return [...preferred, ...partiallyPreferred, ...unpreferred];
};

/**
 * Returns a generic SDP for the given direction.
 * We use this SDP to send it as part of our JoinRequest so that the SFU
 * can use it to determine client's codec capabilities.
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
    if (os === 'ios' || os === 'ipados') {
      return supportsH264Baseline() ? 'h264' : 'vp8';
    }
    return preferredOr(preferredCodec, 'h264');
  }
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
  if (!codec) return fallback;
  if (!('getCapabilities' in RTCRtpSender)) return fallback;
  const capabilities = RTCRtpSender.getCapabilities('video');
  if (!capabilities) return fallback;

  // Safari and Firefox do not have a good support encoding to SVC codecs,
  // so we disable it for them.
  if (isSvcCodec(codec) && (isSafari() || isFirefox())) return fallback;

  const { codecs } = capabilities;
  const codecMimeType = `video/${codec}`.toLowerCase();
  return codecs.some((c) => c.mimeType.toLowerCase() === codecMimeType)
    ? codec
    : fallback;
};

/**
 * Returns whether the platform supports the H264 baseline codec.
 */
const supportsH264Baseline = (): boolean => {
  if (!('getCapabilities' in RTCRtpSender)) return false;
  const capabilities = RTCRtpSender.getCapabilities('video');
  if (!capabilities) return false;
  return capabilities.codecs.some(
    (c) =>
      c.mimeType.toLowerCase() === 'video/h264' &&
      c.sdpFmtpLine?.includes('profile-level-id=42e01f'),
  );
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
