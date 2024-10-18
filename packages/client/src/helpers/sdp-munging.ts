import * as SDP from 'sdp-transform';

/**
 * Enables high-quality audio through SDP munging for the given trackMid.
 *
 * @param sdp the SDP to munge.
 * @param trackMid the trackMid.
 * @param maxBitrate the max bitrate to set.
 */
export const enableHighQualityAudio = (
  sdp: string,
  trackMid: string,
  maxBitrate: number = 510000,
): string => {
  maxBitrate = Math.max(Math.min(maxBitrate, 510000), 96000);

  const parsedSdp = SDP.parse(sdp);
  const audioMedia = parsedSdp.media.find(
    (m) => m.type === 'audio' && String(m.mid) === trackMid,
  );

  if (!audioMedia) return sdp;

  const opusRtp = audioMedia.rtp.find((r) => r.codec === 'opus');
  if (!opusRtp) return sdp;

  const opusFmtp = audioMedia.fmtp.find((f) => f.payload === opusRtp.payload);
  if (!opusFmtp) return sdp;

  // enable stereo, if not already enabled
  if (opusFmtp.config.match(/stereo=(\d)/)) {
    opusFmtp.config = opusFmtp.config.replace(/stereo=(\d)/, 'stereo=1');
  } else {
    opusFmtp.config = `${opusFmtp.config};stereo=1`;
  }

  // set maxaveragebitrate, to the given value
  if (opusFmtp.config.match(/maxaveragebitrate=(\d*)/)) {
    opusFmtp.config = opusFmtp.config.replace(
      /maxaveragebitrate=(\d*)/,
      `maxaveragebitrate=${maxBitrate}`,
    );
  } else {
    opusFmtp.config = `${opusFmtp.config};maxaveragebitrate=${maxBitrate}`;
  }

  return SDP.write(parsedSdp);
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
