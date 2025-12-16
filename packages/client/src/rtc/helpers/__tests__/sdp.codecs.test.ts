import { describe, expect, it } from 'vitest';
import { removeCodecsExcept } from '../sdp';

const sdp = `v=0
o=- 6339689900541563983 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=extmap-allow-mixed
a=msid-semantic: WMS
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 35 36 37 38 103 104 107 108 109 114 115 116 117 118 39 40 41 42 43 44 45 46 47 48 119 120 121 122 49 50 51 52 123 124 125 53
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:BRD8
a=ice-pwd:8e+C7eV4BeLTWG9HvRNQZ52S
a=ice-options:trickle
a=fingerprint:sha-256 7B:A4:54:EF:70:A8:30:82:F6:88:A6:DC:E9:8A:7E:6E:59:5C:53:32:D7:AD:4F:C9:4D:DB:6C:DD:0B:DD:03:04
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
a=fmtp:100 profile-id=2
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:35 VP9/90000
a=rtcp-fb:35 goog-remb
a=rtcp-fb:35 transport-cc
a=rtcp-fb:35 ccm fir
a=rtcp-fb:35 nack
a=rtcp-fb:35 nack pli
a=fmtp:35 profile-id=1
a=rtpmap:36 rtx/90000
a=fmtp:36 apt=35
a=rtpmap:37 VP9/90000
a=rtcp-fb:37 goog-remb
a=rtcp-fb:37 transport-cc
a=rtcp-fb:37 ccm fir
a=rtcp-fb:37 nack
a=rtcp-fb:37 nack pli
a=fmtp:37 profile-id=3
a=rtpmap:38 rtx/90000
a=fmtp:38 apt=37
a=rtpmap:103 H264/90000
a=rtcp-fb:103 goog-remb
a=rtcp-fb:103 transport-cc
a=rtcp-fb:103 ccm fir
a=rtcp-fb:103 nack
a=rtcp-fb:103 nack pli
a=fmtp:103 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f
a=rtpmap:104 rtx/90000
a=fmtp:104 apt=103
a=rtpmap:107 H264/90000
a=rtcp-fb:107 goog-remb
a=rtcp-fb:107 transport-cc
a=rtcp-fb:107 ccm fir
a=rtcp-fb:107 nack
a=rtcp-fb:107 nack pli
a=fmtp:107 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f
a=rtpmap:108 rtx/90000
a=fmtp:108 apt=107
a=rtpmap:109 H264/90000
a=rtcp-fb:109 goog-remb
a=rtcp-fb:109 transport-cc
a=rtcp-fb:109 ccm fir
a=rtcp-fb:109 nack
a=rtcp-fb:109 nack pli
a=fmtp:109 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
a=rtpmap:114 rtx/90000
a=fmtp:114 apt=109
a=rtpmap:115 H264/90000
a=rtcp-fb:115 goog-remb
a=rtcp-fb:115 transport-cc
a=rtcp-fb:115 ccm fir
a=rtcp-fb:115 nack
a=rtcp-fb:115 nack pli
a=fmtp:115 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f
a=rtpmap:116 rtx/90000
a=fmtp:116 apt=115
a=rtpmap:117 H264/90000
a=rtcp-fb:117 goog-remb
a=rtcp-fb:117 transport-cc
a=rtcp-fb:117 ccm fir
a=rtcp-fb:117 nack
a=rtcp-fb:117 nack pli
a=fmtp:117 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f
a=rtpmap:118 rtx/90000
a=fmtp:118 apt=117
a=rtpmap:39 H264/90000
a=rtcp-fb:39 goog-remb
a=rtcp-fb:39 transport-cc
a=rtcp-fb:39 ccm fir
a=rtcp-fb:39 nack
a=rtcp-fb:39 nack pli
a=fmtp:39 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f
a=rtpmap:40 rtx/90000
a=fmtp:40 apt=39
a=rtpmap:41 H264/90000
a=rtcp-fb:41 goog-remb
a=rtcp-fb:41 transport-cc
a=rtcp-fb:41 ccm fir
a=rtcp-fb:41 nack
a=rtcp-fb:41 nack pli
a=fmtp:41 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=f4001f
a=rtpmap:42 rtx/90000
a=fmtp:42 apt=41
a=rtpmap:43 H264/90000
a=rtcp-fb:43 goog-remb
a=rtcp-fb:43 transport-cc
a=rtcp-fb:43 ccm fir
a=rtcp-fb:43 nack
a=rtcp-fb:43 nack pli
a=fmtp:43 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=f4001f
a=rtpmap:44 rtx/90000
a=fmtp:44 apt=43
a=rtpmap:45 AV1/90000
a=rtcp-fb:45 goog-remb
a=rtcp-fb:45 transport-cc
a=rtcp-fb:45 ccm fir
a=rtcp-fb:45 nack
a=rtcp-fb:45 nack pli
a=fmtp:45 level-idx=5;profile=0;tier=0
a=rtpmap:46 rtx/90000
a=fmtp:46 apt=45
a=rtpmap:47 AV1/90000
a=rtcp-fb:47 goog-remb
a=rtcp-fb:47 transport-cc
a=rtcp-fb:47 ccm fir
a=rtcp-fb:47 nack
a=rtcp-fb:47 nack pli
a=fmtp:47 level-idx=5;profile=1;tier=0
a=rtpmap:48 rtx/90000
a=fmtp:48 apt=47
a=rtpmap:119 H264/90000
a=rtcp-fb:119 goog-remb
a=rtcp-fb:119 transport-cc
a=rtcp-fb:119 ccm fir
a=rtcp-fb:119 nack
a=rtcp-fb:119 nack pli
a=fmtp:119 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f
a=rtpmap:120 rtx/90000
a=fmtp:120 apt=119
a=rtpmap:121 H264/90000
a=rtcp-fb:121 goog-remb
a=rtcp-fb:121 transport-cc
a=rtcp-fb:121 ccm fir
a=rtcp-fb:121 nack
a=rtcp-fb:121 nack pli
a=fmtp:121 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=64001f
a=rtpmap:122 rtx/90000
a=fmtp:122 apt=121
a=rtpmap:49 H265/90000
a=rtcp-fb:49 goog-remb
a=rtcp-fb:49 transport-cc
a=rtcp-fb:49 ccm fir
a=rtcp-fb:49 nack
a=rtcp-fb:49 nack pli
a=fmtp:49 level-id=180;profile-id=1;tier-flag=0;tx-mode=SRST
a=rtpmap:50 rtx/90000
a=fmtp:50 apt=49
a=rtpmap:51 H265/90000
a=rtcp-fb:51 goog-remb
a=rtcp-fb:51 transport-cc
a=rtcp-fb:51 ccm fir
a=rtcp-fb:51 nack
a=rtcp-fb:51 nack pli
a=fmtp:51 level-id=180;profile-id=2;tier-flag=0;tx-mode=SRST
a=rtpmap:52 rtx/90000
a=fmtp:52 apt=51
a=rtpmap:123 red/90000
a=rtpmap:124 rtx/90000
a=fmtp:124 apt=123
a=rtpmap:125 ulpfec/90000
a=rtpmap:53 flexfec-03/90000
a=rtcp-fb:53 goog-remb
a=rtcp-fb:53 transport-cc
a=fmtp:53 repair-window=10000000
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:BRD8
a=ice-pwd:8e+C7eV4BeLTWG9HvRNQZ52S
a=ice-options:trickle
a=fingerprint:sha-256 7B:A4:54:EF:70:A8:30:82:F6:88:A6:DC:E9:8A:7E:6E:59:5C:53:32:D7:AD:4F:C9:4D:DB:6C:DD:0B:DD:03:04
a=setup:actpass
a=mid:1
a=extmap:14 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid
a=recvonly
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:111 opus/48000/2
a=rtcp-fb:111 transport-cc
a=fmtp:111 minptime=10;useinbandfec=1
a=rtpmap:63 red/48000/2
a=fmtp:63 111/111
a=rtpmap:9 G722/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:126 telephone-event/8000
`;

