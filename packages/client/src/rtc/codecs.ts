import { getOSInfo } from '../client-details';

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
 * Returns the optimal codec for RN.
 */
export const getRNOptimalCodec = () => {
  const osName = getOSInfo()?.name.toLowerCase();
  // in ipads it was noticed that if vp8 codec is used
  // then the bytes sent is 0 in the outbound-rtp
  // so we are forcing h264 codec for ipads
  if (osName === 'ipados') return 'h264';
  if (osName === 'android') return 'vp8';
  return undefined;
};

/**
 * Returns whether the codec is an SVC codec.
 *
 * @param codec the codec to check.
 */
export const isSvcCodec = (codec: string | undefined | null) => {
  return codec === 'vp9' || codec === 'av1';
};
