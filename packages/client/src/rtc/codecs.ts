import { getOSInfo } from '../client-details';
import { isReactNative } from '../helpers/platforms';
import { isFirefox, isSafari } from '../helpers/browsers';
import { combineComparators, Comparator } from '../sorting';
import type { PreferredCodec } from '../types';

/**
 * Returns back a list of sorted codecs, with the preferred codec first.
 *
 * @param kind the kind of codec to get.
 * @param preferredCodec the codec to prioritize (vp8, h264, vp9, av1...).
 * @param codecToRemove the codec to exclude from the list.
 */
export const getPreferredCodecs = (
  kind: 'audio' | 'video',
  preferredCodec: string,
  codecToRemove?: string,
): RTCRtpCodecCapability[] | undefined => {
  if (!('getCapabilities' in RTCRtpReceiver)) return;

  const capabilities = RTCRtpReceiver.getCapabilities(kind);
  if (!capabilities) return;

  const preferred: RTCRtpCodecCapability[] = [];
  const unpreferred: Record<string, RTCRtpCodecCapability[]> = {};

  const preferredCodecMimeType = `${kind}/${preferredCodec.toLowerCase()}`;
  const codecToRemoveMimeType =
    codecToRemove && `${kind}/${codecToRemove.toLowerCase()}`;

  for (const codec of capabilities.codecs) {
    const codecMimeType = codec.mimeType.toLowerCase();
    if (codecMimeType === codecToRemoveMimeType) continue; // skip this codec
    if (codecMimeType === preferredCodecMimeType) {
      preferred.push(codec);
    } else {
      (unpreferred[codecMimeType] ??= []).push(codec);
    }
  }

  // return a sorted list of codecs, with the preferred codecs first
  return preferred
    .concat(Object.values(unpreferred).flatMap((v) => v))
    .sort(combineComparators(h264Comparator, vp9Comparator));
};

/**
 * A comparator for sorting H264 codecs.
 * We want to prioritize the baseline codec with profile-level-id is 42e01f
 * and packetization-mode=0 for maximum cross-browser compatibility.
 */
const h264Comparator: Comparator<RTCRtpCodecCapability> = (a, b) => {
  const aMimeType = a.mimeType.toLowerCase();
  const bMimeType = b.mimeType.toLowerCase();
  if (aMimeType !== 'video/h264' || bMimeType !== 'video/h264') return 0;

  const aFmtpLine = a.sdpFmtpLine;
  const bFmtpLine = b.sdpFmtpLine;
  if (!aFmtpLine || !bFmtpLine) return 0;

  // h264 is a special case, we want to prioritize the baseline codec with
  // profile-level-id is 42e01f and packetization-mode=0 for maximum
  // cross-browser compatibility.
  const aIsBaseline = aFmtpLine.includes('profile-level-id=42e01f');
  const bIsBaseline = bFmtpLine.includes('profile-level-id=42e01f');
  if (aIsBaseline && !bIsBaseline) return -1;
  if (!aIsBaseline && bIsBaseline) return 1;

  const aPacketizationMode0 =
    aFmtpLine.includes('packetization-mode=0') ||
    !aFmtpLine.includes('packetization-mode');
  const bPacketizationMode0 =
    bFmtpLine.includes('packetization-mode=0') ||
    !bFmtpLine.includes('packetization-mode');
  if (aPacketizationMode0 && !bPacketizationMode0) return -1;
  if (!aPacketizationMode0 && bPacketizationMode0) return 1;

  return 0;
};

/**
 * A comparator for sorting VP9 codecs.
 * We want to prioritize the profile-id=0 codec for maximum compatibility.
 */
const vp9Comparator: Comparator<RTCRtpCodecCapability> = (a, b) => {
  const aMimeType = a.mimeType.toLowerCase();
  const bMimeType = b.mimeType.toLowerCase();
  if (aMimeType !== 'video/vp9' || bMimeType !== 'video/vp9') return 0;

  const aFmtpLine = a.sdpFmtpLine;
  const bFmtpLine = b.sdpFmtpLine;
  if (!aFmtpLine || !bFmtpLine) return 0;

  // for vp9, we want to prioritize the profile-id=0 codec
  // for maximum cross-browser compatibility.
  const aIsProfile0 = aFmtpLine.includes('profile-id=0');
  const bIsProfile0 = bFmtpLine.includes('profile-id=0');
  if (aIsProfile0 && !bIsProfile0) return -1;
  if (!aIsProfile0 && bIsProfile0) return 1;

  return 0;
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
    if (os === 'ios' || os === 'ipados') return 'h264';
    return preferredOr(preferredCodec, 'h264');
  }
  if (isSafari()) return 'h264';
  if (isFirefox()) return 'vp8';
  return preferredOr(preferredCodec, 'vp8');
};

/**
 * Returns whether the H264 codec supports the baseline profile.
 */
const h264SupportsBaseline = (codec: RTCRtpCodecCapability) => {
  const fmtpLine = codec.sdpFmtpLine;
  if (!fmtpLine) return false;
  const packetization0 =
    fmtpLine.includes('packetization-mode=0') ||
    !fmtpLine.includes('packetization-mode');
  return fmtpLine.includes('profile-level-id=42e01f') && packetization0;
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

  const codecMimeType = `video/${codec}`.toLowerCase();
  const isSupported = capabilities.codecs.some(
    (c) =>
      c.mimeType.toLowerCase() === codecMimeType &&
      (codec === 'h264' ? h264SupportsBaseline(c) : true),
  );
  return isSupported ? codec : fallback;
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
    codecOrMimeType === 'video/vp9' ||
    codecOrMimeType === 'av1' ||
    codecOrMimeType === 'video/av1'
  );
};
