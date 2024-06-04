import { getLogger } from '../logger';

export const getPreferredCodecs = (
  kind: 'audio' | 'video',
  preferredCodec: string,
  codecToRemove?: string,
): RTCRtpCodecCapability[] | undefined => {
  const logger = getLogger(['codecs']);
  if (!('getCapabilities' in RTCRtpReceiver)) {
    logger('warn', 'RTCRtpReceiver.getCapabilities is not supported');
    return;
  }
  const cap = RTCRtpReceiver.getCapabilities(kind);
  if (!cap) return;
  const matched: RTCRtpCodecCapability[] = [];
  const partialMatched: RTCRtpCodecCapability[] = [];
  const unmatched: RTCRtpCodecCapability[] = [];
  cap.codecs.forEach((c) => {
    const codec = c.mimeType.toLowerCase();
    logger('debug', `Found supported codec: ${codec}`);
    const shouldRemoveCodec =
      codecToRemove && codec === `${kind}/${codecToRemove.toLowerCase()}`;
    if (shouldRemoveCodec) return;
    const matchesCodec = codec === `${kind}/${preferredCodec.toLowerCase()}`;
    if (!matchesCodec) {
      unmatched.push(c);
      return;
    }
    // for h264 codecs that have sdpFmtpLine available, use only if the
    // profile-level-id is 42e01f for cross-browser compatibility
    if (codec === 'h264') {
      if (c.sdpFmtpLine && c.sdpFmtpLine.includes('profile-level-id=42e01f')) {
        matched.push(c);
      } else {
        partialMatched.push(c);
      }
      return;
    }
    matched.push(c);
  });

  return [...matched, ...partialMatched, ...unmatched];
};

export const getGenericSdp = async (direction: RTCRtpTransceiverDirection) => {
  const tempPc = new RTCPeerConnection();
  tempPc.addTransceiver('video', { direction });
  tempPc.addTransceiver('audio', { direction });

  const offer = await tempPc.createOffer();
  let sdp = offer.sdp ?? '';

  tempPc.getTransceivers().forEach((t) => {
    t.stop?.();
  });
  tempPc.close();
  return sdp;
};
