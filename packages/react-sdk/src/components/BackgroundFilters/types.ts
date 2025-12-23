import type {
  BackgroundBlurLevel,
  BackgroundFilter,
  PlatformSupportFlags,
} from '@stream-io/video-filters-web';

/**
 * Configuration for performance metric thresholds.
 */
export type BackgroundFiltersPerformanceThresholds = {
  /**
   * The lower FPS threshold for triggering a performance warning.
   * When the EMA FPS falls below this value, a warning is shown.
   * @default 23
   */
  fpsWarningThresholdLower?: number;

  /**
   * The upper FPS threshold for clearing a performance warning.
   * When the EMA FPS rises above this value, the warning is cleared.
   * @default 25
   */
  fpsWarningThresholdUpper?: number;

  /**
   * The default FPS value used as the initial value for the EMA (Exponential Moving Average)
   * calculation and when stats are unavailable or when resetting the filter.
   * @default 30
   */
  defaultFps?: number;
};

export type BackgroundFiltersProps = PlatformSupportFlags & {
  /**
   * A list of URLs to use as background images.
   */
  backgroundImages?: string[];

  /**
   * The background filter to apply to the video (by default).
   * @default undefined no filter applied
   */
  backgroundFilter?: BackgroundFilter;

  /**
   * The URL of the image to use as the background (by default).
   */
  backgroundImage?: string;

  /**
   * The level of blur to apply to the background (by default).
   * @default 'high'.
   */
  backgroundBlurLevel?: BackgroundBlurLevel;

  /**
   * The base path for the TensorFlow Lite files.
   * @default 'https://unpkg.com/@stream-io/video-filters-web/mediapipe'.
   */
  basePath?: string;

  /**
   * The path to the TensorFlow Lite WebAssembly file.
   *
   * Override this prop to use a custom path to the TensorFlow Lite WebAssembly file
   * (e.g., if you choose to host it yourself).
   */
  tfFilePath?: string;

  /**
   * The path to the MediaPipe model file.
   * Override this prop to use a custom path to the MediaPipe model file
   * (e.g., if you choose to host it yourself).
   */
  modelFilePath?: string;

  /**
   * When true, the filter uses the legacy TensorFlow-based segmentation model.
   * When false, it uses the default MediaPipe Tasks Vision model.
   *
   * Only enable this if you need to mimic the behavior of older SDK versions.
   */
  useLegacyFilter?: boolean;

  /**
   * When a started filter encounters an error, this callback will be executed.
   * The default behavior (not overridable) is unregistering a failed filter.
   * Use this callback to display UI error message, disable the corresponding stream,
   * or to try registering the filter again.
   */
  onError?: (error: any) => void;

  /**
   * Configuration for performance metric thresholds.
   * Use this to customize when performance warnings are triggered.
   */
  performanceThresholds?: BackgroundFiltersPerformanceThresholds;
};

/**
 * Represents the possible reasons for background filter performance degradation.
 */
export type PerformanceDegradationReason = 'frame-drop' | 'cpu-throttling';

/**
 * Performance degradation information for background filters.
 *
 * Performance is calculated using an Exponential Moving Average (EMA) of FPS values
 * to smooth out quick spikes and provide stable performance warnings.
 */
export type BackgroundFiltersPerformance = {
  /**
   * Whether performance is currently degraded.
   */
  degraded: boolean;
  /**
   * Reasons for performance degradation.
   */
  reason?: Array<PerformanceDegradationReason>;
};

export type BackgroundFiltersAPI = {
  /**
   * Whether the current platform supports the background filters.
   */
  isSupported: boolean;

  /**
   * Indicates whether the background filters engine is loaded and ready.
   */
  isReady: boolean;

  /**
   * Indicates whether the background filter is currently being registered.
   */
  isLoading: boolean;

  /**
   * Performance information for background filters.
   */
  performance: BackgroundFiltersPerformance;

  /**
   * Disables all background filters applied to the video.
   */
  disableBackgroundFilter: () => void;

  /**
   * Applies a background blur filter to the video.
   *
   * @param blurLevel the level of blur to apply to the background.
   */
  applyBackgroundBlurFilter: (blurLevel: BackgroundBlurLevel) => void;

  /**
   * Applies a background image filter to the video.
   *
   * @param imageUrl the URL of the image to use as the background.
   */
  applyBackgroundImageFilter: (imageUrl: string) => void;
};

/**
 * The context value for the background filters context.
 */
export type BackgroundFiltersContextValue = BackgroundFiltersProps &
  BackgroundFiltersAPI;
