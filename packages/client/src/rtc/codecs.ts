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

/**
 * Returns whether the codec is supported
 */
export const findCodec = (
  mimeType: string,
  fmtpLine: string | undefined,
): RTCRtpCodec | undefined => {
  if (!('getCapabilities' in RTCRtpSender)) return;

  const toSet = (fmtp: string = '') =>
    new Set<string>(fmtp.split(';').map((f) => f.trim().toLowerCase()));

  const equal = (a: Set<string>, b: Set<string>) => {
    if (a.size !== b.size) return false;
    for (const item of a) if (!b.has(item)) return false;
    return true;
  };

  const fmtp = fmtpLine ? toSet(fmtpLine) : new Set<string>();
  mimeType = mimeType.toLowerCase();
  const [kind] = mimeType.split('/');
  const capabilities = RTCRtpSender.getCapabilities(kind);
  if (!capabilities) return;

  const { codecs } = capabilities;
  return codecs.find((c) =>
    c.mimeType.toLowerCase() === mimeType && fmtp.size === 0
      ? true
      : equal(fmtp, toSet(c.sdpFmtpLine)),
  );
};
