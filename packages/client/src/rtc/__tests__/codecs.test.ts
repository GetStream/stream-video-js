import './mocks/webrtc.mocks';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { findCodec } from '../codecs';

describe('findCodec', () => {
  beforeAll(() => {
    RTCRtpSender.getCapabilities = vi.fn().mockReturnValue({
      codecs: codecsMock,
    });
  });

  it('should pick the first matching codec when fmtpLine is not provided', () => {
    expect(findCodec('video/H264', undefined)).toEqual({
      mimeType: 'video/H264',
      sdpFmtpLine:
        'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f',
    });

    expect(findCodec('video/VP8', undefined)).toEqual({
      mimeType: 'video/VP8',
    });
  });

  it('should match fmtpLine when provided', () => {
    const codec = findCodec(
      'video/H264',
      'profile-level-id=640034;level-asymmetry-allowed=1;packetization-mode=1',
    );
    expect(codec).toEqual({
      mimeType: 'video/H264',
      sdpFmtpLine:
        'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640034',
    });
  });

  it('should return undefined when matching codec cannot be found', () => {
    expect(findCodec('video/VP9', 'profile-id=1000')).toBeUndefined();
    expect(findCodec('video/VP101', undefined)).toBeUndefined();
  });
});

// prettier-ignore
const codecsMock: Partial<RTCRtpCodec>[] = [
  { mimeType: 'video/VP8' },
  { mimeType: 'video/rtx' },
  { mimeType: 'video/H264', sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f' },
  { mimeType: 'video/H264', sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f' },
  { mimeType: 'video/H264', sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f' },
  { mimeType: 'video/H264', sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f' },
  { mimeType: 'video/H264', sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f' },
  { mimeType: 'video/H264', sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f' },
  { mimeType: 'video/AV1', sdpFmtpLine: 'level-idx=5;profile=0;tier=0' },
  { mimeType: 'video/VP9', sdpFmtpLine: 'profile-id=0' },
  { mimeType: 'video/VP9', sdpFmtpLine: 'profile-id=2' },
  { mimeType: 'video/H264',sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640034' },
  { mimeType: 'video/red' },
  { mimeType: 'video/ulpfec' },
];
