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
}
/**
 * Static configuration for the processor, defining which background
 * effect should be applied and how it should behave.
 */
export interface BackgroundOptions {
  modelPath?: string;
  backgroundFilter?: BackgroundFilter;
  backgroundBlurLevel?: BackgroundBlurLevel;
  backgroundImage?: string | undefined;
}

/**
 * Runtime hooks for handling lifecycle or error events.
 */
export interface VideoTrackProcessorHooks {
  onError?: (error: unknown) => void;
}

export const BACKGROUND_BLUR_MAP: Record<
  BackgroundBlurLevel,
  { bgBlur: number; bgBlurRadius: number }
> = {
  low: {
    bgBlur: 15,
    bgBlurRadius: 5,
  },
  medium: {
    bgBlur: 20,
    bgBlurRadius: 7,
  },
  high: {
    bgBlur: 25,
    bgBlurRadius: 10,
  },
};
