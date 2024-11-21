import * as SDP from 'sdp-transform';

/**
 * Returns and SDP with all the codecs except the given codec removed.
 */
export const preserveCodec = (
  sdp: string,
  mid: string,
  codec: RTCRtpCodec,
): string => {
  const [kind, codecName] = codec.mimeType.toLowerCase().split('/');

  const toSet = (fmtpLine: string) =>
    new Set(fmtpLine.split(';').map((f) => f.trim().toLowerCase()));

  const equal = (a: Set<string>, b: Set<string>) => {
    if (a.size !== b.size) return false;
    for (const item of a) if (!b.has(item)) return false;
    return true;
  };

  const codecFmtp = toSet(codec.sdpFmtpLine || '');
  const parsedSdp = SDP.parse(sdp);
  for (const media of parsedSdp.media) {
    if (media.type !== kind || String(media.mid) !== mid) continue;

    // find the payload id of the desired codec
    const payloads = new Set<number>();
    for (const rtp of media.rtp) {
      if (
        rtp.codec.toLowerCase() === codecName &&
        media.fmtp.some(
          (f) => f.payload === rtp.payload && equal(toSet(f.config), codecFmtp),
        )
      ) {
        payloads.add(rtp.payload);
      }
    }

    // find the corresponding rtx codec by matching apt=<preserved-codec-payload>
    for (const fmtp of media.fmtp) {
      const match = fmtp.config.match(/(apt)=(\d+)/);
      if (!match) continue;
      const [, , preservedCodecPayload] = match;
      if (payloads.has(Number(preservedCodecPayload))) {
        payloads.add(fmtp.payload);
      }
    }

    media.rtp = media.rtp.filter((r) => payloads.has(r.payload));
    media.fmtp = media.fmtp.filter((f) => payloads.has(f.payload));
    media.rtcpFb = media.rtcpFb?.filter((f) => payloads.has(f.payload));
    media.payloads = Array.from(payloads).join(' ');
  }
  return SDP.write(parsedSdp);
};

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
