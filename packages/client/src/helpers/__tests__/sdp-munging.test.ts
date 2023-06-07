import { describe, expect, it } from 'vitest';
import { setPreferredCodec, removeCodec, toggleDtx } from '../sdp-munging';

const sdpWithRed = `v=0
o=- 3265541491372987511 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=extmap-allow-mixed
a=msid-semantic: WMS 2bcd08db-9e74-421c-a679-f505bbe3b7d8
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 103 104 9 102 0 8 106 105 13 110 112 113 126
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:bIQJ
a=ice-pwd:OQKiPkYpIOfGNxR1KUMNgo+N
a=ice-options:trickle renomination
a=fingerprint:sha-256 33:C9:9E:47:E5:2A:14:04:F8:F7:79:BE:4A:87:C4:B8:47:D6:57:0B:54:0A:40:8B:84:15:1E:C0:C9:6F:B9:64
a=setup:actpass
a=mid:0
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=sendonly
a=msid:- 4dd21ddd-75b9-4ed5-b7dd-a92ef83c5774
a=rtcp-mux
a=rtpmap:111 opus/48000/2
a=rtcp-fb:111 transport-cc
a=fmtp:111 minptime=10;useinbandfec=1;usedtx=1
a=rtpmap:63 red/48000/2
a=fmtp:63 111/111
a=rtpmap:103 ISAC/16000
a=rtpmap:104 ISAC/32000
a=rtpmap:9 G722/8000
a=rtpmap:102 ILBC/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:106 CN/32000
a=rtpmap:105 CN/16000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:112 telephone-event/32000
a=rtpmap:113 telephone-event/16000
a=rtpmap:126 telephone-event/8000
a=ssrc:1923158012 cname:HuoSC6N7qMCUMmlY
a=ssrc:1923158012 msid:- 4dd21ddd-75b9-4ed5-b7dd-a92ef83c5774
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 35 36 100 101 125 124 127
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:bIQJ
a=ice-pwd:OQKiPkYpIOfGNxR1KUMNgo+N
a=ice-options:trickle renomination
a=fingerprint:sha-256 33:C9:9E:47:E5:2A:14:04:F8:F7:79:BE:4A:87:C4:B8:47:D6:57:0B:54:0A:40:8B:84:15:1E:C0:C9:6F:B9:64
a=setup:actpass
a=mid:1
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:13 urn:3gpp:video-orientation
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id
a=sendonly
a=msid:2bcd08db-9e74-421c-a679-f505bbe3b7d8 56c65a8a-74b8-410e-a90b-5edceb321cfc
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
a=rtpmap:99 rtx/90000
a=fmtp:99 apt=98
a=rtpmap:35 AV1/90000
a=rtcp-fb:35 goog-remb
a=rtcp-fb:35 transport-cc
a=rtcp-fb:35 ccm fir
a=rtcp-fb:35 nack
a=rtcp-fb:35 nack pli
a=rtpmap:36 rtx/90000
a=fmtp:36 apt=35
a=rtpmap:100 H264/90000
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=fmtp:100 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:125 red/90000
a=rtpmap:124 rtx/90000
a=fmtp:124 apt=125
a=rtpmap:127 ulpfec/90000
a=rid:q send
a=rid:h send
a=rid:f send
a=simulcast:send q;h;f
`;

