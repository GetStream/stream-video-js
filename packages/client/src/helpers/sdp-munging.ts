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
  if (opusFmtp) {
    const matchDtx = /usedtx=(\d)/.exec(opusFmtp.config);
    const requiredDtxConfig = `usedtx=${enable ? '1' : '0'}`;
    if (matchDtx) {
      const newFmtp = opusFmtp.original.replace(
        /usedtx=(\d)/,
        requiredDtxConfig,
      );
      return sdp.replace(opusFmtp.original, newFmtp);
    } else {
      const newFmtp = `${opusFmtp.original};${requiredDtxConfig}`;
      return sdp.replace(opusFmtp.original, newFmtp);
    }
  }
  return sdp;
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
