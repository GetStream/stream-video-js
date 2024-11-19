import { describe, expect, it } from 'vitest';
import {
  enableHighQualityAudio,
  preserveCodec,
  toggleDtx,
} from '../sdp-munging';
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

  it('preserves the preferred codec', () => {
    const sdp = `v=0
o=- 8608371809202407637 2 IN IP4 127.0.0.1
s=-
t=0 0
a=extmap-allow-mixed
a=msid-semantic: WMS 52fafc21-b8bb-4f4f-8072-86a29cb6590e
a=group:BUNDLE 0
m=video 9 UDP/TLS/RTP/SAVPF 98 100 99 101
c=IN IP4 0.0.0.0
a=rtpmap:98 VP9/90000
a=rtpmap:99 rtx/90000
a=rtpmap:100 VP9/90000
a=rtpmap:101 rtx/90000
a=fmtp:98 profile-id=0
a=fmtp:99 apt=98
a=fmtp:100 profile-id=2
a=fmtp:101 apt=100
a=rtcp:9 IN IP4 0.0.0.0
a=rtcp-fb:98 goog-remb
a=rtcp-fb:98 transport-cc
a=rtcp-fb:98 ccm fir
a=rtcp-fb:98 nack
a=rtcp-fb:98 nack pli
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=extmap:1 urn:ietf:params:rtp-hdrext:toffset
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:3 urn:3gpp:video-orientation
a=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id
a=extmap:12 https://aomediacodec.github.io/av1-rtp-spec/#dependency-descriptor-rtp-header-extension
a=extmap:14 http://www.webrtc.org/experiments/rtp-hdrext/video-layers-allocation00
a=setup:actpass
a=mid:0
a=msid:52fafc21-b8bb-4f4f-8072-86a29cb6590e 1bd1c5c2-d3cc-4490-ac0c-70b187242232
a=sendonly
a=ice-ufrag:LvRk
a=ice-pwd:IpBRr2Rrg9TkOgayjYqALhPY
a=fingerprint:sha-256 18:DE:8F:ED:E6:A2:0C:99:A8:25:AB:C9:F8:3D:91:4C:3E:9F:B4:1F:22:87:A7:3C:85:8F:F3:51:09:A7:E3:FA
a=ice-options:trickle
a=ssrc:3192778601 cname:yYSN5R+RG2j3luO7
a=ssrc:3192778601 msid:52fafc21-b8bb-4f4f-8072-86a29cb6590e 1bd1c5c2-d3cc-4490-ac0c-70b187242232
a=ssrc:283365205 cname:yYSN5R+RG2j3luO7
a=ssrc:283365205 msid:52fafc21-b8bb-4f4f-8072-86a29cb6590e 1bd1c5c2-d3cc-4490-ac0c-70b187242232
a=ssrc-group:FID 3192778601 283365205
a=rtcp-mux
a=rtcp-rsize`;
    const target = preserveCodec(sdp, '0', {
      mimeType: 'video/VP9',
      clockRate: 90000,
      sdpFmtpLine: 'profile-id=0',
    });
    expect(target).toContain('VP9');
    expect(target).not.toContain('profile-id=2');
  });
});
