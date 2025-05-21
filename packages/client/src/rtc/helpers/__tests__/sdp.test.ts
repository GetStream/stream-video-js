import '../../__tests__/mocks/webrtc.mocks';

import { describe, expect, it, vi } from 'vitest';
import { extractMid } from '../sdp';

const sdp = `v=0
o=- 8380609262679842857 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=extmap-allow-mixed
a=msid-semantic: WMS
m=video 9 UDP/TLS/RTP/SAVPF 96
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=mid:100
a=sendonly
a=msid:- 8d240fd6-26a1-40f6-a769-4d7d24cfd286
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:96 VP8/90000
a=rtcp-fb:96 goog-remb
a=rtcp-fb:96 transport-cc
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
`;

describe('sdp', () => {
  it('should extract mid from transceiver', () => {
    const transceiver = new RTCRtpTransceiver();
    // @ts-expect-error - mid is a readonly property
    transceiver.mid = '10';
    expect(extractMid(transceiver, -1, '')).toBe('10');
  });

  it('should use transceiverInitIndex (heuristic) when SDP is not present', () => {
    expect(extractMid(new RTCRtpTransceiver(), 5, '')).toBe('5');
  });

  it('should extract mid from SDP', () => {
    const track = new MediaStreamTrack();
    // @ts-expect-error - id is a readonly property
    track.id = '8d240fd6-26a1-40f6-a769-4d7d24cfd286';
    const transceiver = new RTCRtpTransceiver();
    vi.spyOn(transceiver.sender, 'track', 'get').mockReturnValue(track);

    expect(extractMid(transceiver, -1, sdp)).toBe('100');
  });

  it('should fallback to transceiverInitIndex when mid can not be found in SDP', () => {
    const track = new MediaStreamTrack();
    // @ts-expect-error - id is a readonly property
    track.id = 'not-known';
    const transceiver = new RTCRtpTransceiver();
    vi.spyOn(transceiver.sender, 'track', 'get').mockReturnValue(track);
    expect(extractMid(transceiver, 3, sdp)).toBe('3');
  });
});
