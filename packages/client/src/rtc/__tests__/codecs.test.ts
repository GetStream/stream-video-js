import { describe, expect, it, vi } from 'vitest';
import { getPreferredCodecs } from '../codecs';
import './mocks/webrtc.mocks';

describe('codecs', () => {
  it('should return preferred audio codec', () => {
    RTCRtpReceiver.getCapabilities = vi.fn().mockReturnValue(audioCodecs);
    const codecs = getPreferredCodecs('audio', 'red', undefined, 'receiver');
    expect(codecs).toBeDefined();
    expect(codecs?.map((c) => c.mimeType)).toEqual([
      'audio/red',
      'audio/opus',
      'audio/G722',
      'audio/PCMU',
      'audio/PCMA',
      'audio/CN',
      'audio/telephone-event',
    ]);
  });

  it('should return preferred video codec', () => {
    RTCRtpReceiver.getCapabilities = vi.fn().mockReturnValue(videoCodecs);
    const codecs = getPreferredCodecs('video', 'vp8', undefined, 'receiver');
    expect(codecs).toBeDefined();
    // prettier-ignore
    expect(codecs?.map((c) => [c.mimeType, c.sdpFmtpLine])).toEqual([
      ['video/VP8', undefined],
      ['video/H264', 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c1f'],
      ['video/rtx', undefined],
      ['video/H264', 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f'],
      ['video/H264', 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=640c1f'],
      ['video/H264', 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f'],
      ['video/VP9', 'profile-id=0'],
      ['video/VP9', 'profile-id=2'],
      ['video/red', undefined],
      ['video/ulpfec', undefined],
      ['video/flexfec-03', 'repair-window=10000000'],
    ]);
  });

  it('should pick the baseline H264 codec', () => {
    RTCRtpReceiver.getCapabilities = vi.fn().mockReturnValue(videoCodecs);
    const codecs = getPreferredCodecs('video', 'h264', undefined, 'receiver');
    expect(codecs).toBeDefined();
    // prettier-ignore
    expect(codecs?.map((c) => [c.mimeType, c.sdpFmtpLine])).toEqual([
      ['video/H264', 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f'],
      ['video/H264', 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f'],
      ['video/H264', 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c1f'],
      ['video/H264', 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=640c1f'],
      ['video/rtx', undefined],
      ['video/VP8', undefined],
      ['video/VP9', 'profile-id=0'],
      ['video/VP9', 'profile-id=2'],
      ['video/red', undefined],
      ['video/ulpfec', undefined],
      ['video/flexfec-03', 'repair-window=10000000'],
    ]);
  });

  it('should pick the baseline H264 codec with optional packetization-mode', () => {
    RTCRtpReceiver.getCapabilities = vi
      .fn()
      .mockReturnValue(videoCodecsFirefox);
    const codecs = getPreferredCodecs('video', 'h264', undefined, 'receiver');
    expect(codecs).toBeDefined();
    // prettier-ignore
    expect(codecs?.map((c) => [c.mimeType, c.sdpFmtpLine])).toEqual([
      ['video/H264', 'profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1'],
      ['video/H264', 'profile-level-id=42e01f;level-asymmetry-allowed=1'],
      ['video/VP8', 'max-fs=12288;max-fr=60'],
      ['video/rtx', undefined],
      ['video/VP9', 'max-fs=12288;max-fr=60'],
      ['video/ulpfec', undefined],
      ['video/red', undefined],
    ]);
  });
});

// prettier-ignore
const videoCodecsFirefox: RTCRtpCapabilities = {
  codecs: [
    { mimeType: 'video/VP8', sdpFmtpLine: 'max-fs=12288;max-fr=60', clockRate: 90000 },
    { mimeType: 'video/rtx', clockRate: 90000 },
    { mimeType: 'video/VP9', sdpFmtpLine: 'max-fs=12288;max-fr=60', clockRate: 90000 },
    { mimeType: 'video/H264', sdpFmtpLine: 'profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1', clockRate: 90000 },
    { mimeType: 'video/H264', sdpFmtpLine: 'profile-level-id=42e01f;level-asymmetry-allowed=1', clockRate: 90000 },
    { mimeType: 'video/ulpfec', clockRate: 90000 },
    { mimeType: 'video/red', clockRate: 90000 },
  ],
  headerExtensions: [
    { uri: 'urn:ietf:params:rtp-hdrext:sdes:mid' },
    { uri: 'http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time' },
    { uri: 'urn:ietf:params:rtp-hdrext:toffset' },
    { uri: 'http://www.webrtc.org/experiments/rtp-hdrext/playout-delay' },
  ],
};

// prettier-ignore
const videoCodecs: RTCRtpCapabilities = {
  codecs: [
    { mimeType: 'video/H264', sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c1f', clockRate: 90000 },
    { mimeType: 'video/rtx', clockRate: 90000 },
    { mimeType: 'video/H264', sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f', clockRate: 90000 },
    { mimeType: 'video/H264', sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=640c1f', clockRate: 90000 },
    { mimeType: 'video/H264', sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f', clockRate: 90000 },
    { mimeType: 'video/VP8', clockRate: 90000 },
    { mimeType: 'video/VP9', sdpFmtpLine: 'profile-id=0', clockRate: 90000 },
    { mimeType: 'video/VP9', sdpFmtpLine: 'profile-id=2', clockRate: 90000 },
    { mimeType: 'video/red', clockRate: 90000 },
    { mimeType: 'video/ulpfec', clockRate: 90000 },
    { mimeType: 'video/flexfec-03', sdpFmtpLine: 'repair-window=10000000', clockRate: 90000 },
  ],
  headerExtensions: [
    { uri: 'urn:ietf:params:rtp-hdrext:toffset' },
    { uri: 'http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time' },
    { uri: 'urn:3gpp:video-orientation' },
    { uri: 'http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01' },
    { uri: 'http://www.webrtc.org/experiments/rtp-hdrext/playout-delay' },
    { uri: 'http://www.webrtc.org/experiments/rtp-hdrext/video-content-type' },
    { uri: 'http://www.webrtc.org/experiments/rtp-hdrext/video-timing' },
    { uri: 'http://www.webrtc.org/experiments/rtp-hdrext/color-space' },
    { uri: 'urn:ietf:params:rtp-hdrext:sdes:mid' },
    { uri: 'urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id' },
    { uri: 'urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id' },
  ],
};

// prettier-ignore
const audioCodecs: RTCRtpCapabilities = {
  codecs: [
    { mimeType: 'audio/opus', sdpFmtpLine: 'minptime=10;useinbandfec=1', clockRate: 48000 },
    { mimeType: 'audio/red', sdpFmtpLine: '=111/111', clockRate: 48000 },
    { mimeType: 'audio/G722', clockRate: 8000, channels: 1 },
    { mimeType: 'audio/PCMU', clockRate: 8000, channels: 1 },
    { mimeType: 'audio/PCMA', clockRate: 8000, channels: 1 },
    { mimeType: 'audio/CN', clockRate: 8000, channels: 1 },
    { mimeType: 'audio/telephone-event', clockRate: 8000, channels: 1 },
  ],
  headerExtensions: [
    { uri: 'urn:ietf:params:rtp-hdrext:ssrc-audio-level' },
    { uri: 'http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time' },
    { uri: 'urn:ietf:params:rtp-hdrext:sdes:mid' },
  ],
};
