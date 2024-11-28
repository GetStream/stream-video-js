import * as SDP from 'sdp-transform';

type Media = {
  original: string;
  mediaWithPorts: string;
  codecOrder: string;
};

type RtpMap = {
  original: string;
  payload: string;
  codec: string;
};

type Fmtp = {
  original: string;
  payload: string;
  config: string;
};

const getRtpMap = (line: string): RtpMap | undefined => {
  // Example: a=rtpmap:110 opus/48000/2
  const rtpRegex = /^a=rtpmap:(\d*) ([\w\-.]*)(?:\s*\/(\d*)(?:\s*\/(\S*))?)?/;
  // The first captured group is the payload type number, the second captured group is the encoding name, the third captured group is the clock rate, and the fourth captured group is any additional parameters.
  const rtpMatch = rtpRegex.exec(line);
  if (rtpMatch) {
    return {
      original: rtpMatch[0],
      payload: rtpMatch[1],
      codec: rtpMatch[2],
    };
  }
};

const getFmtp = (line: string): Fmtp | undefined => {
  // Example: a=fmtp:111 minptime=10; useinbandfec=1
  const fmtpRegex = /^a=fmtp:(\d*) (.*)/;
  const fmtpMatch = fmtpRegex.exec(line);
  // The first captured group is the payload type number, the second captured group is any additional parameters.
  if (fmtpMatch) {
    return {
      original: fmtpMatch[0],
      payload: fmtpMatch[1],
      config: fmtpMatch[2],
    };
  }
};

/**
 * gets the media section for the specified media type.
 * The media section contains the media type, port, codec, and payload type.
 * Example: m=video 9 UDP/TLS/RTP/SAVPF 100 101 96 97 35 36 102 125 127
 */
const getMedia = (line: string, mediaType: string): Media | undefined => {
  const regex = new RegExp(`(m=${mediaType} \\d+ [\\w/]+) ([\\d\\s]+)`);
  const match = regex.exec(line);
  if (match) {
    return {
      original: match[0],
      mediaWithPorts: match[1],
      codecOrder: match[2],
    };
  }
};

const getMediaSection = (sdp: string, mediaType: 'video' | 'audio') => {
  let media: Media | undefined;
  const rtpMap: RtpMap[] = [];
  const fmtp: Fmtp[] = [];
  let isTheRequiredMediaSection = false;
  sdp.split(/(\r\n|\r|\n)/).forEach((line) => {
    const isValidLine = /^([a-z])=(.*)/.test(line);
    if (!isValidLine) return;
    /*
      NOTE: according to https://www.rfc-editor.org/rfc/rfc8866.pdf
      Each media description starts with an "m=" line and continues to the next media description or the end of the whole session description, whichever comes first
    */
    const type = line[0];
    if (type === 'm') {
      const _media = getMedia(line, mediaType);
      isTheRequiredMediaSection = !!_media;
      if (_media) {
        media = _media;
      }
    } else if (isTheRequiredMediaSection && type === 'a') {
      const rtpMapLine = getRtpMap(line);
      const fmtpLine = getFmtp(line);
      if (rtpMapLine) {
        rtpMap.push(rtpMapLine);
      } else if (fmtpLine) {
        fmtp.push(fmtpLine);
      }
    }
  });
  if (media) {
    return {
      media,
      rtpMap,
      fmtp,
    };
  }
};

/**
 * Gets the fmtp line corresponding to opus
 */
const getOpusFmtp = (sdp: string): Fmtp | undefined => {
  const section = getMediaSection(sdp, 'audio');
  const rtpMap = section?.rtpMap.find((r) => r.codec.toLowerCase() === 'opus');
  const codecId = rtpMap?.payload;
  if (codecId) {
    return section?.fmtp.find((f) => f.payload === codecId);
  }
};

/**
 * Returns an SDP with DTX enabled or disabled.
 */
export const toggleDtx = (sdp: string, enable: boolean): string => {
  const opusFmtp = getOpusFmtp(sdp);
  if (!opusFmtp) return sdp;

  const matchDtx = /usedtx=(\d)/.exec(opusFmtp.config);
  const requiredDtxConfig = `usedtx=${enable ? '1' : '0'}`;
  const newFmtp = matchDtx
    ? opusFmtp.original.replace(/usedtx=(\d)/, requiredDtxConfig)
    : `${opusFmtp.original};${requiredDtxConfig}`;

  return sdp.replace(opusFmtp.original, newFmtp);
};

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
      if (rtp.codec.toLowerCase() !== codecName) continue;
      const match =
        // vp8 doesn't have any fmtp, we preserve it without any additional checks
        codecName === 'vp8'
          ? true
          : media.fmtp.some(
              (f) =>
                f.payload === rtp.payload && equal(toSet(f.config), codecFmtp),
            );
      if (match) {
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
