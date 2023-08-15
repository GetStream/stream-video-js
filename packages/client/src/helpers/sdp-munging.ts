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

type RtcpFb = {
  original: string;
  payload: string;
};

const getRtcpFbLine = (line: string): RtcpFb | undefined => {
  const rtcpFbRegex = /^a=rtcp-fb:(\S+) (\S+)( (\S+))?/i;
  const rtcpFbMatch = rtcpFbRegex.exec(line);
  if (rtcpFbMatch) {
    return {
      original: rtcpFbMatch[0],
      payload: rtcpFbMatch[1],
    };
  }
  const rtcpFbTrrIntRegex = /^a=rtcp-fb:(\d+) trr-int (\d+)/i;
  const rtcpFbTrrIntMatch = rtcpFbTrrIntRegex.exec(line);
  if (rtcpFbTrrIntMatch) {
    return {
      original: rtcpFbTrrIntMatch[0],
      payload: rtcpFbTrrIntMatch[1],
    };
  }
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
  const rtcpFbLines: RtcpFb[] = [];
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
      } else {
        const rtcpFbLine = getRtcpFbLine(line);
        if (rtcpFbLine) {
          rtcpFbLines.push(rtcpFbLine);
        }
      }
    }
  });
  if (media) {
    return {
      media,
      rtpMap,
      fmtp,
      rtcpFbLines,
    };
  }
};

/**
 * Returns a string of codec IDs with the preferred codec ID in front of the other codec IDs.
 * It is used to ensure that a preferred codec is used when decoding a media stream.
 * Example: Suppose we want to prefer VP8 which has id 96
 * 1. If codec order is 100 101 96 97 35 36 102 125 127
 * 2. The function returns 96 100 101 97 35 36 102 125 127
 */
const moveCodecToFront = (codecOrder: string, preferredCodecId: string) => {
  const codecIds = codecOrder.split(' ');
  const index = codecIds.indexOf(preferredCodecId);
  if (index > -1) {
    codecIds.splice(index, 1);
    codecIds.unshift(preferredCodecId);
  }
  return codecIds.join(' ');
};

/**
 * Returns a string of codec IDs with the given codec ID removed
 * It is used to ensure that a codec is disabled when processing a media stream.
 * Example: Suppose we want to prefer RED which has id 63
 * 1. If codec order is 111 63 103 104 9 102 0 8 106 105 13 110 112 113 126
 * 2. The function returns 111 103 104 9 102 0 8 106 105 13 110 112 113 126
 */
const removeCodecFromOrder = (codecOrder: string, codecIdToRemove: string) => {
  const codecIds = codecOrder.split(' ');
  return codecIds.filter((codecID) => codecID !== codecIdToRemove).join(' ');
};

/**
 * Returns an SDP with the preferred codec in front of the other codecs.
 * Example: Suppose we want to prefer VP8
 * 1. find video media specification m=video 9 UDP/TLS/RTP/SAVPF 100 101 96 97 35 36 102 125 127
 * 2. look for specified codec (VP8)  a=rtpmap:96 VP8/90000
 * 3. extract 96 as an identifier of VP8
 * 4. move 96 to the front
 * 5. now media looks like this: m=video 9 UDP/TLS/RTP/SAVPF 96 100 101 97 35 36 102 125 127
 */
export const setPreferredCodec = (
  sdp: string,
  mediaType: 'video' | 'audio',
  preferredCodec: string,
) => {
  const section = getMediaSection(sdp, mediaType);
  if (!section) return sdp;
  const rtpMap = section.rtpMap.find(
    (r) => r.codec.toLowerCase() === preferredCodec.toLowerCase(),
  );
  const codecId = rtpMap?.payload;
  if (!codecId) return sdp;
  const newCodecOrder = moveCodecToFront(section.media.codecOrder, codecId);
  return sdp.replace(
    section.media.original,
    `${section.media.mediaWithPorts} ${newCodecOrder}`,
  );
};

/**
 * Returns an SDP with the specified codec removed.
 * Example: Suppose we want to remove RED
 *  1. find audio media specification m=video 9 UDP/TLS/RTP/SAVPF 100 101 96 97 35 36 102 125 127
 *  2. look for specified codec (RED)  a=rtpmap:127 red/90000
 *  3. extract 127 as an identifier of RED
 *  4. remove 127 from the codec order
 *  5. remove a=rtpmap:127 red/90000
 *  6. remove a=fmtp:127 ...
 */
export const removeCodec = (
  sdp: string,
  mediaType: 'video' | 'audio',
  codecToRemove: string,
): string => {
  const section = getMediaSection(sdp, mediaType);
  const mediaSection = section?.media;
  if (!mediaSection) {
    return sdp;
  }
  const rtpMap = section?.rtpMap.find(
    (r) => r.codec.toLowerCase() === codecToRemove.toLowerCase(),
  );
  const codecId = rtpMap?.payload;
  if (!codecId) {
    return sdp;
  }
  const newCodecOrder = removeCodecFromOrder(mediaSection.codecOrder, codecId);
  const fmtp = section.fmtp.find((f) => f.payload === codecId);
  let newSdp = sdp
    .replace(
      mediaSection.original,
      `${mediaSection.mediaWithPorts} ${newCodecOrder}`,
    )
    .replace(new RegExp(`${rtpMap.original}[\r\n]+`), '') // remove the corresponding rtpmap line
    .replace(fmtp?.original ? new RegExp(`${fmtp?.original}[\r\n]+`) : '', ''); // remove the corresponding fmtp line

  const rtcpFbLines = section.rtcpFbLines
    .filter((r) => r.payload === codecId)
    .map((r) => r.original);
  for (const line of rtcpFbLines) {
    newSdp = newSdp.replace(new RegExp(`${line}[\r\n]+`), ''); // remove the corresponding rtcp-fb line
  }
  return newSdp;
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
