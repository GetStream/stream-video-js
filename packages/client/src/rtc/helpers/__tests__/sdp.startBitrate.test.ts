import { describe, expect, it } from 'vitest';

import { setStartBitrate } from '../sdp';

describe('sdp - setStartBitrate', () => {
  it('adds x-google-start-bitrate for AV1/VP9/H264 fmtp lines (but not VP8)', () => {
    const offerSdp = `v=0
o=- 123 2 IN IP4 127.0.0.1
s=-
t=0 0
m=video 9 UDP/TLS/RTP/SAVPF 96 98 103 45
c=IN IP4 0.0.0.0
a=mid:0
a=rtpmap:96 VP8/90000
a=rtpmap:98 VP9/90000
a=fmtp:98 profile-id=0
a=rtpmap:103 H264/90000
a=fmtp:103 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f
a=rtpmap:45 AV1/90000
a=fmtp:45 level-idx=5;profile=0;tier=0
`;

    const result = setStartBitrate(offerSdp, 1500, 0.5, '0'); // 750kbps

    expect(result).toContain(
      'a=fmtp:98 profile-id=0;x-google-start-bitrate=750',
    );
    expect(result).toContain(
      'a=fmtp:103 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f;x-google-start-bitrate=750',
    );
    expect(result).toContain(
      'a=fmtp:45 level-idx=5;profile=0;tier=0;x-google-start-bitrate=750',
    );

    // VP8 is not a target codec
    expect(result).not.toContain('a=fmtp:96');
    expect(result).not.toContain(
      'a=rtpmap:96 VP8/90000;x-google-start-bitrate',
    );
  });

  it('does not add x-google-start-bitrate if already present', () => {
    const offerSdp = `v=0
o=- 123 2 IN IP4 127.0.0.1
s=-
t=0 0
m=video 9 UDP/TLS/RTP/SAVPF 103
c=IN IP4 0.0.0.0
a=mid:0
a=rtpmap:103 H264/90000
a=fmtp:103 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f;x-google-start-bitrate=500
`;

    const result = setStartBitrate(offerSdp, 1500, 0.9, '0');
    expect(result).toContain('x-google-start-bitrate=500');
    expect(result).not.toContain('x-google-start-bitrate=1350');

    // Ensure it's only present once
    expect(result.match(/x-google-start-bitrate/g)).toHaveLength(1);
  });

  it('clamps computed start bitrate to a minimum of 300kbps', () => {
    const offerSdp = `v=0
o=- 123 2 IN IP4 127.0.0.1
s=-
t=0 0
m=video 9 UDP/TLS/RTP/SAVPF 98
c=IN IP4 0.0.0.0
a=mid:0
a=rtpmap:98 VP9/90000
a=fmtp:98 profile-id=0
`;

    const result = setStartBitrate(offerSdp, 1500, 0.1, '0'); // 150 -> clamped to 300
    expect(result).toContain(
      'a=fmtp:98 profile-id=0;x-google-start-bitrate=300',
    );
  });

  it('can scope the change to a specific mid', () => {
    const offerSdp = `v=0
o=- 123 2 IN IP4 127.0.0.1
s=-
t=0 0
m=video 9 UDP/TLS/RTP/SAVPF 98
c=IN IP4 0.0.0.0
a=mid:0
a=rtpmap:98 VP9/90000
a=fmtp:98 profile-id=0
m=video 9 UDP/TLS/RTP/SAVPF 103
c=IN IP4 0.0.0.0
a=mid:1
a=rtpmap:103 H264/90000
a=fmtp:103 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f
`;

    const result = setStartBitrate(offerSdp, 1500, 0.7, '0'); // 1050kbps

    // mid:0 updated
    expect(result).toContain(
      'a=fmtp:98 profile-id=0;x-google-start-bitrate=1050',
    );

    // mid:1 untouched
    expect(result).toContain(
      'a=fmtp:103 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f',
    );
    expect(result).not.toContain(
      'a=fmtp:103 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f;x-google-start-bitrate=1050',
    );
  });
});
