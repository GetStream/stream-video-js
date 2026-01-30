import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createNoAudioDetector } from '../no-audio-detector';
import type { NoAudioDetectorOptions } from '../no-audio-detector';
import { mockAudioStream } from '../../devices/__tests__/mocks';
import {
  setupAudioContextMock,
  cleanupAudioContextMock,
  createMockAnalyserNode,
} from '../../devices/__tests__/web-audio.mocks';

describe('no-audio-detector (browser)', () => {
  let mockAudioContext: ReturnType<typeof setupAudioContextMock>;
  let audioStream: MediaStream;
  type MockAnalyserNode = ReturnType<typeof createMockAnalyserNode> & {
    getByteFrequencyData: ReturnType<typeof vi.fn>;
  };

  const getAnalyserNode = () => {
    const analyserNode = vi
      .mocked(mockAudioContext.createAnalyser!)
      .mock.results.at(-1)?.value as MockAnalyserNode | undefined;
    expect(analyserNode).toBeDefined();
    return analyserNode!;
  };

  const createDetector = (overrides?: Partial<NoAudioDetectorOptions>) => {
    const onCaptureStatusChange = vi.fn();
    createNoAudioDetector(audioStream, {
      onCaptureStatusChange,
      noAudioThresholdMs: 5000,
      emitIntervalMs: 5000,
      detectionFrequencyInMs: 500,
      audioLevelThreshold: 1, // Use threshold of 1 so level 0 is detected as "no audio"
      ...overrides,
    });

    return { onCaptureStatusChange, analyserNode: getAnalyserNode() };
  };

  const setAudioLevel = (analyserNode: MockAnalyserNode, level: number) => {
    vi.mocked(analyserNode.getByteFrequencyData).mockImplementation((array) => {
      array.fill(level);
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockAudioContext = setupAudioContextMock();
    audioStream = mockAudioStream();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    cleanupAudioContextMock();
  });

  describe('detector lifecycle', () => {
    it('should clean up AudioContext and clear interval on stop', async () => {
      const onCaptureStatusChange = vi.fn();

      const stop = createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 5000,
        emitIntervalMs: 5000,
      });
      await stop();

      expect(mockAudioContext.close).toHaveBeenCalled();
      expect(mockAudioContext.state).toBe('closed');
    });
  });

  describe('no audio detection', () => {
    it('should not emit event before threshold is reached', () => {
      const { onCaptureStatusChange, analyserNode } = createDetector();
      setAudioLevel(analyserNode, 0);

      // Advance time but not past threshold
      vi.advanceTimersByTime(4500);

      expect(onCaptureStatusChange).not.toHaveBeenCalled();
    });

    it('should emit event after threshold is reached with no audio', () => {
      const { onCaptureStatusChange, analyserNode } = createDetector();
      setAudioLevel(analyserNode, 0);

      // Advance past threshold (threshold + one interval period)
      vi.advanceTimersByTime(5500);

      expect(onCaptureStatusChange).toHaveBeenCalledWith(false);
    });

    it('should respect custom emit interval', () => {
      const { onCaptureStatusChange, analyserNode } = createDetector({
        noAudioThresholdMs: 3000,
        emitIntervalMs: 2000, // Different from threshold
      });
      setAudioLevel(analyserNode, 0);

      // First event at 3.5s (3s threshold + 500ms first interval)
      vi.advanceTimersByTime(3500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(1);

      // Second event at 5.5s (3.5s + 2s interval)
      vi.advanceTimersByTime(2000);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(2);

      // Third event at 7.5s (5.5s + 2s interval)
      vi.advanceTimersByTime(2000);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('audio detection', () => {
    it('should stop checking after audio is detected', () => {
      const { onCaptureStatusChange, analyserNode } = createDetector();
      setAudioLevel(analyserNode, 0);

      // Emit no-audio event
      vi.advanceTimersByTime(5500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(1);

      setAudioLevel(analyserNode, 10);
      vi.advanceTimersByTime(500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(2);
      expect(onCaptureStatusChange).toHaveBeenLastCalledWith(true);

      // Clear mock to verify no more calls
      onCaptureStatusChange.mockClear();

      // Advance time significantly - no more events should be emitted
      vi.advanceTimersByTime(10000);
      expect(onCaptureStatusChange).not.toHaveBeenCalled();
    });

    it('should respect custom audio level threshold', () => {
      const { onCaptureStatusChange, analyserNode } = createDetector({
        audioLevelThreshold: 20, // Custom threshold
      });
      setAudioLevel(analyserNode, 15);

      // Should detect as no audio since 15 < 20
      vi.advanceTimersByTime(5500);
      expect(onCaptureStatusChange).toHaveBeenCalledWith(false);

      setAudioLevel(analyserNode, 25);
      vi.advanceTimersByTime(500);

      expect(onCaptureStatusChange).toHaveBeenCalledWith(true);
    });
  });

  describe('track state handling', () => {
    it('should reset state when track becomes inactive', () => {
      const [track] = audioStream.getAudioTracks();
      const { onCaptureStatusChange, analyserNode } = createDetector();
      setAudioLevel(analyserNode, 0);

      // Advance partway to threshold
      vi.advanceTimersByTime(3000);

      track.enabled = false;

      // Advance detection cycle
      vi.advanceTimersByTime(500);

      track.enabled = true;

      // Should need to wait full threshold again from reset
      vi.advanceTimersByTime(3000);
      expect(onCaptureStatusChange).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(1);
    });

    it('should reset state when track ends', () => {
      const [track] = audioStream.getAudioTracks() as Array<
        Omit<MediaStreamTrack, 'readyState'> & { readyState: string }
      >;
      const { onCaptureStatusChange, analyserNode } = createDetector();
      setAudioLevel(analyserNode, 0);

      // Advance partway
      vi.advanceTimersByTime(3000);

      track.readyState = 'ended';

      // Advance detection cycle
      vi.advanceTimersByTime(500);

      // Should not emit (track ended)
      vi.advanceTimersByTime(5000);
      expect(onCaptureStatusChange).not.toHaveBeenCalled();
    });
  });

  describe('stopping behavior', () => {
    it('should stop completely after emitting capturesAudio true', () => {
      const { onCaptureStatusChange, analyserNode } = createDetector({
        noAudioThresholdMs: 3000,
      });

      // Start with no audio
      setAudioLevel(analyserNode, 0);

      // Emit first no-audio event
      vi.advanceTimersByTime(3500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(1);
      expect(onCaptureStatusChange).toHaveBeenLastCalledWith(false);

      // Audio detected, should emit capturesAudio: true and stop
      setAudioLevel(analyserNode, 10);
      vi.advanceTimersByTime(500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(2);
      expect(onCaptureStatusChange).toHaveBeenLastCalledWith(true);

      // Verify interval stopped and AudioContext closed
      onCaptureStatusChange.mockClear();
      vi.advanceTimersByTime(10000);
      expect(onCaptureStatusChange).not.toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('should stop immediately if audio working from start', () => {
      const { onCaptureStatusChange, analyserNode } = createDetector({
        noAudioThresholdMs: 3000,
        emitIntervalMs: 3000,
      });

      // Start with audio working
      setAudioLevel(analyserNode, 10);

      // Should emit initial "audio working" event and stop
      vi.advanceTimersByTime(500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(1);
      expect(onCaptureStatusChange).toHaveBeenCalledWith(true);

      // Verify stopped completely
      onCaptureStatusChange.mockClear();
      vi.advanceTimersByTime(10000);
      expect(onCaptureStatusChange).not.toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty audio tracks array', () => {
      const onCaptureStatusChange = vi.fn();
      const emptyStream = {
        getAudioTracks: () => [],
      } as Partial<MediaStream> as MediaStream;

      const stop = createNoAudioDetector(emptyStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 5000,
        emitIntervalMs: 5000,
        detectionFrequencyInMs: 500,
      });

      // Should not crash or emit events
      vi.advanceTimersByTime(10000);
      expect(onCaptureStatusChange).not.toHaveBeenCalled();

      // Cleanup should work
      expect(() => stop()).not.toThrow();
    });
  });
});
