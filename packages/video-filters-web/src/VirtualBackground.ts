import {
  BACKGROUND_BLUR_MAP,
  BackgroundOptions,
  SegmenterOptions,
  VideoTrackProcessorHooks,
} from './types';
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';
import { WebGLRenderer } from './WebGLRenderer';
import { packageName, version } from './version';
import { BaseVideoProcessor } from './BaseVideoProcessor';

/**
 * Wraps a video MediaStreamTrack in a real-time processing pipeline.
 * Incoming frames are processed through a transformer and re-emitted
 * on a new MediaStreamVideoTrack for downstream consumption.
 */
export class VirtualBackground extends BaseVideoProcessor {
  private segmenter: ImageSegmenter | null = null;
  private isSegmenterReady = false;
  private webGlRenderer!: WebGLRenderer;

  private opts!: SegmenterOptions;

  private latestCategoryMask: WebGLTexture | undefined = undefined;
  private latestConfidenceMask: WebGLTexture | undefined = undefined;
  private lastFrameTime = -1;
  private count = 0;

  constructor(
    track: MediaStreamVideoTrack,
    private readonly options: BackgroundOptions = {},
    hooks: VideoTrackProcessorHooks = {},
  ) {
    super(track, hooks);
  }

  protected async initialize(): Promise<void> {
    this.webGlRenderer = new WebGLRenderer(this.canvas);

    await this.initializeSegmenter();
  }

  private async initializeSegmenter() {
    try {
      this.opts = await this.initializeSegmenterOptions();

      const basePath =
        this.options.basePath ||
        `https://unpkg.com/${packageName}@${version}/mediapipe`;

      const model =
        this.options.modelPath || `${basePath}/models/selfie_segmenter.tflite`;

      const fileset = await FilesetResolver.forVisionTasks(`${basePath}/wasm`);

      this.segmenter = await ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: model, delegate: 'GPU' },
        runningMode: 'VIDEO',
        outputCategoryMask: true,
        outputConfidenceMasks: true,
        canvas: this.canvas,
      });

      this.isSegmenterReady = true;
    } catch (error) {
      console.error('[virtual-background] Segmenter init failed:', error);
      this.isSegmenterReady = false;
    }
  }

  protected async transform(frame: VideoFrame): Promise<VideoFrame> {
    const currentTime = frame.timestamp;
    const hasNewFrame = currentTime !== this.lastFrameTime;
    this.lastFrameTime = currentTime;

    if (hasNewFrame && this.isSegmenterReady && this.segmenter) {
      await this.runSegmentation(frame);

      this.webGlRenderer.render(
        frame,
        this.opts,
        this.latestCategoryMask,
        this.latestConfidenceMask,
      );
    }

    return new VideoFrame(this.canvas, { timestamp: frame.timestamp });
  }

  private async runSegmentation(frame: VideoFrame): Promise<void> {
    if (!this.segmenter) return;

    return new Promise<void>((resolve) => {
      const timestamp = Math.floor(performance.now());
      this.segmenter!.segmentForVideo(frame, timestamp, (result) => {
        try {
          this.latestCategoryMask = result.categoryMask?.getAsWebGLTexture();
          this.latestConfidenceMask =
            result.confidenceMasks?.[0]?.getAsWebGLTexture();
        } catch (err) {
          console.error('[virtual-background] segmentation error:', err);
          this.hooks.onError?.(err);
        } finally {
          result.close();
          resolve();
        }
      });
    });
  }

  private async initializeSegmenterOptions(): Promise<SegmenterOptions> {
    const isSelfieMode = this.options.modelPath
      ? this.options.modelPath.includes('selfie_segmenter')
      : true;

    if (this.options.backgroundFilter === 'image') {
      const source = await this.loadBackground(this.options.backgroundImage);
      return {
        backgroundSource: source,
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
    return {
      backgroundSource: undefined,
      bgBlur: Math.min(numeric * 3, 30),
      bgBlurRadius: Math.min(numeric, 10),
      isSelfieMode,
    };
  }

  private async loadBackground(url?: string) {
    if (!url) return null;
    const result = await fetch(url);
    if (!result.ok) return null;

    return {
      type: 'image',
      media: await createImageBitmap(await result.blob()),
      url,
    };
  }

  protected onFlush(): void {
    this.destroySegmenter();
  }

  protected onStop(): void {
    this.webGlRenderer?.close();
    this.destroySegmenter();
  }

  private destroySegmenter() {
    this.segmenter?.close();
    this.segmenter = null;
    this.isSegmenterReady = false;
  }

  protected get processorName() {
    return 'background-processor';
  }
}
