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
 * Sets the start bitrate for the VP9, H264, and AV1 codecs in the SDP.
 *
 * @param offerSdp the offer SDP to modify.
 * @param maxBitrateKbps the maximum bitrate in kbps.
 * @param startBitrateFactor the factor (0-1) to multiply with maxBitrateKbps to get the start bitrate.
 * @param targetMid the media ID to target.
 */
export const setStartBitrate = (
  offerSdp: string,
  maxBitrateKbps: number,
  startBitrateFactor: number,
  targetMid: string,
): string => {
  // start bitrate should be between 300kbps and max-bitrate-kbps
  // Clamp to max first, then ensure minimum of 300 (but never exceed max)
  const startBitrate = Math.min(
    maxBitrateKbps,
    Math.max(300, startBitrateFactor * maxBitrateKbps),
  );
  const parsedSdp = parse(offerSdp);
  const targetCodecs = new Set(['av1', 'vp9', 'h264']);

  for (const media of parsedSdp.media) {
    if (media.type !== 'video') continue;
    if (String(media.mid) !== targetMid) continue;

    for (const rtp of media.rtp) {
      if (!targetCodecs.has(rtp.codec.toLowerCase())) continue;

      // Find existing fmtp entry for this payload
      // Guard against media.fmtp being undefined when SDP has no a=fmtp lines
      const fmtpList = media.fmtp ?? (media.fmtp = []);
      const existingFmtp = fmtpList.find(
        (fmtp) => fmtp.payload === rtp.payload,
      );

      if (existingFmtp) {
        // Append to existing fmtp if not already present
        // Guard against undefined or empty config from malformed SDP
        const config = existingFmtp.config ?? '';
        if (!config.includes('x-google-start-bitrate')) {
          existingFmtp.config = config
            ? `${config};x-google-start-bitrate=${startBitrate}`
            : `x-google-start-bitrate=${startBitrate}`;
        }
      } else {
        // Create new fmtp entry if none exists
        fmtpList.push({
          payload: rtp.payload,
          config: `x-google-start-bitrate=${startBitrate}`,
        });
      }
    }
  }
  return write(parsedSdp);
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

/**
 * Removes all codecs from the SDP except the specified codec.
 *
 * @param sdp the SDP to modify.
 * @param codecMimeTypeToKeep the codec mime type to keep (video/h264 or audio/opus).
 * @param fmtpProfileToKeep the fmtp profile to keep (e.g. 'profile-level-id=42e01f' or multiple segments like 'profile-level-id=64001f;packetization-mode=1').
 */
export const removeCodecsExcept = (
  sdp: string,
  codecMimeTypeToKeep: string,
  fmtpProfileToKeep: string | undefined,
): string => {
  const [kind, codec] = toMimeType(codecMimeTypeToKeep).split('/');
  if (!kind || !codec) return sdp;

  const parsed = parse(sdp);
  for (const media of parsed.media) {
    if (media.type !== kind) continue;

    // Build a set of payloads to KEEP: all payloads whose rtp.codec matches codec
    let payloadsToKeep = new Set<number>();
    for (const rtp of media.rtp) {
      if (rtp.codec.toLowerCase() !== codec) continue;
      payloadsToKeep.add(rtp.payload);
    }

    // If a specific fmtp profile is requested, only keep payloads whose fmtp config matches it
    if (fmtpProfileToKeep) {
      const filtered = new Set<number>();
      const required = new Set(fmtpProfileToKeep.split(';'));
      for (const fmtp of media.fmtp) {
        if (
          payloadsToKeep.has(fmtp.payload) &&
          required.difference(new Set(fmtp.config.split(';'))).size === 0
        ) {
          filtered.add(fmtp.payload);
        }
      }
      payloadsToKeep = filtered;
    }

    // If no payloads to keep AND no fmtpProfile was specified, skip modifications (preserve SDP as-is)
    if (payloadsToKeep.size === 0 && !fmtpProfileToKeep) continue;

    // Keep RTX payloads that are associated with kept primary payloads via apt
    // RTX mappings look like: a=fmtp:<rtxPayload> apt=<primaryPayload>
    for (const fmtp of media.fmtp) {
      const matches = /\s*apt\s*=\s*(\d+)\s*/i.exec(fmtp.config);
      if (!matches) continue;

      const primaryPayloadApt = Number(matches[1]);
      if (!payloadsToKeep.has(primaryPayloadApt)) continue;
      payloadsToKeep.add(fmtp.payload);
    }

    // Filter rtp, fmtp and rtcpFb entries
    media.rtp = media.rtp.filter((rtp) => payloadsToKeep.has(rtp.payload));
    media.fmtp = media.fmtp.filter((fmtp) => payloadsToKeep.has(fmtp.payload));
    media.rtcpFb = media.rtcpFb?.filter((fb) =>
      typeof fb.payload === 'number' ? payloadsToKeep.has(fb.payload) : true,
    );

    // Update the m= line payload list to only the kept payloads, preserving original order
    const payloads: number[] = [];
    for (const id of (media.payloads || '').split(/\s+/)) {
      const payload = Number(id);
      if (!payloadsToKeep.has(payload)) continue;
      payloads.push(payload);
    }
    media.payloads = payloads.join(' ');
  }

  return write(parsed);
};

/**
 * Converts the given codec to a mime-type format when necessary.
 * e.g.: `vp9` -> `video/vp9`
 */
const toMimeType = (codec: string, kind: 'video' | 'audio' = 'video') =>
  codec.includes('/') ? codec : `${kind}/${codec}`;
