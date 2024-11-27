import { describe, expect, it } from 'vitest';
import { enableHighQualityAudio, getPayloadTypeForCodec } from '../sdp-munging';
import { initialSdp as HQAudioSDP } from './hq-audio-sdp';
import { publisherSDP } from './publisher-sdp.mock';

describe('sdp-munging', () => {
  it('enables HighQuality audio for Opus', () => {
    const sdpWithHighQualityAudio = enableHighQualityAudio(HQAudioSDP, '3');
    expect(sdpWithHighQualityAudio).toContain('maxaveragebitrate=510000');
    expect(sdpWithHighQualityAudio).toContain('stereo=1');
  });

  it('extracts payload type for codec', () => {
    const payload = getPayloadTypeForCodec(
      publisherSDP,
      'video/vp9',
      'profile-id=2',
    );
    expect(payload).toBe(100);
  });
});
