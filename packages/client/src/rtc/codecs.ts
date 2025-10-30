import { removeCodecsExcept } from './helpers/sdp';

/**
 * Returns a generic SDP for the given direction.
 * We use this SDP to send it as part of our JoinRequest so that the SFU
 * can use it to determine the client's codec capabilities.
 *
 * @param direction the direction of the transceiver.
 * @param codecToKeep the codec mime type to keep (video/h264 or audio/opus).
 */
export const getGenericSdp = async (
  direction: RTCRtpTransceiverDirection,
  codecToKeep?: string,
) => {
  const tempPc = new RTCPeerConnection();
  tempPc.addTransceiver('video', { direction });
  tempPc.addTransceiver('audio', { direction });

  const offer = await tempPc.createOffer();
  const sdp = codecToKeep
    ? removeCodecsExcept(offer.sdp ?? '', toMimeType(codecToKeep))
    : (offer.sdp ?? '');

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
 * Converts the given codec to a mime-type format when necessary.
 * e.g.: `vp9` -> `video/vp9`
 */
const toMimeType = (codec: string, kind: 'video' | 'audio' = 'video') =>
  codec.includes('/') ? codec : `${kind}/${codec}`;
