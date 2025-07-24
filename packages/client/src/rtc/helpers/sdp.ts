import { parse, write } from 'sdp-transform';

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

/**
 * Enables stereo in the answer SDP based on the offered stereo in the offer SDP.
 *
 * @param offerSdp the offer SDP containing the stereo configuration.
 * @param answerSdp the answer SDP to be modified.
 */
export const enableStereo = (offerSdp: string, answerSdp: string): string => {
  const offeredStereoMids = new Set<string>();
  const parsedOfferSdp = parse(offerSdp);
  for (const media of parsedOfferSdp.media) {
    if (media.type !== 'audio') continue;

    const opus = media.rtp.find((r) => r.codec === 'opus');
    if (!opus) continue;

    for (const fmtp of media.fmtp) {
      if (fmtp.payload === opus.payload && fmtp.config.includes('stereo=1')) {
        offeredStereoMids.add(media.mid!);
      }
    }
  }

  // No stereo offered, return the original answerSdp
  if (offeredStereoMids.size === 0) return answerSdp;

  const parsedAnswerSdp = parse(answerSdp);
  for (const media of parsedAnswerSdp.media) {
    if (media.type !== 'audio' || !offeredStereoMids.has(media.mid!)) continue;

    const opus = media.rtp.find((r) => r.codec === 'opus');
    if (!opus) continue;

    for (const fmtp of media.fmtp) {
      if (fmtp.payload === opus.payload && !fmtp.config.includes('stereo=1')) {
        fmtp.config += ';stereo=1';
      }
    }
  }

  return write(parsedAnswerSdp);
};