const expectedSdpVP8 = `v=0
o=- 6339689900541563983 2 IN IP4 127.0.0.1
s=-
t=0 0
a=extmap-allow-mixed
a=msid-semantic:  WMS
a=group:BUNDLE 0 1
m=video 9 UDP/TLS/RTP/SAVPF 96 97
c=IN IP4 0.0.0.0
a=rtpmap:96 VP8/90000
a=rtpmap:97 rtx/90000
a=fmtp:97 apt=96
a=rtcp:9 IN IP4 0.0.0.0
a=rtcp-fb:96 goog-remb
a=rtcp-fb:96 transport-cc
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
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
a=setup:actpass
a=mid:0
a=recvonly
a=ice-ufrag:BRD8
a=ice-pwd:8e+C7eV4BeLTWG9HvRNQZ52S
a=fingerprint:sha-256 7B:A4:54:EF:70:A8:30:82:F6:88:A6:DC:E9:8A:7E:6E:59:5C:53:32:D7:AD:4F:C9:4D:DB:6C:DD:0B:DD:03:04
a=ice-options:trickle
a=rtcp-mux
a=rtcp-rsize
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126
c=IN IP4 0.0.0.0
a=rtpmap:111 opus/48000/2
a=rtpmap:63 red/48000/2
a=rtpmap:9 G722/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:126 telephone-event/8000
a=fmtp:111 minptime=10;useinbandfec=1
a=fmtp:63 111/111
a=rtcp:9 IN IP4 0.0.0.0
a=rtcp-fb:111 transport-cc
a=extmap:14 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid
a=setup:actpass
a=mid:1
a=recvonly
a=ice-ufrag:BRD8
a=ice-pwd:8e+C7eV4BeLTWG9HvRNQZ52S
a=fingerprint:sha-256 7B:A4:54:EF:70:A8:30:82:F6:88:A6:DC:E9:8A:7E:6E:59:5C:53:32:D7:AD:4F:C9:4D:DB:6C:DD:0B:DD:03:04
a=ice-options:trickle
a=rtcp-mux
a=rtcp-rsize
`;

