import { vi } from 'vitest';

const RTCPeerConnectionMock = vi.fn((): Partial<RTCPeerConnection> => {
  return {
    addEventListener: vi.fn(),
    getTransceivers: vi.fn(),
    addTransceiver: vi.fn(),
  };
});
vi.stubGlobal('RTCPeerConnection', RTCPeerConnectionMock);

const MediaStreamMock = vi.fn((): Partial<MediaStream> => {
  return {
    getTracks: vi.fn(),
    addTrack: vi.fn(),
  };
});
vi.stubGlobal('MediaStream', MediaStreamMock);

const MediaStreamTrackMock = vi.fn((): Partial<MediaStreamTrack> => {
  return {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getSettings: vi.fn(),
    stop: vi.fn(),
    readyState: 'live',
    kind: 'video',
  };
});
vi.stubGlobal('MediaStreamTrack', MediaStreamTrackMock);

const RTCRtpTransceiverMock = vi.fn((): Partial<RTCRtpTransceiver> => {
  return {
    // @ts-ignore
    sender: {
      track: null,
      replaceTrack: vi.fn(),
    },
    setCodecPreferences: vi.fn(),
  };
});
vi.stubGlobal('RTCRtpTransceiver', RTCRtpTransceiverMock);
