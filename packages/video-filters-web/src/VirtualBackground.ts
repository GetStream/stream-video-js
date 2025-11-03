import {
  BACKGROUND_BLUR_MAP,
  BackgroundOptions,
  SegmenterOptions,
  VideoTrackProcessorHooks,
} from './types';
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';
import { WebGLRenderer } from './WebGLRenderer';
import { packageName, version } from './version';

/**
 * Wraps a track in a real-time processing pipeline where each frame
 * passes through a transformer and outputs a new `MediaStreamVideoTrack`
 */
export class VirtualBackground {
  private readonly processor: MediaStreamTrackProcessor<VideoFrame>;
  private readonly generator: MediaStreamTrackGenerator<VideoFrame>;

  private canvas!: OffscreenCanvas;
  private segmenter: ImageSegmenter | null = null;
  private isSegmenterReady = false;
  private webGlRenderer!: WebGLRenderer;
  private abortController: AbortController;

  constructor(
    private readonly track: MediaStreamVideoTrack,
    private readonly options: BackgroundOptions = {},
    private readonly hooks: VideoTrackProcessorHooks = {},
  ) {
    this.processor = new MediaStreamTrackProcessor({ track });
    this.generator = new MediaStreamTrackGenerator({ kind: 'video' });

    this.abortController = new AbortController();
  }

  public async processTrack(): Promise<MediaStreamTrack> {
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
      .pipeTo(writable)
      .catch((e) => {
        if (e.name !== 'AbortError') {
          console.error('[virtual-background] Error processing track:', e);
          onError?.(e);
        }
      });

    return this.generator as MediaStreamVideoTrack;
  }

  /**
   * Loads and initializes the MediaPipe `ImageSegmenter`.
   */
  private async initializeSegmenter() {
    try {
      const defaultModelPath = `https://unpkg.com/${packageName}@${version}/mediapipe/models/selfie_segmenter.tflite`;

      const model = this.options?.modelPath || defaultModelPath;

      const fileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm',
      );

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
  async transform(
    frame: VideoFrame,
    opts: SegmenterOptions,
  ): Promise<VideoFrame> {
    if (this.isSegmenterReady && this.segmenter) {
      const { modelPath } = this.options;
      try {
        const isSelfieMode = modelPath
          ? modelPath?.includes('selfie_segmenter')
          : true;

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
              isSelfieMode,
            );

            resolve();
          });
        });
      } catch (error) {
        console.error('[virtual-background] Error during segmentation:', error);
      }
    }

    return new VideoFrame(this.canvas, { timestamp: frame.timestamp });
  }

  async loadBackground(url: string | undefined) {
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
    if (this.options.backgroundFilter === 'image') {
      return {
        backgroundSource: await this.loadBackground(
          this.options.backgroundImage,
        ),
        bgBlur: 0,
        bgBlurRadius: 0,
      };
    }

    return {
      ...BACKGROUND_BLUR_MAP[this.options.backgroundBlurLevel || 'medium'],
      backgroundSource: undefined,
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