const expectedSdpH264 = `v=0
o=- 6339689900541563983 2 IN IP4 127.0.0.1
s=-
t=0 0
a=extmap-allow-mixed
a=msid-semantic:  WMS
a=group:BUNDLE 0 1
m=video 9 UDP/TLS/RTP/SAVPF 103 104 107 108 109 114 115 116 117 118 39 40 41 42 43 44 119 120 121 122
c=IN IP4 0.0.0.0
a=rtpmap:103 H264/90000
a=rtpmap:104 rtx/90000
a=rtpmap:107 H264/90000
a=rtpmap:108 rtx/90000
a=rtpmap:109 H264/90000
a=rtpmap:114 rtx/90000
a=rtpmap:115 H264/90000
a=rtpmap:116 rtx/90000
a=rtpmap:117 H264/90000
a=rtpmap:118 rtx/90000
a=rtpmap:39 H264/90000
a=rtpmap:40 rtx/90000
a=rtpmap:41 H264/90000
a=rtpmap:42 rtx/90000
a=rtpmap:43 H264/90000
a=rtpmap:44 rtx/90000
a=rtpmap:119 H264/90000
a=rtpmap:120 rtx/90000
a=rtpmap:121 H264/90000
a=rtpmap:122 rtx/90000
a=fmtp:103 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f
a=fmtp:104 apt=103
a=fmtp:107 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f
a=fmtp:108 apt=107
a=fmtp:109 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
a=fmtp:114 apt=109
a=fmtp:115 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f
a=fmtp:116 apt=115
a=fmtp:117 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f
a=fmtp:118 apt=117
a=fmtp:39 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f
a=fmtp:40 apt=39
a=fmtp:41 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=f4001f
a=fmtp:42 apt=41
a=fmtp:43 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=f4001f
a=fmtp:44 apt=43
a=fmtp:119 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f
a=fmtp:120 apt=119
a=fmtp:121 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=64001f
a=fmtp:122 apt=121
a=rtcp:9 IN IP4 0.0.0.0
a=rtcp-fb:103 goog-remb
a=rtcp-fb:103 transport-cc
a=rtcp-fb:103 ccm fir
a=rtcp-fb:103 nack
a=rtcp-fb:103 nack pli
a=rtcp-fb:107 goog-remb
a=rtcp-fb:107 transport-cc
a=rtcp-fb:107 ccm fir
a=rtcp-fb:107 nack
a=rtcp-fb:107 nack pli
a=rtcp-fb:109 goog-remb
a=rtcp-fb:109 transport-cc
a=rtcp-fb:109 ccm fir
a=rtcp-fb:109 nack
a=rtcp-fb:109 nack pli
a=rtcp-fb:115 goog-remb
a=rtcp-fb:115 transport-cc
a=rtcp-fb:115 ccm fir
a=rtcp-fb:115 nack
a=rtcp-fb:115 nack pli
a=rtcp-fb:117 goog-remb
a=rtcp-fb:117 transport-cc
a=rtcp-fb:117 ccm fir
a=rtcp-fb:117 nack
a=rtcp-fb:117 nack pli
a=rtcp-fb:39 goog-remb
a=rtcp-fb:39 transport-cc
a=rtcp-fb:39 ccm fir
a=rtcp-fb:39 nack
a=rtcp-fb:39 nack pli
a=rtcp-fb:41 goog-remb
a=rtcp-fb:41 transport-cc
a=rtcp-fb:41 ccm fir
a=rtcp-fb:41 nack
a=rtcp-fb:41 nack pli
a=rtcp-fb:43 goog-remb
a=rtcp-fb:43 transport-cc
a=rtcp-fb:43 ccm fir
a=rtcp-fb:43 nack
a=rtcp-fb:43 nack pli
a=rtcp-fb:119 goog-remb
a=rtcp-fb:119 transport-cc
a=rtcp-fb:119 ccm fir
a=rtcp-fb:119 nack
a=rtcp-fb:119 nack pli
a=rtcp-fb:121 goog-remb
a=rtcp-fb:121 transport-cc
a=rtcp-fb:121 ccm fir
a=rtcp-fb:121 nack
a=rtcp-fb:121 nack pli
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
a=setup:actpass
a=mid:0
a=recvonly
a=ice-ufrag:BRD8
a=ice-pwd:8e+C7eV4BeLTWG9HvRNQZ52S
a=fingerprint:sha-256 7B:A4:54:EF:70:A8:30:82:F6:88:A6:DC:E9:8A:7E:6E:59:5C:53:32:D7:AD:4F:C9:4D:DB:6C:DD:0B:DD:03:04
a=ice-options:trickle
a=rtcp-mux
a=rtcp-rsize
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126
c=IN IP4 0.0.0.0
a=rtpmap:111 opus/48000/2
a=rtpmap:63 red/48000/2
a=rtpmap:9 G722/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:126 telephone-event/8000
a=fmtp:111 minptime=10;useinbandfec=1
a=fmtp:63 111/111
a=rtcp:9 IN IP4 0.0.0.0
a=rtcp-fb:111 transport-cc
a=extmap:14 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid
a=setup:actpass
a=mid:1
a=recvonly
a=ice-ufrag:BRD8
a=ice-pwd:8e+C7eV4BeLTWG9HvRNQZ52S
a=fingerprint:sha-256 7B:A4:54:EF:70:A8:30:82:F6:88:A6:DC:E9:8A:7E:6E:59:5C:53:32:D7:AD:4F:C9:4D:DB:6C:DD:0B:DD:03:04
a=ice-options:trickle
a=rtcp-mux
a=rtcp-rsize
`;

