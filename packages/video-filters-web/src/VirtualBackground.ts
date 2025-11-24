import {
  BACKGROUND_BLUR_MAP,
  BackgroundOptions,
  SegmenterOptions,
  VideoTrackProcessorHooks,
} from './types';
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';
import { WebGLRenderer } from './WebGLRenderer';
import { packageName, version } from './version';
import { TrackGenerator, MediaStreamTrackGenerator } from './FallbackGenerator';
import { MediaStreamTrackProcessor, TrackProcessor } from './FallbackProcessor';

/**
 * Wraps a video MediaStreamTrack in a real-time processing pipeline.
 * Incoming frames are processed through a transformer and re-emitted
 * on a new MediaStreamVideoTrack for downstream consumption.
 */
export class VirtualBackground {
  private readonly processor: MediaStreamTrackProcessor<VideoFrame>;
  private readonly generator: MediaStreamTrackGenerator<VideoFrame>;

  private canvas!: OffscreenCanvas;
  private segmenter: ImageSegmenter | null = null;
  private isSegmenterReady = false;
  private webGlRenderer!: WebGLRenderer;
  private abortController: AbortController;

  private segmenterDelayTotal = 0;
  private frames = 0;
  private lastStatsTime = 0;

  constructor(
    private readonly track: MediaStreamVideoTrack,
    private readonly options: BackgroundOptions = {},
    private readonly hooks: VideoTrackProcessorHooks = {},
  ) {
    this.processor = new TrackProcessor({ track });
    this.generator = new TrackGenerator({
      kind: 'video',
      signalTarget: track,
    });

    this.abortController = new AbortController();
  }

  public async start(): Promise<MediaStreamTrack> {
    const { onError } = this.hooks;

    const { readable } = this.processor;
    const { writable } = this.generator;

    const displayWidth = this.track.getSettings().width ?? 1280;
    const displayHeight = this.track.getSettings().height ?? 720;

    this.canvas = new OffscreenCanvas(displayWidth, displayHeight);
    this.webGlRenderer = new WebGLRenderer(this.canvas);

    await this.initializeSegmenter();

    const opts = await this.initializeSegmenterOptions();

    const transformStream = new TransformStream<VideoFrame, VideoFrame>({
      transform: async (frame, controller) => {
        try {
          if (this.abortController.signal.aborted) {
            return frame.close();
          }

          const processed = await this.transform(frame, opts);
          controller.enqueue(processed);
        } catch (e) {
          console.error('[virtual-background] error processing frame:', e);
          this.hooks.onError?.(e);

          if (!this.abortController.signal.aborted) {
            controller.enqueue(frame);
          }
        } finally {
          frame.close();
        }
      },
      flush: () => {
        if (this.segmenter) {
          this.segmenter.close();
          this.segmenter = null;
        }
        this.isSegmenterReady = false;
      },
    });

    const signal = this.abortController.signal;

    readable
      .pipeThrough(transformStream, { signal })
      .pipeTo(writable, { signal })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          console.error('[virtual-background] Error processing track:', e);
          onError?.(e);
        }
      });

    return this.generator;
  }

  /**
   * Loads and initializes the MediaPipe `ImageSegmenter`.
   */
  private async initializeSegmenter() {
    try {
      const basePath =
        this.options?.basePath ||
        `https://unpkg.com/${packageName}@${version}/mediapipe`;

      const defaultModelPath = `${basePath}/models/selfie_segmenter.tflite`;

      const model = this.options?.modelPath || defaultModelPath;

      const wasmPath = `${basePath}/wasm`;

      const fileset = await FilesetResolver.forVisionTasks(wasmPath);

      this.segmenter = await ImageSegmenter.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: model,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        outputCategoryMask: true,
        outputConfidenceMasks: true,
        canvas: this.canvas,
      });

      this.isSegmenterReady = true;
    } catch (error) {
      console.error(
        '[virtual-background] Failed to initialize MediaPipe segmenter:',
        error,
      );
      this.isSegmenterReady = false;
    }
  }

  /**
   * Processes a single video frame.
   *
   * Performs segmentation via MediaPipe and then composites the frame
   * through the WebGL renderer to apply background effects.
   *
   * @param frame - The incoming frame from the processor.
   * @param opts - The segmentation options to use.
   *
   * @returns A new `VideoFrame` containing the processed image.
   */
  private async transform(
    frame: VideoFrame,
    opts: SegmenterOptions,
  ): Promise<VideoFrame> {
    if (this.isSegmenterReady && this.segmenter) {
      try {
        const start = performance.now();
        await new Promise<void>((resolve) => {
          this.segmenter!.segmentForVideo(frame, frame.timestamp, (result) => {
            const categoryMask = result.categoryMask!.getAsWebGLTexture();
            const confidenceMask =
              result.confidenceMasks![0].getAsWebGLTexture();

            this.webGlRenderer.render(
              frame,
              opts,
              categoryMask,
              confidenceMask,
            );

            const now = performance.now();
            this.segmenterDelayTotal += now - start;
            this.frames++;

            if (this.lastStatsTime === 0) {
              this.lastStatsTime = now;
            }

            if (now - this.lastStatsTime > 1000) {
              const delay =
                Math.round((this.segmenterDelayTotal / this.frames) * 100) /
                100;
              const fps = Math.round(
                (1000 * this.frames) / (now - this.lastStatsTime),
              );

              this.hooks.onStats?.({ delay, fps, timestamp: now });

              this.lastStatsTime = now;
              this.segmenterDelayTotal = 0;
              this.frames = 0;
            }

            resolve();
          });
        });
      } catch (error) {
        console.error('[virtual-background] Error during segmentation:', error);
      }
    }

    return new VideoFrame(this.canvas, { timestamp: frame.timestamp });
  }

  private async loadBackground(url: string | undefined) {
    if (!url) {
      return;
    }

    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `[virtual-background] Failed to fetch background source ${url} (status: ${response.status})`,
      );
      return;
    }
    const blob = await response.blob();

    const imageBitmap = await createImageBitmap(blob);
    return { type: 'image', media: imageBitmap, url };
  }

  private async initializeSegmenterOptions(): Promise<SegmenterOptions> {
    const isSelfieMode = this.options.modelPath
      ? this.options.modelPath?.includes('selfie_segmenter')
      : true;

    if (this.options.backgroundFilter === 'image') {
      return {
        backgroundSource: await this.loadBackground(
          this.options.backgroundImage,
        ),
        bgBlur: 0,
        bgBlurRadius: 0,
        isSelfieMode,
      };
    }

    const blurLevel = this.options.backgroundBlurLevel;
    if (typeof blurLevel === 'string') {
      return {
        ...BACKGROUND_BLUR_MAP[blurLevel],
        backgroundSource: undefined,
        isSelfieMode,
      };
    }

    const numeric = blurLevel ?? 5;

    const bgBlur = Math.min(numeric * 3, 30);
    const bgBlurRadius = Math.min(numeric, 10);

    return {
      backgroundSource: undefined,
      bgBlur,
      bgBlurRadius,
      isSelfieMode,
    };
  }

  public stop(): void {
    this.abortController.abort();
    this.webGlRenderer.close();
    this.generator.stop();

    if (this.segmenter) {
      this.segmenter.close();
      this.segmenter = null;
    }
    this.isSegmenterReady = false;
  }
}
