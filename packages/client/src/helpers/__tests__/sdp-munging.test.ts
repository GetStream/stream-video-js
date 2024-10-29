import { describe, expect, it } from 'vitest';
import { enableHighQualityAudio, toggleDtx } from '../sdp-munging';
import { initialSdp as HQAudioSDP } from './hq-audio-sdp';

describe('sdp-munging', () => {
  it('Supporting the enabling and disabling of DTX audio codec', () => {
    const sdp = `m=audio 54312 RTP/AVP 101
a=rtpmap:101 opus/48000/2
a=fmtp:101 maxplaybackrate=16000; sprop-maxcapturerate=16000;
maxaveragebitrate=20000; stereo=1; useinbandfec=1; usedtx=0
a=ptime:40
a=maxptime:40`;
    const dtxEnabledSdp = toggleDtx(sdp, true);
    expect(dtxEnabledSdp.search('usedtx=1') !== -1).toBeTruthy();
    const dtxDisabledSdp = toggleDtx(dtxEnabledSdp, false);
    expect(dtxDisabledSdp.search('usedtx=0') !== -1).toBeTruthy();
  });

  it('enables HighQuality audio for Opus', () => {
    const sdpWithHighQualityAudio = enableHighQualityAudio(HQAudioSDP, '3');
    expect(sdpWithHighQualityAudio).toContain('maxaveragebitrate=510000');
    expect(sdpWithHighQualityAudio).toContain('stereo=1');
  });
});
