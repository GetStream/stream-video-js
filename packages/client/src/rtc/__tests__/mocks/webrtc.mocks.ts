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

const RTCRtpTransceiverMock = vi.fn(function (): Partial<RTCRtpTransceiver> {
  return {
    // @ts-expect-error - incomplete mock
    sender: {
      track: null,
      replaceTrack: vi.fn(),
      getParameters: vi.fn().mockReturnValue({}),
      setParameters: vi.fn(),
      transform: null,
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
RTCRtpReceiverMock.prototype.transform = null;
vi.stubGlobal('RTCRtpReceiver', RTCRtpReceiverMock);

const RTCRtpSenderMock = vi.fn(function (): Partial<typeof RTCRtpSender> {
  return {
    getCapabilities: vi.fn(),
    // @ts-expect-error - incomplete mock
    track: vi.fn(),
  };
});
RTCRtpSenderMock.prototype.transform = null;
vi.stubGlobal('RTCRtpSender', RTCRtpSenderMock);

const WorkerMock = vi.fn((): Partial<Worker> => {
  return {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
});
vi.stubGlobal('Worker', WorkerMock);

const RTCRtpScriptTransformMock = vi.fn(
  (worker: Worker, options?: unknown): Partial<RTCRtpScriptTransform> => {
    return {
      worker,
      options,
    };
  },
);
vi.stubGlobal('RTCRtpScriptTransform', RTCRtpScriptTransformMock);

if (typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'function') {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:stream-video-e2ee'),
  });
}

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
