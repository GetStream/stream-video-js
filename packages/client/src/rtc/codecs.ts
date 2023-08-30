import { isReactNative } from '../helpers/platforms';
import { removeCodec, setPreferredCodec } from '../helpers/sdp-munging';
import { getLogger } from '../logger';

export const getPreferredCodecs = (
  kind: 'audio' | 'video',
  preferredCodec: string,
  codecToRemove?: string,
): RTCRtpCodecCapability[] | undefined => {
  const logger = getLogger(['codecs']);
  if (!('getCapabilities' in RTCRtpSender)) {
    logger?.('warn', 'RTCRtpSender.getCapabilities is not supported');
    return;
  }
  const cap = RTCRtpSender.getCapabilities(kind);
  if (!cap) return;
  const matched: RTCRtpCodecCapability[] = [];
  const partialMatched: RTCRtpCodecCapability[] = [];
  const unmatched: RTCRtpCodecCapability[] = [];
  cap.codecs.forEach((c) => {
    const codec = c.mimeType.toLowerCase();
    logger?.('debug', `Found supported codec: ${codec}`);
    const shouldRemoveCodec =
      codecToRemove && codec === `${kind}/${codecToRemove.toLowerCase()}`;
    if (shouldRemoveCodec) return;
    const matchesCodec = codec === `${kind}/${preferredCodec.toLowerCase()}`;
    if (!matchesCodec) {
      unmatched.push(c);
      return;
    }
    // for h264 codecs that have sdpFmtpLine available, use only if the
    // profile-level-id is 42e01f for cross-browser compatibility
    if (codec === 'h264') {
      if (c.sdpFmtpLine && c.sdpFmtpLine.includes('profile-level-id=42e01f')) {
        matched.push(c);
      } else {
        partialMatched.push(c);
      }
      return;
    }
    matched.push(c);
  });

  const result = [...matched, ...partialMatched, ...unmatched];
  logger?.('info', `Preffered codecs: `, result);
  return result;
};

export const getGenericSdp = async (
  direction: RTCRtpTransceiverDirection,
  isRedEnabled: boolean,
  preferredVideoCodec: string | undefined,
) => {
  const tempPc = new RTCPeerConnection();
  tempPc.addTransceiver('video', { direction });

  // if ('setCodecPreferences' in videoTransceiver) {
  //   const videoCodecPreferences = getPreferredCodecs(
  //     'audio',
  //     preferredVideoCodec ?? 'vp8',
  //   );
  //   videoTransceiver.setCodecPreferences([...(videoCodecPreferences ?? [])]);
  // }

  tempPc.addTransceiver('audio', { direction });
  const preferredAudioCodec = isRedEnabled ? 'red' : 'opus';
  const audioCodecToRemove = !isRedEnabled ? 'red' : undefined;

  // if ('setCodecPreferences' in audioTransceiver) {
  //   const audioCodecPreferences = getPreferredCodecs(
  //     'audio',
  //     preferredAudioCodec,
  //     // audioCodecToRemove,
  //   );
  //   audioTransceiver.setCodecPreferences([...(audioCodecPreferences || [])]);
  // }

  const offer = await tempPc.createOffer();
  let sdp = offer.sdp ?? '';

  if (isReactNative()) {
    if (preferredVideoCodec) {
      sdp = setPreferredCodec(sdp, 'video', preferredVideoCodec);
    }
    sdp = setPreferredCodec(sdp, 'audio', preferredAudioCodec);
    if (audioCodecToRemove) {
      sdp = removeCodec(sdp, 'audio', audioCodecToRemove);
    }
  }

  tempPc.getTransceivers().forEach((t) => {
    t.stop();
  });
  tempPc.close();
  return sdp;
};
