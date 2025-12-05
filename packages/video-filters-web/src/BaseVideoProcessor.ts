import { VideoTrackProcessorHooks } from './types';
import { TrackGenerator, MediaStreamTrackGenerator } from './FallbackGenerator';
import { MediaStreamTrackProcessor, TrackProcessor } from './FallbackProcessor';

/**
 * Base class for real-time video filters.
 *
 * It sets up the full pipeline that reads frames from the input track,
 * processes them, and outputs a new track with your effect applied. Subclasses
 * only need to implement `initialize` (run once before processing starts) and
 * `transform` (called for every frame).
 *
 * Everything else—canvas setup, performance tracking, error handling, and
 * clean shutdown is handled for you. Calling `start()` returns a processed
 * `MediaStreamTrack` ready to use.
 */
export abstract class BaseVideoProcessor {
  protected readonly processor: MediaStreamTrackProcessor<VideoFrame>;
  protected readonly generator: MediaStreamTrackGenerator<VideoFrame>;

  protected readonly hooks: VideoTrackProcessorHooks;

  protected readonly abortController = new AbortController();
  protected canvas!: OffscreenCanvas;

  private frames = 0;
  private delayTotal = 0;
  private lastStatsTime = 0;

  /**
   * Constructs a new instance.
   */
  protected constructor(
    protected readonly track: MediaStreamVideoTrack,
    hooks: VideoTrackProcessorHooks = {},
  ) {
    this.processor = new TrackProcessor({ track });
    this.generator = new TrackGenerator({
      kind: 'video',
      signalTarget: track,
    });
    this.hooks = hooks;
  }

  public async start(): Promise<MediaStreamTrack> {
    const { readable } = this.processor;
    const { writable } = this.generator;

    const { width = 1280, height = 720 } = this.track.getSettings();
    this.canvas = new OffscreenCanvas(width, height);

    await this.initialize();

    const transformStream = new TransformStream<VideoFrame, VideoFrame>({
      transform: async (frame, controller) => {
        try {
          if (this.abortController.signal.aborted) return frame.close();

          if (
            this.canvas.width !== frame.displayWidth ||
            this.canvas.height !== frame.displayHeight
          ) {
            this.canvas.width = frame.displayWidth;
            this.canvas.height = frame.displayHeight;
          }

          const start = performance.now();
          const processed = await this.transform(frame);
          const delay = performance.now() - start;

          this.updateStats(delay);
          controller.enqueue(processed);
        } catch (e) {
          this.hooks.onError?.(e);
        } finally {
          frame.close();
        }
      },
      flush: () => this.onFlush(),
    });

    readable
      .pipeThrough(transformStream, { signal: this.abortController.signal })
      .pipeTo(writable, { signal: this.abortController.signal })
      .catch((e) => {
        if (e.name !== 'AbortError' && e.name !== 'InvalidStateError') {
          console.error(`[${this.processorName}] Error processing track:`, e);
          this.hooks.onError?.(e);
        }
      });

    return this.generator;
  }

  public stop(): void {
    this.abortController.abort();
    this.generator.stop();
    this.onStop();
  }

  private updateStats(delay: number): void {
    this.frames++;
    this.delayTotal += delay;

    const now = performance.now();
    if (this.lastStatsTime === 0) {
      this.lastStatsTime = now;
      return;
    }

    if (now - this.lastStatsTime >= 1000) {
      const avgDelay = Math.round((this.delayTotal / this.frames) * 100) / 100;
      const fps = Math.round((1000 * this.frames) / (now - this.lastStatsTime));

      this.hooks.onStats?.({ delay: avgDelay, fps, timestamp: now });

      this.frames = 0;
      this.delayTotal = 0;
      this.lastStatsTime = now;
    }
  }

  protected abstract initialize(): Promise<void>;
  protected abstract transform(frame: VideoFrame): Promise<VideoFrame>;

  protected onFlush(): void {}
  protected onStop(): void {}

  protected get processorName(): string {
    return 'base-processor';
  }
}
