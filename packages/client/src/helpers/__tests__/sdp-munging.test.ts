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

  it('handles ios munging', () => {
    const sdp = `v=0
o=- 525780719364332676 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
a=extmap-allow-mixed
a=msid-semantic: WMS BF3AFE62-88F8-4189-99D7-7CAE159205E3
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 127 103 35 36 104 105 106
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:SAkq
a=ice-pwd:FYHHro0VWRO8CjI/M1VG5vRw
a=ice-options:trickle renomination
a=fingerprint:sha-256 03:5B:16:0E:E1:7B:FE:4F:9A:5C:AC:CF:08:21:4B:49:CE:53:79:E6:97:AE:4E:73:F8:43:34:C3:11:F7:6D:E7
a=setup:actpass
a=mid:0
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
a=sendonly
a=msid:BF3AFE62-88F8-4189-99D7-7CAE159205E3 6013DC02-A0A5-43A9-9D41-9D4A89648A42
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:96 H264/90000
a=rtcp-fb:96 goog-remb
a=rtcp-fb:96 transport-cc
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c29
a=rtpmap:97 rtx/90000
a=fmtp:97 apt=96
a=rtpmap:98 H264/90000
a=rtcp-fb:98 goog-remb
a=rtcp-fb:98 transport-cc
a=rtcp-fb:98 ccm fir
a=rtcp-fb:98 nack
a=rtcp-fb:98 nack pli
a=fmtp:98 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e029
a=rtpmap:99 rtx/90000
a=fmtp:99 apt=98
a=rtpmap:100 VP8/90000
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:127 VP9/90000
a=rtcp-fb:127 goog-remb
a=rtcp-fb:127 transport-cc
a=rtcp-fb:127 ccm fir
a=rtcp-fb:127 nack
a=rtcp-fb:127 nack pli
a=rtpmap:103 rtx/90000
a=fmtp:103 apt=127
a=rtpmap:35 AV1/90000
a=rtcp-fb:35 goog-remb
a=rtcp-fb:35 transport-cc
a=rtcp-fb:35 ccm fir
a=rtcp-fb:35 nack
a=rtcp-fb:35 nack pli
a=rtpmap:36 rtx/90000
a=fmtp:36 apt=35
a=rtpmap:104 red/90000
a=rtpmap:105 rtx/90000
a=fmtp:105 apt=104
a=rtpmap:106 ulpfec/90000
a=rid:q send
a=rid:h send
a=rid:f send
a=simulcast:send q;h;f`;
    const target = preserveCodec(sdp, '0', {
      mimeType: 'video/H264',
      clockRate: 90000,
      sdpFmtpLine:
        'profile-level-id=42e029;packetization-mode=1;level-asymmetry-allowed=1',
    });
    expect(target).toContain('H264');
    expect(target).toContain('profile-level-id=42e029');
    expect(target).not.toContain('profile-level-id=640c29');
    expect(target).not.toContain('VP9');
    expect(target).not.toContain('AV1');
  });

  it('works with iOS RN vp8', () => {
    const sdp = `v=0
o=- 2055959380019004946 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
a=extmap-allow-mixed
a=msid-semantic: WMS FE2B3B06-61D7-4ACC-A4EF-76441C116E47
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 127 103 35 36 104 105 106
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:gCgh
a=ice-pwd:bz18EOLBL9+kSJfLiVOyU4RP
a=ice-options:trickle renomination
a=fingerprint:sha-256 6B:04:36:6D:E6:92:B5:68:DA:30:CF:53:46:14:49:5B:48:3E:B9:F7:06:B4:E8:85:B1:8C:B3:1C:EB:E8:F8:16
a=setup:actpass
a=mid:0
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
a=sendonly
a=msid:FE2B3B06-61D7-4ACC-A4EF-76441C116E47 93FCE555-1DA2-4721-901C-5D263E11DF23
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:96 H264/90000
a=rtcp-fb:96 goog-remb
a=rtcp-fb:96 transport-cc
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c29
a=rtpmap:97 rtx/90000
a=fmtp:97 apt=96
a=rtpmap:98 H264/90000
a=rtcp-fb:98 goog-remb
a=rtcp-fb:98 transport-cc
a=rtcp-fb:98 ccm fir
a=rtcp-fb:98 nack
a=rtcp-fb:98 nack pli
a=fmtp:98 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e029
a=rtpmap:99 rtx/90000
a=fmtp:99 apt=98
a=rtpmap:100 VP8/90000
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:127 VP9/90000
a=rtcp-fb:127 goog-remb
a=rtcp-fb:127 transport-cc
a=rtcp-fb:127 ccm fir
a=rtcp-fb:127 nack
a=rtcp-fb:127 nack pli
a=rtpmap:103 rtx/90000
a=fmtp:103 apt=127
a=rtpmap:35 AV1/90000
a=rtcp-fb:35 goog-remb
a=rtcp-fb:35 transport-cc
a=rtcp-fb:35 ccm fir
a=rtcp-fb:35 nack
a=rtcp-fb:35 nack pli
a=rtpmap:36 rtx/90000
a=fmtp:36 apt=35
a=rtpmap:104 red/90000
a=rtpmap:105 rtx/90000
a=fmtp:105 apt=104
a=rtpmap:106 ulpfec/90000
a=rid:q send
a=rid:h send
a=rid:f send
a=simulcast:send q;h;f`;
    const target = preserveCodec(sdp, '0', {
      clockRate: 90000,
      mimeType: 'video/VP8',
    });
    expect(target).toContain('VP8');
    expect(target).not.toContain('VP9');
  });
});
