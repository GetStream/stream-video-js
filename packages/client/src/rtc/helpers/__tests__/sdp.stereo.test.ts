import { describe, expect, it } from 'vitest';
import { enableStereo } from '../sdp';

const offerSdp = `o=- 5087842825318906515 1750254551 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=extmap-allow-mixed
a=msid-semantic: WMS a1e5f21f716affb7:TRACK_TYPE_AUDIO:eO a1e5f21f716affb7:TRACK_TYPE_VIDEO:Nk
a=ice-lite
m=audio 51808 UDP/TLS/RTP/SAVPF 111 63 (19 more lines) direction=sendrecv mid=0
c=IN IP4 18.119.157.125
a=rtcp:51808 IN IP4 18.119.157.125
a=candidate:965407073 1 udp 2130706431 18.119.157.125 51808 typ host generation 0
a=candidate:965407073 2 udp 2130706431 18.119.157.125 51808 typ host generation 0
a=ice-ufrag:AFJnYPvMfEaZeHdt
a=ice-pwd:mbwUwrcoSApXwOyGrQOAsipWsfFGHcww
a=fingerprint:sha-256 13:79:52:41:12:BB:A7:5D:39:F0:9B:1A:95:58:94:D6:F9:D3:1E:00:A4:9D:CA:12:26:AE:7C:2A:E1:FC:42:F4
a=setup:actpass
a=mid:0
a=sendrecv
a=msid:a1e5f21f716affb7:TRACK_TYPE_AUDIO:eO 5040549b-8458-4646-892d-ad08f4475568
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:111 opus/48000/2
a=fmtp:111 maxaveragebitrate=510000;minptime=10;sprop-stereo=1;stereo=1;useinbandfec=1
a=rtpmap:63 red/48000/2
a=fmtp:63 111/111
a=ssrc:1826085709 cname:a1e5f21f716affb7:TRACK_TYPE_AUDIO:eO
a=ssrc:1826085709 msid:a1e5f21f716affb7:TRACK_TYPE_AUDIO:eO 5040549b-8458-4646-892d-ad08f4475568
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 125 126 108 109 35 36 (72 more lines) direction=sendrecv mid=1
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:AFJnYPvMfEaZeHdt
a=ice-pwd:mbwUwrcoSApXwOyGrQOAsipWsfFGHcww
a=fingerprint:sha-256 13:79:52:41:12:BB:A7:5D:39:F0:9B:1A:95:58:94:D6:F9:D3:1E:00:A4:9D:CA:12:26:AE:7C:2A:E1:FC:42:F4
a=setup:actpass
a=mid:1
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:1 https://aomediacodec.github.io/av1-rtp-spec/#dependency-descriptor-rtp-header-extension
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=sendrecv
a=msid:a1e5f21f716affb7:TRACK_TYPE_VIDEO:Nk 40c4a11d-fa67-49b6-a4fa-1625b4bde4a5
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:96 VP8/90000
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=rtcp-fb:96 goog-remb
a=rtcp-fb:96 transport-cc
a=rtpmap:97 rtx/90000
a=fmtp:97 apt=96
a=rtpmap:98 VP9/90000
a=rtcp-fb:98 ccm fir
a=rtcp-fb:98 nack
a=rtcp-fb:98 nack pli
a=rtcp-fb:98 goog-remb
a=rtcp-fb:98 transport-cc
a=fmtp:98 profile-id=0
a=rtpmap:99 rtx/90000
a=fmtp:99 apt=98
a=rtpmap:100 VP9/90000
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=fmtp:100 profile-id=1
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:125 H264/90000
a=rtcp-fb:125 ccm fir
a=rtcp-fb:125 nack
a=rtcp-fb:125 nack pli
a=rtcp-fb:125 goog-remb
a=rtcp-fb:125 transport-cc
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
a=rtpmap:126 rtx/90000
a=fmtp:126 apt=125
a=rtpmap:108 H264/90000
a=rtcp-fb:108 ccm fir
a=rtcp-fb:108 nack
a=rtcp-fb:108 nack pli
a=rtcp-fb:108 goog-remb
a=rtcp-fb:108 transport-cc
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f
a=rtpmap:109 rtx/90000
a=fmtp:109 apt=108
a=rtpmap:35 AV1/90000
a=rtcp-fb:35 ccm fir
a=rtcp-fb:35 nack
a=rtcp-fb:35 nack pli
a=rtcp-fb:35 goog-remb
a=rtcp-fb:35 transport-cc
a=fmtp:35 level-idx=5;profile=0;tier=0
a=rtpmap:36 rtx/90000
a=fmtp:36 apt=35
a=ssrc-group:FID 3718708632 2750164767
a=ssrc:3718708632 cname:a1e5f21f716affb7:TRACK_TYPE_VIDEO:Nk
a=ssrc:3718708632 msid:a1e5f21f716affb7:TRACK_TYPE_VIDEO:Nk 40c4a11d-fa67-49b6-a4fa-1625b4bde4a5
a=ssrc:2750164767 cname:a1e5f21f716affb7:TRACK_TYPE_VIDEO:Nk
a=ssrc:2750164767 msid:a1e5f21f716affb7:TRACK_TYPE_VIDEO:Nk 40c4a11d-fa67-49b6-a4fa-1625b4bde4a5
`;

