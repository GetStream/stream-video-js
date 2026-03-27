export type BackgroundSource = {
  type: string;
  media?: ImageBitmap | ReadableStream;
  url: string;
  video?: HTMLVideoElement;
  track?: MediaStreamTrack;
};
export type BackgroundFilter = 'blur' | 'image';
export type BackgroundBlurLevel = 'low' | 'medium' | 'high' | number;

/**
 * Options for controlling the segmentation mask smoothing.
 * These values are passed to the WebGL shader that blends
 * consecutive segmentation masks over time.
 */
export interface SegmentationOptions {
  /**
   * Controls how fast the mask adapts to new segmentation results.
   * Higher values make the mask react faster but may cause flickering.
   * Lower values produce smoother transitions but increase latency.
   * Value should be between 0 and 1.
   * @default 0.8
   */
  smoothingFactor?: number;

  /**
   * Lower edge of the smoothstep function applied to the confidence mask.
   * Confidence values below this are mapped to 0 (background).
   * Value should be between 0 and 1, and less than smoothstepMax.
   * @default 0.6
   */
  smoothstepMin?: number;

  /**
   * Upper edge of the smoothstep function applied to the confidence mask.
   * Confidence values above this are mapped to 1 (foreground).
   * Value should be between 0 and 1, and greater than smoothstepMin.
   * @default 0.9
   */
  smoothstepMax?: number;
}

export interface SegmenterOptions {
  backgroundSource?: BackgroundSource | null;
  bgBlur: number;
  bgBlurRadius: number;
  isSelfieMode: boolean;
  segmentationOptions?: SegmentationOptions;
}
/**
 * Static configuration for the processor, defining which background
 * effect should be applied and how it should behave.
 */
export interface BackgroundOptions {
  basePath?: string;
  modelPath?: string;
  backgroundFilter?: BackgroundFilter;
  backgroundBlurLevel?: BackgroundBlurLevel;
  backgroundImage?: string | undefined;
  segmentationOptions?: SegmentationOptions;
}

/**
 * Performance statistics for video processing.
 */
export interface PerformanceStats {
  delay: number;
  fps: number;
  timestamp: number;
}

/**
 * Runtime hooks for handling lifecycle or error events.
 */
export interface VideoTrackProcessorHooks {
  onError?: (error: unknown) => void;
  onStats?: (stats: PerformanceStats) => void;
}

/**
 * Maps blur level to blur strength values.
 */
export const BACKGROUND_BLUR_MAP: Record<'low' | 'medium' | 'high', number> = {
  low: 3,
  medium: 5,
  high: 7,
};
