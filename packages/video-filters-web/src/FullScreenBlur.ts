import { VideoTrackProcessorHooks } from './types';
import { BaseVideoProcessor } from './BaseVideoProcessor';
import { FullScreenBlurRenderer } from './FullScreenBlurRenderer';

export interface FullScreenBlurOptions {
  blurRadius?: number;
}

/**
 * A video filter that applies a full-screen blur to each frame.
 *
 * It uses a WebGL renderer to blur the incoming camera track and outputs
 * a new track with the effect applied. Setup and frame handling are managed
 * by the base processor.
 */
export class FullScreenBlur extends BaseVideoProcessor {
  private blurRenderer!: FullScreenBlurRenderer;
  private readonly blurRadius: number;

  /**
   * Creates a new full-screen blur processor for the given video track.
   *
   * @param track - The input camera track to blur.
   * @param options - Optional settings such as the blur radius.
   * @param hooks - Optional callbacks for stats and error reporting.
   */
  constructor(
    track: MediaStreamVideoTrack,
    options: FullScreenBlurOptions = {},
    hooks: VideoTrackProcessorHooks = {},
  ) {
    super(track, hooks);
    this.blurRadius = options.blurRadius ?? 6;
  }

  protected async initialize(): Promise<void> {
    this.blurRenderer = new FullScreenBlurRenderer(this.canvas);
  }

  protected async transform(frame: VideoFrame): Promise<VideoFrame> {
    this.blurRenderer.render(frame, this.blurRadius);
    return new VideoFrame(this.canvas, { timestamp: frame.timestamp });
  }

  protected onStop(): void {
    this.blurRenderer?.close();
  }

  protected get processorName(): string {
    return 'fullscreen-blur';
  }
}
