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
  protected processor!: MediaStreamTrackProcessor<VideoFrame>;
  protected generator!: MediaStreamTrackGenerator<VideoFrame>;

  protected readonly hooks: VideoTrackProcessorHooks;

  protected readonly abortController = new AbortController();
  protected canvas!: OffscreenCanvas;

  private started = false;
  private piped = false;
  private disposed = false;

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
    this.hooks = hooks;
  }

  public async start(): Promise<MediaStreamTrack> {
    if (this.started) {
      throw new Error(`[${this.processorName}] start() was already called`);
    }
    if (this.abortController.signal.aborted) {
      throw new Error(`[${this.processorName}] Already stopped`);
    }
    this.started = true;

    this.processor = new TrackProcessor({ track: this.track });
    this.generator = new TrackGenerator({
      kind: 'video',
      signalTarget: this.track,
    });
    const { readable } = this.processor;
    const { writable } = this.generator;

    const { width = 1280, height = 720 } = this.track.getSettings();
    this.canvas = new OffscreenCanvas(width, height);

    try {
      await this.initialize();
    } catch (e) {
      this.stop();
      throw e;
    }
    if (this.abortController.signal.aborted) {
      throw new Error(`[${this.processorName}] Stopped during initialize()`);
    }

    const { signal } = this.abortController;
    const transformStream = new TransformStream<VideoFrame, VideoFrame>({
      transform: async (frame, controller) => {
        try {
          if (signal.aborted) return;

          if (
            this.canvas.width !== frame.displayWidth ||
            this.canvas.height !== frame.displayHeight
          ) {
            this.canvas.width = frame.displayWidth;
            this.canvas.height = frame.displayHeight;
          }

          const processed = await this.transform(frame);

          if (signal.aborted) return processed.close();
          controller.enqueue(processed);
        } catch (e) {
          if (!signal.aborted) this.hooks.onError?.(e);
        } finally {
          frame.close();
        }
      },
      // the source ended by itself (e.g. the camera was unplugged)
      flush: () => this.dispose(),
    });

    this.piped = true;
    readable
      .pipeThrough(transformStream, { signal })
      .pipeTo(writable, { signal })
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
    if (!this.piped) {
      this.processor?.readable.cancel().catch(() => {});
    }
    this.generator?.stop();
    this.dispose();
  }

  /**
   * Runs the subclass cleanup hooks exactly once, whether the processor was
   * stopped or its source ended on its own.
   */
  private dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.onFlush();
    this.onStop();
  }

  protected updateStats(delay: number): void {
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

  /**
   * Cleanup hooks. Both run once, in this order, when the processor is
   * stopped or when its source ends on its own.
   */
  protected onFlush(): void {}
  protected onStop(): void {}

  protected get processorName(): string {
    return 'base-processor';
  }
}
