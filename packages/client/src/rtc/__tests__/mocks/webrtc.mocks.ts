import { vi } from 'vitest';

const RTCPeerConnectionMock = vi.fn((): Partial<RTCPeerConnection> => {
  return {
    addEventListener: vi.fn(),
    addIceCandidate: vi.fn(),
    removeEventListener: vi.fn(),
    getTransceivers: vi.fn(),
    addTransceiver: vi.fn(),
    getConfiguration: vi.fn(),
    setConfiguration: vi.fn(),
    createOffer: vi.fn().mockResolvedValue({}),
    createAnswer: vi.fn().mockResolvedValue({}),
    setLocalDescription: vi.fn().mockResolvedValue({}),
    setRemoteDescription: vi.fn().mockResolvedValue({}),
    close: vi.fn(),
    connectionState: 'connected',
    signalingState: 'stable',
    getReceivers: vi.fn(),
    getSenders: vi.fn(),
    removeTrack: vi.fn(),
  };
});
vi.stubGlobal('RTCPeerConnection', RTCPeerConnectionMock);

const MediaStreamMock = vi.fn((): Partial<MediaStream> => {
  return {
    getTracks: vi.fn().mockReturnValue([]),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    getAudioTracks: vi.fn().mockReturnValue([]),
    getVideoTracks: vi.fn().mockReturnValue([]),
  };
});
vi.stubGlobal('MediaStream', MediaStreamMock);

const MediaStreamTrackMock = vi.fn((): Partial<MediaStreamTrack> => {
  return {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getSettings: vi.fn().mockReturnValue({ width: 1280, height: 720 }),
    stop: vi.fn(),
    clone: vi.fn(),
    readyState: 'live',
    kind: 'video',
    enabled: true,
    id: crypto.randomUUID(),
  };
});
vi.stubGlobal('MediaStreamTrack', MediaStreamTrackMock);

const RTCRtpTransceiverMock = vi.fn((): Partial<RTCRtpTransceiver> => {
  return {
    // @ts-ignore
    sender: {
      track: null,
      replaceTrack: vi.fn(),
      getParameters: vi.fn(),
      setParameters: vi.fn(),
    },
    setCodecPreferences: vi.fn(),
    mid: '',
  };
});
vi.stubGlobal('RTCRtpTransceiver', RTCRtpTransceiverMock);

const RTCTrackEvent = vi.fn(
  (type: string, eventInitDict: RTCTrackEventInit): Partial<RTCTrackEvent> => {
    return {
      type,
      ...eventInitDict,
    };
  },
);
vi.stubGlobal('RTCTrackEvent', RTCTrackEvent);

const RTCRtpReceiverMock = vi.fn((): Partial<typeof RTCRtpReceiver> => {
  return {
    getCapabilities: vi.fn(),
  };
});
vi.stubGlobal('RTCRtpReceiver', RTCRtpReceiverMock);

const RTCRtpSenderMock = vi.fn((): Partial<typeof RTCRtpSender> => {
  return {
    getCapabilities: vi.fn(),
    // @ts-ignore
    track: vi.fn(),
  };
});
vi.stubGlobal('RTCRtpSender', RTCRtpSenderMock);
