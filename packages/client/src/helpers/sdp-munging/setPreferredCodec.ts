/**
 * Returns the ID of the codec specified in the SDP.
 * The ID is the first match of the regex in the SDP.
 * The regex matches a=rtpmap:ID CODEC/...
 * Example: a=rtpmap:96 VP8/90000
 */
const extractIdOfRtpMap = (sdp: string, codec: string) => {
  const regex = new RegExp(`a=rtpmap:(\\d+) ${codec}/.+`, 'i');
  const match = sdp.match(regex);
  return match && match[1];
};

/**
 * Returns the media section for the specified media type.
 * The media section contains the media type, port, codec, and payload type.
 * Example: m=video 9 UDP/TLS/RTP/SAVPF 100 101 96 97 35 36 102 125 127
 * The function returns an object with the original media section, the media section without the port, and the codec order.
 */
const getMediaSection = (sdp: string, mediaType: 'video' | 'audio') => {
  const regex = new RegExp(`(m=${mediaType} \\d+ [\\w/]+) ([\\d\\s]+)`);
  const match = sdp.match(regex);
  if (match) {
    return {
      original: match[0],
      mediaWithPorts: match[1],
      codecOrder: match[2],
    };
  }
  return null;
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
 * Returns an SDP with the preferred codec in front of the other codecs.
 * Example: Suppose we want to prefer VP8
 * 1. look for specified codec (VP8)  a=rtpmap:96 VP8/90000
 * 2. extract 96 as an identifier of VP8
 * 3. find video media specification m=video 9 UDP/TLS/RTP/SAVPF 100 101 96 97 35 36 102 125 127
 * 4. move 96 to the front
 * 5. now media looks like this: m=video 9 UDP/TLS/RTP/SAVPF 96 100 101 97 35 36 102 125 127
 */
export const setPreferredCodec = (
  sdp: string,
  mediaType: 'video' | 'audio',
  preferredCodec: string,
) => {
  const mediaSection = getMediaSection(sdp, mediaType);
  if (!mediaSection) {
    return sdp;
  }
  const codecId = extractIdOfRtpMap(sdp, preferredCodec);
  if (!codecId) {
    return sdp;
  }
  const newCodecOrder = moveCodecToFront(mediaSection.codecOrder, codecId);
  return sdp.replace(
    mediaSection.original,
    `${mediaSection.mediaWithPorts} ${newCodecOrder}`,
  );
};
