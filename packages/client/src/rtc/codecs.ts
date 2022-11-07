import * as SDPTransform from 'sdp-transform';
import type { Codec } from '../gen/video/sfu/models/models';

export const defaultVideoPublishEncodings: RTCRtpEncodingParameters[] = [
  {
    rid: 'f',
    active: true,
    maxBitrate: 1280000,
  },
  {
    rid: 'h',
    active: true,
    scaleResolutionDownBy: 2.0,
    maxBitrate: 768000,
  },
  {
    rid: 'q',
    active: true,
    scaleResolutionDownBy: 4.0,
    maxBitrate: 384000,
  },
];

export const getPreferredCodecs = (kind: string, videoCodec: string) => {
  if (!('getCapabilities' in RTCRtpSender)) {
    console.warn('RTCRtpSender.getCapabilities is not supported');
    return;
  }
  const cap = RTCRtpSender.getCapabilities(kind);
  console.log('s4e');
  if (!cap) return;
  const matched: RTCRtpCodecCapability[] = [];
  const partialMatched: RTCRtpCodecCapability[] = [];
  const unmatched: RTCRtpCodecCapability[] = [];
  cap.codecs.forEach((c) => {
    const codec = c.mimeType.toLowerCase();
    if (codec === 'audio/opus') {
      matched.push(c);
      return;
    }
    console.log(c);
    const matchesVideoCodec = codec === `video/${videoCodec}`;
    if (!matchesVideoCodec) {
      unmatched.push(c);
      return;
    }
    // for h264 codecs that have sdpFmtpLine available, use only if the
    // profile-level-id is 42e01f for cross-browser compatibility
    if (videoCodec === 'h264') {
      if (c.sdpFmtpLine && c.sdpFmtpLine.includes('profile-level-id=42e01f')) {
        matched.push(c);
      } else {
        partialMatched.push(c);
      }
      return;
    }
    console.log('matched', matched);
    matched.push(c);
  });

  return [
    ...matched,
    ...partialMatched,
    ...unmatched,
  ] as RTCRtpCodecCapability[];
};

export const getSenderCodecs = (kind: string, pc?: RTCPeerConnection) => {
  if (!('getCapabilities' in RTCRtpSender)) {
    console.warn('RTCRtpSender.getCapabilities is not supported');
    return getCodecsFromPeerConnection(pc, kind, 'sendonly');
  }
  console.log('sender cap', RTCRtpSender.getCapabilities(kind));
  return RTCRtpSender.getCapabilities(kind)?.codecs.forEach(toCodec) ?? [];
};

export const getReceiverCodecs = async (
  kind: string,
  pc?: RTCPeerConnection,
) => {
  if (!('getCapabilities' in RTCRtpReceiver)) {
    console.warn('RTCRtpReceiver.getCapabilities is not supported');
    return getCodecsFromPeerConnection(pc, kind, 'recvonly');
  }
  console.log('receiver cap', RTCRtpReceiver.getCapabilities(kind));
  return RTCRtpReceiver.getCapabilities(kind)?.codecs.map(toCodec) ?? [];
};

const toCodec = (codec: RTCRtpCodecCapability): Codec => ({
  hwAccelerated: true,
  clockRate: codec.clockRate,
  fmtpLine: codec.sdpFmtpLine || '',
  mime: codec.mimeType,
});

const getCodecsFromPeerConnection = async (
  pc: RTCPeerConnection | undefined,
  kind: string,
  direction: RTCRtpTransceiverDirection,
) => {
  let sdp =
    direction === 'sendonly'
      ? pc?.localDescription?.sdp
      : direction === 'recvonly'
      ? pc?.remoteDescription?.sdp
      : null;

  if (!sdp) {
    const tempPc = new RTCPeerConnection();
    const transceiver = tempPc.addTransceiver(kind);
    transceiver.direction = direction;

    const offer = await tempPc.createOffer();
    sdp = offer.sdp;
    tempPc.close();
  }

  const parsedSdp = SDPTransform.parse(sdp || '');
  const supportedCodecs: Codec[] = [];
  parsedSdp.media.forEach((media) => {
    if (media.type === kind) {
      media.rtp.forEach((rtp) => {
        const fmtpLine = media.fmtp.find((f) => f.payload === rtp.payload);
        supportedCodecs.push({
          hwAccelerated: true,
          clockRate: rtp.rate ?? 0,
          fmtpLine: fmtpLine?.config ?? '',
          mime: `${kind}/${rtp.codec}`,
        });
      });
    }
  });

  return supportedCodecs;
};
