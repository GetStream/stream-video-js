import { describe, expect, it } from 'vitest';
import { enableHighQualityAudio } from '../sdp-munging';
import { initialSdp as HQAudioSDP } from './hq-audio-sdp';

describe('sdp-munging', () => {
  it('enables HighQuality audio for Opus', () => {
    const sdpWithHighQualityAudio = enableHighQualityAudio(HQAudioSDP, '3');
    expect(sdpWithHighQualityAudio).toContain('maxaveragebitrate=510000');
    expect(sdpWithHighQualityAudio).toContain('stereo=1');
  });
});
