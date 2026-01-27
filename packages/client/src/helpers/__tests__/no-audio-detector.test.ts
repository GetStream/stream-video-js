import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createNoAudioDetector } from '../no-audio-detector';
import { mockAudioStream } from '../../devices/__tests__/mocks';
import {
  setupAudioContextMock,
  cleanupAudioContextMock,
} from '../../devices/__tests__/web-audio.mocks';

describe('no-audio-detector (browser)', () => {
  let mockAudioContext: ReturnType<typeof setupAudioContextMock>;
  let audioStream: MediaStream;

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
    it('should create AudioContext and AnalyserNode on initialization', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, { onCaptureStatusChange });

      expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
      expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(
        audioStream,
      );
    });

    it('should clean up AudioContext and clear interval on stop', async () => {
      const onCaptureStatusChange = vi.fn();

      const stop = createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
      });
      await stop();

      expect(mockAudioContext.close).toHaveBeenCalled();
      expect(mockAudioContext.state).toBe('closed');
    });

    it('should not close AudioContext if already closed', async () => {
      const onCaptureStatusChange = vi.fn();
      const stop = createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
      });

      // Manually close the context
      await mockAudioContext.close!();
      vi.mocked(mockAudioContext.close).mockClear();

      // Stop should not call close again
      await stop();

      expect(mockAudioContext.close).not.toHaveBeenCalled();
    });
  });

  describe('no audio detection', () => {
    it('should not emit event before threshold is reached', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 5000,
        detectionFrequencyInMs: 500,
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(0);
        },
      );

      // Advance time but not past threshold
      vi.advanceTimersByTime(4500);

      expect(onCaptureStatusChange).not.toHaveBeenCalled();
    });

    it('should emit event after threshold is reached with no audio', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 5000,
        detectionFrequencyInMs: 500,
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(0);
        },
      );

      // Advance past threshold (threshold + one interval period)
      vi.advanceTimersByTime(5500);

      expect(onCaptureStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({
          capturesAudio: false,
        }),
      );
    });

    it('should include device metadata in no-audio events', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 5000,
        detectionFrequencyInMs: 500,
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(0);
        },
      );

      vi.advanceTimersByTime(5500);

      expect(onCaptureStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({
          capturesAudio: false,
          deviceId: expect.any(String),
          label: expect.any(String),
        }),
      );
    });

    it('should emit events periodically while no audio continues', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 5000,
        emitIntervalMs: 5000,
        detectionFrequencyInMs: 500,
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(0);
        },
      );

      // First event at 5.5s (5s threshold + 500ms first interval)
      vi.advanceTimersByTime(5500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(1);

      // Second event at 10.5s (5s more)
      vi.advanceTimersByTime(5000);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(2);

      // Third event at 15.5s (5s more)
      vi.advanceTimersByTime(5000);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(3);
    });

    it('should respect custom emit interval', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 3000,
        emitIntervalMs: 2000, // Different from threshold
        detectionFrequencyInMs: 500,
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(0);
        },
      );

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
    it('should detect audio when frequency data exceeds threshold', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 5000,
        detectionFrequencyInMs: 500,
        audioLevelThreshold: 5,
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(0);
        },
      );

      // Advance to emit no-audio event
      vi.advanceTimersByTime(5500);
      expect(onCaptureStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ capturesAudio: false }),
      );

      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(10);
        },
      );

      // Advance one more detection cycle
      vi.advanceTimersByTime(500);

      expect(onCaptureStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ capturesAudio: true }),
      );
    });

    it('should stop checking after audio is detected', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 5000,
        detectionFrequencyInMs: 500,
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(0);
        },
      );

      // Emit no-audio event
      vi.advanceTimersByTime(5500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(1);

      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(10);
        },
      );
      vi.advanceTimersByTime(500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(2);
      expect(onCaptureStatusChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ capturesAudio: true }),
      );

      // Clear mock to verify no more calls
      onCaptureStatusChange.mockClear();

      // Advance time significantly - no more events should be emitted
      vi.advanceTimersByTime(10000);
      expect(onCaptureStatusChange).not.toHaveBeenCalled();
    });

    it('should emit initial audio detected event on first check', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 5000,
        detectionFrequencyInMs: 500,
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(10);
        },
      );

      // First check should emit initial "audio working" event
      vi.advanceTimersByTime(500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(1);
      expect(onCaptureStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ capturesAudio: true }),
      );

      // No more events after that with continuous audio
      onCaptureStatusChange.mockClear();
      vi.advanceTimersByTime(10000);
      expect(onCaptureStatusChange).not.toHaveBeenCalled();
    });

    it('should respect custom audio level threshold', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 5000,
        detectionFrequencyInMs: 500,
        audioLevelThreshold: 20, // Custom threshold
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(15);
        },
      );

      // Should detect as no audio since 15 < 20
      vi.advanceTimersByTime(5500);
      expect(onCaptureStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ capturesAudio: false }),
      );

      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(25);
        },
      );
      vi.advanceTimersByTime(500);

      expect(onCaptureStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ capturesAudio: true }),
      );
    });
  });

  describe('track state handling', () => {
    it('should reset state when track becomes inactive', () => {
      const onCaptureStatusChange = vi.fn();
      const [track] = audioStream.getAudioTracks();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 5000,
        detectionFrequencyInMs: 500,
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(0);
        },
      );

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
      const onCaptureStatusChange = vi.fn();
      const [track] = audioStream.getAudioTracks() as Array<
        Omit<MediaStreamTrack, 'readyState'> & { readyState: string }
      >;

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 5000,
        detectionFrequencyInMs: 500,
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(0);
        },
      );

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

  describe('configuration options', () => {
    it('should use custom detection frequency', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 5000,
        detectionFrequencyInMs: 1000, // Check every 1s instead of 500ms
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(0);
        },
      );

      // Advance by detection frequency
      vi.advanceTimersByTime(1000);

      // Should have checked once (getByteFrequencyData called)
      expect(
        vi.mocked(analyserNode.getByteFrequencyData).mock.calls.length,
      ).toBeGreaterThan(0);
    });

    it('should configure FFT size', () => {
      const onCaptureStatusChange = vi.fn();
      const customFftSize = 512;

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        fftSize: customFftSize,
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      expect(analyserNode.fftSize).toBe(customFftSize);
    });

    it('should default to 256 FFT size if not specified', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, { onCaptureStatusChange });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      expect(analyserNode.fftSize).toBe(256);
    });

    it('should default to 5000ms threshold if not specified', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, { onCaptureStatusChange });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(0);
        },
      );

      // Should not emit before threshold + first interval (5000ms + 350ms = 5350ms)
      vi.advanceTimersByTime(5000);
      expect(onCaptureStatusChange).not.toHaveBeenCalled();

      // Should emit at 5600ms (first interval where elapsed >= 5000ms)
      vi.advanceTimersByTime(600);
      expect(onCaptureStatusChange).toHaveBeenCalled();
    });

    it('should default emit interval to threshold value', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 3000,
        // emitIntervalMs not specified - should default to 3000
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(0);
        },
      );

      // First at 3.5s (first interval where elapsed >= 3000ms)
      vi.advanceTimersByTime(3500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(1);

      // Second at 6.65s (3000ms emit interval from first emit at 3500ms)
      vi.advanceTimersByTime(3150);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('stopping behavior', () => {
    it('should stop completely after emitting capturesAudio true', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 3000,
        detectionFrequencyInMs: 500,
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;

      // Start with no audio
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(0);
        },
      );

      // Emit first no-audio event
      vi.advanceTimersByTime(3500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(1);
      expect(onCaptureStatusChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ capturesAudio: false }),
      );

      // Audio detected, should emit capturesAudio: true and stop
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(10);
        },
      );
      vi.advanceTimersByTime(500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(2);
      expect(onCaptureStatusChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ capturesAudio: true }),
      );

      // Verify interval stopped and AudioContext closed
      onCaptureStatusChange.mockClear();
      vi.advanceTimersByTime(10000);
      expect(onCaptureStatusChange).not.toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('should stop immediately if audio working from start', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 3000,
        detectionFrequencyInMs: 500,
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;

      // Start with audio working
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(10);
        },
      );

      // Should emit initial "audio working" event and stop
      vi.advanceTimersByTime(500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(1);
      expect(onCaptureStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ capturesAudio: true }),
      );

      // Verify stopped completely
      onCaptureStatusChange.mockClear();
      vi.advanceTimersByTime(10000);
      expect(onCaptureStatusChange).not.toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid audio state changes', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 5000,
        detectionFrequencyInMs: 500,
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(0);
        },
      );

      // Emit no-audio event
      vi.advanceTimersByTime(5500);
      expect(onCaptureStatusChange).toHaveBeenCalledTimes(1);

      // Toggle audio on/off rapidly
      for (let i = 0; i < 5; i++) {
        vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
          (array) => {
            array.fill(10);
          },
        );
        vi.advanceTimersByTime(100);

        vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
          (array) => {
            array.fill(0);
          },
        );
        vi.advanceTimersByTime(100);
      }

      // Should have detected audio and stopped
      expect(onCaptureStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ capturesAudio: true }),
      );
    });

    it('should handle empty audio tracks array', () => {
      const onCaptureStatusChange = vi.fn();
      const emptyStream = {
        getAudioTracks: () => [],
      } as Partial<MediaStream> as MediaStream;

      const stop = createNoAudioDetector(emptyStream, {
        onCaptureStatusChange,
      });

      // Should not crash or emit events
      vi.advanceTimersByTime(10000);
      expect(onCaptureStatusChange).not.toHaveBeenCalled();

      // Cleanup should work
      expect(() => stop()).not.toThrow();
    });

    it('should calculate elapsed time correctly for no-audio events', () => {
      const onCaptureStatusChange = vi.fn();

      createNoAudioDetector(audioStream, {
        onCaptureStatusChange,
        noAudioThresholdMs: 5000,
        emitIntervalMs: 3000,
        detectionFrequencyInMs: 500,
      });

      const analyserNode = vi
        .mocked(mockAudioContext.createAnalyser)
        .mock.results.at(-1)?.value;
      vi.mocked(analyserNode.getByteFrequencyData).mockImplementation(
        (array) => {
          array.fill(0);
        },
      );

      // First event at 5.5s total (noAudioStartTime set at 500ms, so elapsed = 5000ms)
      vi.advanceTimersByTime(5500);
      expect(onCaptureStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({
          capturesAudio: false,
        }),
      );

      // Second event at 8.5s total (elapsed = 8000ms from noAudioStartTime)
      vi.advanceTimersByTime(3000);
      expect(onCaptureStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({
          capturesAudio: false,
        }),
      );

      // Third event at 11.5s total (elapsed = 11000ms from noAudioStartTime)
      vi.advanceTimersByTime(3000);
      expect(onCaptureStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({
          capturesAudio: false,
        }),
      );
    });
  });
});
