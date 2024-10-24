import { getOSInfo } from '../client-details';
import { isReactNative } from '../helpers/platforms';
import { isFirefox, isSafari } from '../helpers/browsers';
import { TrackType } from '../gen/video/sfu/models/models';
import type { PreferredCodec } from '../types';

/**
 * Returns back a list of sorted codecs, with the preferred codec first.
 *
 * @param preferredCodecMimeType the codec to prioritize (video/vp8, video/h264, video/vp9, video/av1...).
 */
export const getPreferredCodecs = (
  preferredCodecMimeType: string,
): RTCRtpCodecCapability[] | undefined => {
  if (!('getCapabilities' in RTCRtpSender)) return;

  const [kind] = preferredCodecMimeType.split('/');
  const capabilities = RTCRtpSender.getCapabilities(kind);
  if (!capabilities) return;

  const preferred: RTCRtpCodecCapability[] = [];
  const partiallyPreferred: RTCRtpCodecCapability[] = [];
  const unpreferred: RTCRtpCodecCapability[] = [];

  preferredCodecMimeType = preferredCodecMimeType.toLowerCase();
  for (const codec of capabilities.codecs) {
    const codecMimeType = codec.mimeType.toLowerCase();

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
    if (!sdpFmtpLine || !sdpFmtpLine.includes('profile-level-id=42e01f')) {
      // this is not the baseline h264 codec, prioritize it lower
      partiallyPreferred.push(codec);
      continue;
    }

    // packetization-mode mode is optional; when not present it defaults to 0:
    // https://datatracker.ietf.org/doc/html/rfc6184#section-6.2
    if (
      sdpFmtpLine.includes('packetization-mode=0') ||
      !sdpFmtpLine.includes('packetization-mode')
    ) {
      preferred.unshift(codec);
    } else {
      preferred.push(codec);
    }
  }

  // return a sorted list of codecs, with the preferred codecs first
  return [...preferred, ...partiallyPreferred, ...unpreferred];
};

/**
 * Returns an ordered list of preferred codecs for the given track type.
 *
 * @param trackType the type of track.
 * @param preferredCodec the preferred codec to prioritize.
 */
export const getCodecPreferences = (
  trackType: TrackType,
  preferredCodec?: string,
): RTCRtpCodecCapability[] | undefined => {
  return trackType === TrackType.VIDEO
    ? getPreferredCodecs(`video/${preferredCodec || 'vp8'}`)
    : trackType === TrackType.AUDIO
      ? getPreferredCodecs(`audio/${preferredCodec || 'opus'}`)
      : undefined;
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
  if (!('getCapabilities' in RTCRtpSender)) return false;

  codecMimeType = codecMimeType.toLowerCase();
  const [kind] = codecMimeType.split('/');
  const capabilities = RTCRtpSender.getCapabilities(kind);
  if (!capabilities) return false;

  const { codecs } = capabilities;
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
