import * as SDP from 'sdp-transform';

/**
 * Gets the payload type for the given codec.
 */
export const getPayloadTypeForCodec = (
  sdp: string,
  mimeType: string,
  fmtpLine: string | undefined,
): number => {
  mimeType = mimeType.toLowerCase();
  const parsedSdp = SDP.parse(sdp);
  const [kind, codec] = mimeType.split('/');
  const media = parsedSdp.media.find((m) => m.type === kind);
  if (!media) return 0;

  const fmtp = media.fmtp.find((f) => f.config === fmtpLine);
  const rtp = media.rtp.find(
    (r) => r.codec.toLowerCase() === codec && r.payload === fmtp?.payload,
  );
  return rtp?.payload ?? 0;
};

/**
 * Extracts the mid from the transceiver or the SDP.
 *
 * @param transceiver the transceiver.
 * @param transceiverInitIndex the index of the transceiver in the transceiver's init array.
 * @param sdp the SDP.
 */
export const extractMid = (
  transceiver: RTCRtpTransceiver,
  transceiverInitIndex: number,
  sdp: string | undefined,
): string => {
  if (transceiver.mid) return transceiver.mid;
  if (!sdp) return '';

  const track = transceiver.sender.track!;
  const parsedSdp = SDP.parse(sdp);
  const media = parsedSdp.media.find((m) => {
    return (
      m.type === track.kind &&
      // if `msid` is not present, we assume that the track is the first one
      (m.msid?.includes(track.id) ?? true)
    );
  });
  if (typeof media?.mid !== 'undefined') return String(media.mid);
  if (transceiverInitIndex === -1) return '';
  return String(transceiverInitIndex);
};