const expectedSdpH264Profile64001f = `v=0
o=- 6339689900541563983 2 IN IP4 127.0.0.1
s=-
t=0 0
a=extmap-allow-mixed
a=msid-semantic:  WMS
a=group:BUNDLE 0 1
m=video 9 UDP/TLS/RTP/SAVPF 119 120
c=IN IP4 0.0.0.0
a=rtpmap:119 H264/90000
a=rtpmap:120 rtx/90000
a=fmtp:119 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f
a=fmtp:120 apt=119
a=rtcp:9 IN IP4 0.0.0.0
a=rtcp-fb:119 goog-remb
a=rtcp-fb:119 transport-cc
a=rtcp-fb:119 ccm fir
a=rtcp-fb:119 nack
a=rtcp-fb:119 nack pli
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
a=setup:actpass
a=mid:0
a=recvonly
a=ice-ufrag:BRD8
a=ice-pwd:8e+C7eV4BeLTWG9HvRNQZ52S
a=fingerprint:sha-256 7B:A4:54:EF:70:A8:30:82:F6:88:A6:DC:E9:8A:7E:6E:59:5C:53:32:D7:AD:4F:C9:4D:DB:6C:DD:0B:DD:03:04
a=ice-options:trickle
a=rtcp-mux
a=rtcp-rsize
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126
c=IN IP4 0.0.0.0
a=rtpmap:111 opus/48000/2
a=rtpmap:63 red/48000/2
a=rtpmap:9 G722/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:126 telephone-event/8000
a=fmtp:111 minptime=10;useinbandfec=1
a=fmtp:63 111/111
a=rtcp:9 IN IP4 0.0.0.0
a=rtcp-fb:111 transport-cc
a=extmap:14 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid
a=setup:actpass
a=mid:1
a=recvonly
a=ice-ufrag:BRD8
a=ice-pwd:8e+C7eV4BeLTWG9HvRNQZ52S
a=fingerprint:sha-256 7B:A4:54:EF:70:A8:30:82:F6:88:A6:DC:E9:8A:7E:6E:59:5C:53:32:D7:AD:4F:C9:4D:DB:6C:DD:0B:DD:03:04
a=ice-options:trickle
a=rtcp-mux
a=rtcp-rsize
`;

