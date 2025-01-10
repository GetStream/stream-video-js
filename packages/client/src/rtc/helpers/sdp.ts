import { parse } from 'sdp-transform';

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
  if (!sdp) return String(transceiverInitIndex);

  const track = transceiver.sender.track!;
  const parsedSdp = parse(sdp);
  const media = parsedSdp.media.find((m) => {
    return (
      m.type === track.kind &&
      // if `msid` is not present, we assume that the track is the first one
      (m.msid?.includes(track.id) ?? true)
    );
  });
  if (typeof media?.mid !== 'undefined') return String(media.mid);
  if (transceiverInitIndex < 0) return '';
  return String(transceiverInitIndex);
};
