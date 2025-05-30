import { vi } from 'vitest';

const RTCPeerConnectionMock = vi.fn((): Partial<RTCPeerConnection> => {
  return {
    addEventListener: vi.fn(),
    addIceCandidate: vi.fn(),
    removeEventListener: vi.fn(),
    getTransceivers: vi.fn(),
    addTransceiver: vi.fn().mockReturnValue(new RTCRtpTransceiverMock()),
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
    // @ts-expect-error - incomplete mock
    sender: {
      track: null,
      replaceTrack: vi.fn(),
      getParameters: vi.fn().mockReturnValue({}),
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
    // @ts-expect-error - incomplete mock
    track: vi.fn(),
  };
});
vi.stubGlobal('RTCRtpSender', RTCRtpSenderMock);

const AudioContextMock = vi.fn((): Partial<AudioContext> => {
  return {
    state: 'suspended',
    sinkId: '',
    // @ts-expect-error - incomplete data
    destination: {},
    createMediaStreamSource: vi.fn(() => {
      return {
        connect: vi.fn((v) => v),
        disconnect: vi.fn(),
      } as unknown as MediaStreamAudioSourceNode;
    }),
    createGain: vi.fn(() => {
      return {
        connect: vi.fn((v) => v),
        disconnect: vi.fn(),
        gain: { value: 1 },
      } as unknown as GainNode;
    }),
    close: vi.fn(async function () {
      this.state = 'closed';
    }),
    resume: vi.fn(async function () {
      this.state = 'running';
    }),
    setSinkId: vi.fn(async function (sinkId: string) {
      this.sinkId = sinkId;
    }),
  };
});
vi.stubGlobal('AudioContext', AudioContextMock);
