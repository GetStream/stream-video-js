export const getPreferredCodecs = (
  kind: 'audio' | 'video',
  preferredCodec: string,
) => {
  if (!('getCapabilities' in RTCRtpSender)) {
    console.warn('RTCRtpSender.getCapabilities is not supported');
    return;
  }
  const cap = RTCRtpSender.getCapabilities(kind);
  console.log('s4e');
  if (!cap) return;
  const matched: RTCRtpCodecCapability[] = [];
  const partialMatched: RTCRtpCodecCapability[] = [];
  const unmatched: RTCRtpCodecCapability[] = [];
  cap.codecs.forEach((c) => {
    const codec = c.mimeType.toLowerCase();
    console.log(c);
    const matchesCodec = codec === `${kind}/${preferredCodec}`;
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
    console.log('matched', matched);
    matched.push(c);
  });

  return [
    ...matched,
    ...partialMatched,
    ...unmatched,
  ] as RTCRtpCodecCapability[];
};

export const getGenericSdp = async (direction: RTCRtpTransceiverDirection) => {
  const tempPc = new RTCPeerConnection();
  tempPc.addTransceiver('audio', { direction });
  tempPc.addTransceiver('video', { direction });

  const offer = await tempPc.createOffer();
  const sdp = offer.sdp;

  tempPc.getTransceivers().forEach((t) => {
    t.stop();
  });
  tempPc.close();
  return sdp;
};
