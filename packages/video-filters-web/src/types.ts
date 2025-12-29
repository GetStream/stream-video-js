export type BackgroundSource = {
  type: string;
  media?: ImageBitmap | ReadableStream;
  url: string;
  video?: HTMLVideoElement;
  track?: MediaStreamTrack;
};
export type BackgroundFilter = 'blur' | 'image';
export type BackgroundBlurLevel = 'low' | 'medium' | 'high' | number;

export interface SegmenterOptions {
  backgroundSource?: BackgroundSource | null;
  bgBlur: number;
  bgBlurRadius: number;
  isSelfieMode: boolean;
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

export const BACKGROUND_BLUR_MAP: Record<
  BackgroundBlurLevel,
  { bgBlur: number; bgBlurRadius: number }
> = {
  low: {
    bgBlur: 5,
    bgBlurRadius: 3,
  },
  medium: {
    bgBlur: 15,
    bgBlurRadius: 4,
  },
  high: {
    bgBlur: 30,
    bgBlurRadius: 5,
  },
};