const expectedSdpH264Profile64001fOnly = `v=0
o=- 6339689900541563983 2 IN IP4 127.0.0.1
s=-
t=0 0
a=extmap-allow-mixed
a=msid-semantic:  WMS
a=group:BUNDLE 0 1
m=video 9 UDP/TLS/RTP/SAVPF 119 120 121 122
c=IN IP4 0.0.0.0
a=rtpmap:119 H264/90000
a=rtpmap:120 rtx/90000
a=rtpmap:121 H264/90000
a=rtpmap:122 rtx/90000
a=fmtp:119 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f
a=fmtp:120 apt=119
a=fmtp:121 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=64001f
a=fmtp:122 apt=121
a=rtcp:9 IN IP4 0.0.0.0
a=rtcp-fb:119 goog-remb
a=rtcp-fb:119 transport-cc
a=rtcp-fb:119 ccm fir
a=rtcp-fb:119 nack
a=rtcp-fb:119 nack pli
a=rtcp-fb:121 goog-remb
a=rtcp-fb:121 transport-cc
a=rtcp-fb:121 ccm fir
a=rtcp-fb:121 nack
a=rtcp-fb:121 nack pli
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
a=setup:actpass
a=mid:0
a=recvonly
a=ice-ufrag:BRD8
a=ice-pwd:8e+C7eV4BeLTWG9HvRNQZ52S
a=fingerprint:sha-256 7B:A4:54:EF:70:A8:30:82:F6:88:A6:DC:E9:8A:7E:6E:59:5C:53:32:D7:AD:4F:C9:4D:DB:6C:DD:0B:DD:03:04
a=ice-options:trickle
a=rtcp-mux
a=rtcp-rsize
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126
c=IN IP4 0.0.0.0
a=rtpmap:111 opus/48000/2
a=rtpmap:63 red/48000/2
a=rtpmap:9 G722/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:126 telephone-event/8000
a=fmtp:111 minptime=10;useinbandfec=1
a=fmtp:63 111/111
a=rtcp:9 IN IP4 0.0.0.0
a=rtcp-fb:111 transport-cc
a=extmap:14 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid
a=setup:actpass
a=mid:1
a=recvonly
a=ice-ufrag:BRD8
a=ice-pwd:8e+C7eV4BeLTWG9HvRNQZ52S
a=fingerprint:sha-256 7B:A4:54:EF:70:A8:30:82:F6:88:A6:DC:E9:8A:7E:6E:59:5C:53:32:D7:AD:4F:C9:4D:DB:6C:DD:0B:DD:03:04
a=ice-options:trickle
a=rtcp-mux
a=rtcp-rsize
`;

describe('sdp - remove codecs', () => {
  it('it should remove non-matching codecs', () => {
    expect(removeCodecsExcept(sdp, 'video/vp8', undefined)).toEqual(
      expectedSdpVP8.replace(/\n/g, '\r\n'),
    );
    expect(removeCodecsExcept(sdp, 'video/h264', undefined)).toEqual(
      expectedSdpH264.replace(/\n/g, '\r\n'),
    );
    expect(
      removeCodecsExcept(
        sdp,
        'video/h264',
        'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f',
      ),
    ).toEqual(expectedSdpH264Profile64001f.replace(/\n/g, '\r\n'));
    expect(
      removeCodecsExcept(
        sdp,
        'video/h264',
        'level-asymmetry-allowed=1;profile-level-id=64001f;packetization-mode=1',
      ),
    ).toEqual(expectedSdpH264Profile64001f.replace(/\n/g, '\r\n'));
    expect(
      removeCodecsExcept(sdp, 'video/h264', 'profile-level-id=64001f'),
    ).toEqual(expectedSdpH264Profile64001fOnly.replace(/\n/g, '\r\n'));
  });
});
