import { vi } from 'vitest';

const RTCPeerConnectionMock = vi.fn(function (): Partial<RTCPeerConnection> {
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
    getReceivers: vi.fn().mockReturnValue([]),
    getSenders: vi.fn().mockReturnValue([]),
    removeTrack: vi.fn(),
  };
});
vi.stubGlobal('RTCPeerConnection', RTCPeerConnectionMock);

const MediaStreamMock = vi.fn(function (): Partial<MediaStream> {
  return {
    getTracks: vi.fn().mockReturnValue([]),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    getAudioTracks: vi.fn().mockReturnValue([]),
    getVideoTracks: vi.fn().mockReturnValue([]),
  };
});
vi.stubGlobal('MediaStream', MediaStreamMock);

const MediaStreamTrackMock = vi.fn(function (): Partial<MediaStreamTrack> {
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

// Minimal RTCIceTransport stand-in. `getSelectedCandidatePair` defaults to
// `null`; `__setSelectedCandidatePair` lets the Publisher reconnect tests drive
// the selected pair across a disconnect/reconnect flap.
const makeIceTransportMock = () => {
  let selected: RTCIceCandidatePair | null = null;
  return {
    getSelectedCandidatePair: vi.fn(() => selected),
    __setSelectedCandidatePair: (pair: RTCIceCandidatePair | null) => {
      selected = pair;
    },
  };
};

const RTCRtpTransceiverMock = vi.fn(function (): Partial<RTCRtpTransceiver> {
  return {
    sender: {
      track: null,
      replaceTrack: vi.fn(),
      getParameters: vi.fn().mockReturnValue({}),
      setParameters: vi.fn(),
      transport: {
        // @ts-expect-error - incomplete mock
        iceTransport: makeIceTransportMock(),
      },
    },
    setCodecPreferences: vi.fn(),
    mid: '',
  };
});
vi.stubGlobal('RTCRtpTransceiver', RTCRtpTransceiverMock);

const RTCTrackEvent = vi.fn(function (
  type: string,
  eventInitDict: RTCTrackEventInit,
): Partial<RTCTrackEvent> {
  return {
    type,
    ...eventInitDict,
  };
});
vi.stubGlobal('RTCTrackEvent', RTCTrackEvent);

const RTCRtpReceiverMock = vi.fn(function (): Partial<typeof RTCRtpReceiver> {
  return {
    getCapabilities: vi.fn(),
  };
});
vi.stubGlobal('RTCRtpReceiver', RTCRtpReceiverMock);

const RTCRtpSenderMock = vi.fn(function (): Partial<typeof RTCRtpSender> {
  return {
    getCapabilities: vi.fn(),
    // @ts-expect-error - incomplete mock
    track: vi.fn(),
  };
});
vi.stubGlobal('RTCRtpSender', RTCRtpSenderMock);

const AudioContextMock = vi.fn(function (): Partial<AudioContext> {
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
    // Silent keep-alive node used by DynascaleManager's probe AudioContext.
    createConstantSource: vi.fn(() => {
      return {
        offset: { value: 0 },
        connect: vi.fn((v) => v),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      } as unknown as ConstantSourceNode;
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
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
});
vi.stubGlobal('AudioContext', AudioContextMock);