// 63 is red so remove 63
const sdpWithoutRED = `v=0
o=- 3265541491372987511 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=extmap-allow-mixed
a=msid-semantic: WMS 2bcd08db-9e74-421c-a679-f505bbe3b7d8
m=audio 9 UDP/TLS/RTP/SAVPF 111 103 104 9 102 0 8 106 105 13 110 112 113 126
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:bIQJ
a=ice-pwd:OQKiPkYpIOfGNxR1KUMNgo+N
a=ice-options:trickle renomination
a=fingerprint:sha-256 33:C9:9E:47:E5:2A:14:04:F8:F7:79:BE:4A:87:C4:B8:47:D6:57:0B:54:0A:40:8B:84:15:1E:C0:C9:6F:B9:64
a=setup:actpass
a=mid:0
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=sendonly
a=msid:- 4dd21ddd-75b9-4ed5-b7dd-a92ef83c5774
a=rtcp-mux
a=rtpmap:111 opus/48000/2
a=rtcp-fb:111 transport-cc
a=fmtp:111 minptime=10;useinbandfec=1;usedtx=1
a=rtpmap:103 ISAC/16000
a=rtpmap:104 ISAC/32000
a=rtpmap:9 G722/8000
a=rtpmap:102 ILBC/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:106 CN/32000
a=rtpmap:105 CN/16000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:112 telephone-event/32000
a=rtpmap:113 telephone-event/16000
a=rtpmap:126 telephone-event/8000
a=ssrc:1923158012 cname:HuoSC6N7qMCUMmlY
a=ssrc:1923158012 msid:- 4dd21ddd-75b9-4ed5-b7dd-a92ef83c5774
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 35 36 100 101 125 124 127
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:bIQJ
a=ice-pwd:OQKiPkYpIOfGNxR1KUMNgo+N
a=ice-options:trickle renomination
a=fingerprint:sha-256 33:C9:9E:47:E5:2A:14:04:F8:F7:79:BE:4A:87:C4:B8:47:D6:57:0B:54:0A:40:8B:84:15:1E:C0:C9:6F:B9:64
a=setup:actpass
a=mid:1
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:13 urn:3gpp:video-orientation
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id
a=sendonly
a=msid:2bcd08db-9e74-421c-a679-f505bbe3b7d8 56c65a8a-74b8-410e-a90b-5edceb321cfc
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
a=rtpmap:99 rtx/90000
a=fmtp:99 apt=98
a=rtpmap:35 AV1/90000
a=rtcp-fb:35 goog-remb
a=rtcp-fb:35 transport-cc
a=rtcp-fb:35 ccm fir
a=rtcp-fb:35 nack
a=rtcp-fb:35 nack pli
a=rtpmap:36 rtx/90000
a=fmtp:36 apt=35
a=rtpmap:100 H264/90000
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=fmtp:100 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:125 red/90000
a=rtpmap:124 rtx/90000
a=fmtp:124 apt=125
a=rtpmap:127 ulpfec/90000
a=rid:q send
a=rid:h send
a=rid:f send
a=simulcast:send q;h;f
`;

describe('sdp-munging', () => {
  it('When H264 video codec is the preferred codec move it to the front of other codecs such as VP8', () => {
    const mediaType = 'video';
    const preferredCodec = 'H264';
    // 100 is H264 so only the order of 100 and 96 should be changed
    const expectedOutput = sdpWithRed.replace(
      'm=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 35 36 100 101 125 124 127',
      'm=video 9 UDP/TLS/RTP/SAVPF 100 96 97 98 99 35 36 101 125 124 127',
    );
    expect(setPreferredCodec(sdpWithRed, mediaType, preferredCodec)).toEqual(
      expectedOutput,
    );
  });

  it('When RED audio codec is the preferred codec move it to the front of other codecs such as OPUS', () => {
    const mediaType = 'audio';
    const preferredCodec = 'RED';
    // 63 is red so only the order of 63 and 111 should be changed
    const expectedOutput = sdpWithRed.replace(
      'm=audio 9 UDP/TLS/RTP/SAVPF 111 63 103 104 9 102 0 8 106 105 13 110 112 113 126',
      'm=audio 9 UDP/TLS/RTP/SAVPF 63 111 103 104 9 102 0 8 106 105 13 110 112 113 126',
    );
    expect(setPreferredCodec(sdpWithRed, mediaType, preferredCodec)).toEqual(
      expectedOutput,
    );
  });

  it('When RED audio codec is the preferred codec and if original SDP doesnt support RED, dont do anything', () => {
    const mediaType = 'audio';
    const preferredCodec = 'RED';
    expect(setPreferredCodec(sdpWithoutRED, mediaType, preferredCodec)).toEqual(
      sdpWithoutRED,
    );
  });

  it('Supporting the removal of RED audio codec', () => {
    const mediaType = 'audio';
    const codecToRemove = 'RED';
    expect(removeCodec(sdpWithRed, mediaType, codecToRemove)).toEqual(
      sdpWithoutRED,
    );
  });

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
});
