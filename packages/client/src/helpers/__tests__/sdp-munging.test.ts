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
