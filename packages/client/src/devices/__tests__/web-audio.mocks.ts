import { vi } from 'vitest';

/**
 * Mock AnalyserNode for testing audio analysis in no-audio-detector
 */
export const createMockAnalyserNode = (
  initialFftSize: number = 256,
): Partial<AnalyserNode> => {
  let fftSize = initialFftSize;

  return {
    get fftSize() {
      return fftSize;
    },
    set fftSize(value: number) {
      fftSize = value;
    },
    get frequencyBinCount() {
      return fftSize / 2;
    },
    // Default implementation fills array with midpoint (silence waveform)
    // Tests can override with mockImplementation to simulate different audio levels.
    getByteTimeDomainData: vi.fn((array: Uint8Array) => {
      array.fill(128);
    }),
    // Keep frequency-domain API for other helpers that use it.
    getByteFrequencyData: vi.fn((array: Uint8Array) => {
      array.fill(0);
    }),
  };
};

/**
 * Mock AudioContext for testing Web Audio API usage in no-audio-detector
 */
export const createMockAudioContext = (): Partial<AudioContext> => {
  let contextState: AudioContextState = 'running';

  return {
    get state() {
      return contextState;
    },
    createAnalyser: vi.fn(() => {
      return createMockAnalyserNode() as AnalyserNode;
    }),
    createMediaStreamSource: vi.fn((stream: MediaStream) => {
      return {
        connect: vi.fn((destination: AudioNode) => destination),
        disconnect: vi.fn(),
        mediaStream: stream,
      } as unknown as MediaStreamAudioSourceNode;
    }),
    close: vi.fn(async () => {
      contextState = 'closed';
    }),
  };
};

/**
 * Sets up global AudioContext mock for tests
 */
export const setupAudioContextMock = () => {
  const mockContext = createMockAudioContext();
  vi.stubGlobal(
    'AudioContext',
    vi.fn(() => mockContext),
  );
  return mockContext;
};

/**
 * Cleans up global AudioContext mock after tests
 */
export const cleanupAudioContextMock = () => {
  vi.unstubAllGlobals();
};