const answerSdp = `v=0
o=- 6793916097087762106 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=extmap-allow-mixed
a=msid-semantic: WMS
m=audio 9 UDP/TLS/RTP/SAVPF 111 63
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:zcgT
a=ice-pwd:v559SXDwx4y9yAv7oeCvjsDR
a=ice-options:trickle
a=fingerprint:sha-256 F7:C8:B3:87:4A:AD:5A:86:48:1B:51:04:BE:CE:3B:D6:D3:7C:25:63:3E:9C:2B:F6:5B:8C:65:1F:72:8A:11:61
a=setup:active
a=mid:0
a=recvonly
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:111 opus/48000/2
a=fmtp:111 minptime=10;useinbandfec=1
a=rtpmap:63 red/48000/2
a=fmtp:63 111/111
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 125 126 108 109 35 36
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:zcgT
a=ice-pwd:v559SXDwx4y9yAv7oeCvjsDR
a=ice-options:trickle
a=fingerprint:sha-256 F7:C8:B3:87:4A:AD:5A:86:48:1B:51:04:BE:CE:3B:D6:D3:7C:25:63:3E:9C:2B:F6:5B:8C:65:1F:72:8A:11:61
a=setup:active
a=mid:1
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:1 https://aomediacodec.github.io/av1-rtp-spec/#dependency-descriptor-rtp-header-extension
a=recvonly
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:96 VP8/90000
a=rtcp-fb:96 goog-remb
a=rtcp-fb:96 transport-cc
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=rtpmap:97 rtx/90000
a=fmtp:97 apt=96
a=rtpmap:98 VP9/90000
a=rtcp-fb:98 goog-remb
a=rtcp-fb:98 transport-cc
a=rtcp-fb:98 ccm fir
a=rtcp-fb:98 nack
a=rtcp-fb:98 nack pli
a=fmtp:98 profile-id=0
a=rtpmap:99 rtx/90000
a=fmtp:99 apt=98
a=rtpmap:100 VP9/90000
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=fmtp:100 profile-id=1
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:125 H264/90000
a=rtcp-fb:125 goog-remb
a=rtcp-fb:125 transport-cc
a=rtcp-fb:125 ccm fir
a=rtcp-fb:125 nack
a=rtcp-fb:125 nack pli
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
a=rtpmap:126 rtx/90000
a=fmtp:126 apt=125
a=rtpmap:108 H264/90000
a=rtcp-fb:108 goog-remb
a=rtcp-fb:108 transport-cc
a=rtcp-fb:108 ccm fir
a=rtcp-fb:108 nack
a=rtcp-fb:108 nack pli
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f
a=rtpmap:109 rtx/90000
a=fmtp:109 apt=108
a=rtpmap:35 AV1/90000
a=rtcp-fb:35 goog-remb
a=rtcp-fb:35 transport-cc
a=rtcp-fb:35 ccm fir
a=rtcp-fb:35 nack
a=rtcp-fb:35 nack pli
a=fmtp:35 level-idx=5;profile=0;tier=0
a=rtpmap:36 rtx/90000
a=fmtp:36 apt=35
`;

describe('sdp - enableStereo', () => {
  it('should enable stereo in the answer SDP based on the offered stereo in the offer SDP', () => {
    const result = enableStereo(offerSdp, answerSdp);
    expect(result).toContain('a=fmtp:111 minptime=10;useinbandfec=1;stereo=1');
  });
});
