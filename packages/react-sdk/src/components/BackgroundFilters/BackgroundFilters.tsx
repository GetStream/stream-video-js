import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { Call, disposeOfMediaStream } from '@stream-io/video-client';
import {
  BackgroundBlurLevel,
  BackgroundFilter,
  createRenderer,
  isPlatformSupported,
  isMediaPipePlatformSupported,
  loadTFLite,
  loadMediaPipe,
  PlatformSupportFlags,
  VirtualBackground,
  Renderer,
  TFLite,
  PerformanceStats,
} from '@stream-io/video-filters-web';
import clsx from 'clsx';

/**
 * Constants for FPS warning calculation.
 * Smooths out quick spikes using an EMA, ignores brief outliers,
 * and uses two thresholds to avoid flickering near the limit.
 */
const ALPHA = 0.2;
const FPS_WARNING_THRESHOLD_LOWER = 23;
const FPS_WARNING_THRESHOLD_UPPER = 25;
const DEFAULT_FPS = 30;
const DEVIATION_LIMIT = 0.5;
const OUTLIER_PERSISTENCE = 5;

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

/**
 * Represents the available background filter processing engines.
 */
enum FilterEngine {
  TF,
  MEDIA_PIPE,
  NONE,
}

/**
 * Represents the possible reasons for background filter performance degradation.
 */
export enum PerformanceDegradationReason {
  FRAME_DROP = 'frame-drop',
  CPU_THROTTLING = 'cpu-throttling',
}

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

/**
 * The context for the background filters.
 */
const BackgroundFiltersContext = createContext<
  BackgroundFiltersContextValue | undefined
>(undefined);

/**
 * A hook to access the background filters context API.
 */
export const useBackgroundFilters = () => {
  const context = useContext(BackgroundFiltersContext);
  if (!context) {
    throw new Error(
      'useBackgroundFilters must be used within a BackgroundFiltersProvider',
    );
  }
  return context;
};

/**
 * Determines which filter engine is available.
 * MEDIA_PIPE is the default unless legacy filters are requested or MediaPipe is unsupported.
 *
 * Returns NONE if neither is supported.
 */
const determineEngine = async (
  useLegacyFilter: boolean | undefined,
  forceSafariSupport: boolean | undefined,
  forceMobileSupport: boolean | undefined,
): Promise<FilterEngine> => {
  const isTfPlatformSupported = await isPlatformSupported({
    forceSafariSupport,
    forceMobileSupport,
  });

  if (useLegacyFilter) {
    return isTfPlatformSupported ? FilterEngine.TF : FilterEngine.NONE;
  }

  const isMediaPipeSupported = await isMediaPipePlatformSupported({
    forceSafariSupport,
    forceMobileSupport,
  });

  return isMediaPipeSupported ? FilterEngine.MEDIA_PIPE : FilterEngine.NONE;
};

/**
 * A provider component that enables the use of background filters in your app.
 *
 * Please make sure you have the `@stream-io/video-filters-web` package installed
 * in your project before using this component.
 */
export const BackgroundFiltersProvider = (
  props: PropsWithChildren<BackgroundFiltersProps>,
) => {
  const {
    children,
    backgroundImages = [],
    backgroundFilter: bgFilterFromProps = undefined,
    backgroundImage: bgImageFromProps = undefined,
    backgroundBlurLevel: bgBlurLevelFromProps = undefined,
    tfFilePath,
    modelFilePath,
    useLegacyFilter,
    basePath,
    onError,
    performanceThresholds,
    forceSafariSupport,
    forceMobileSupport,
  } = props;

  const call = useCall();
  const { useCallStatsReport } = useCallStateHooks();
  const callStatsReport = useCallStatsReport();

  const [backgroundFilter, setBackgroundFilter] = useState(bgFilterFromProps);
  const [backgroundImage, setBackgroundImage] = useState(bgImageFromProps);
  const [backgroundBlurLevel, setBackgroundBlurLevel] =
    useState(bgBlurLevelFromProps);

  const [showLowFpsWarning, setShowLowFpsWarning] = useState<boolean>(false);

  const fpsWarningThresholdLower =
    performanceThresholds?.fpsWarningThresholdLower ??
    FPS_WARNING_THRESHOLD_LOWER;
  const fpsWarningThresholdUpper =
    performanceThresholds?.fpsWarningThresholdUpper ??
    FPS_WARNING_THRESHOLD_UPPER;
  const defaultFps = performanceThresholds?.defaultFps ?? DEFAULT_FPS;

  const emaRef = useRef<number>(defaultFps);
  const outlierStreakRef = useRef<number>(0);

  const handleStats = useCallback(
    (stats: PerformanceStats) => {
      const fps = stats?.fps;
      if (fps === undefined || fps === null) {
        emaRef.current = defaultFps;
        outlierStreakRef.current = 0;
        setShowLowFpsWarning(false);
        return;
      }

      const prevEma = emaRef.current;
      const deviation = Math.abs(fps - prevEma) / prevEma;

      const isOutlier = fps < prevEma && deviation > DEVIATION_LIMIT;
      outlierStreakRef.current = isOutlier ? outlierStreakRef.current + 1 : 0;
      if (isOutlier && outlierStreakRef.current < OUTLIER_PERSISTENCE) return;

      emaRef.current = ALPHA * fps + (1 - ALPHA) * prevEma;

      setShowLowFpsWarning((prev) => {
        if (prev && emaRef.current > fpsWarningThresholdUpper) return false;
        if (!prev && emaRef.current < fpsWarningThresholdLower) return true;

        return prev;
      });
    },
    [fpsWarningThresholdLower, fpsWarningThresholdUpper, defaultFps],
  );

  const performance: BackgroundFiltersPerformance = useMemo(() => {
    if (!backgroundFilter) {
      return { degraded: false };
    }

    const reasons: Array<PerformanceDegradationReason> = [];

    if (showLowFpsWarning) {
      reasons.push(PerformanceDegradationReason.FRAME_DROP);
    }

    const qualityLimitationReasons =
      callStatsReport?.publisherStats?.qualityLimitationReasons;

    if (
      showLowFpsWarning &&
      qualityLimitationReasons &&
      qualityLimitationReasons?.includes('cpu')
    ) {
      reasons.push(PerformanceDegradationReason.CPU_THROTTLING);
    }

    return {
      degraded: reasons.length > 0,
      reason: reasons.length > 0 ? reasons : undefined,
    };
  }, [
    showLowFpsWarning,
    callStatsReport?.publisherStats?.qualityLimitationReasons,
    backgroundFilter,
  ]);

  const prevDegradedRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    const currentDegraded = performance.degraded;
    const prevDegraded = prevDegradedRef.current;

    if (
      !!backgroundFilter &&
      prevDegraded !== undefined &&
      prevDegraded !== currentDegraded
    ) {
      call?.tracer.trace('backgroundFilters.performance', {
        degraded: currentDegraded,
        reason: performance?.reason,
        fps: emaRef.current,
      });
    }
    prevDegradedRef.current = currentDegraded;
  }, [
    performanceThresholds,
    performance.degraded,
    performance.reason,
    backgroundFilter,
    call?.tracer,
  ]);

  const applyBackgroundImageFilter = useCallback((imageUrl: string) => {
    setBackgroundFilter('image');
    setBackgroundImage(imageUrl);
  }, []);

  const applyBackgroundBlurFilter = useCallback(
    (blurLevel: BackgroundBlurLevel = 'high') => {
      setBackgroundFilter('blur');
      setBackgroundBlurLevel(blurLevel);
    },
    [],
  );

  const disableBackgroundFilter = useCallback(() => {
    setBackgroundFilter(undefined);
    setBackgroundImage(undefined);
    setBackgroundBlurLevel(undefined);

    emaRef.current = defaultFps;
    outlierStreakRef.current = 0;
    setShowLowFpsWarning(false);
  }, [defaultFps]);

  const [engine, setEngine] = useState<FilterEngine>(FilterEngine.NONE);
  const [isSupported, setIsSupported] = useState(false);
  useEffect(() => {
    determineEngine(
      useLegacyFilter,
      forceSafariSupport,
      forceMobileSupport,
    ).then((determinedEngine) => {
      setEngine(determinedEngine);
      setIsSupported(determinedEngine !== FilterEngine.NONE);
    });
  }, [forceMobileSupport, forceSafariSupport, useLegacyFilter]);

  const [tfLite, setTfLite] = useState<TFLite>();
  useEffect(() => {
    if (engine !== FilterEngine.TF) return;

    loadTFLite({ basePath, modelFilePath, tfFilePath })
      .then(setTfLite)
      .catch((err) => console.error('Failed to load TFLite', err));
  }, [basePath, engine, modelFilePath, tfFilePath]);

  const [mediaPipe, setMediaPipe] = useState<ArrayBuffer>();
  useEffect(() => {
    if (engine !== FilterEngine.MEDIA_PIPE) return;

    loadMediaPipe({
      basePath: basePath,
      modelPath: modelFilePath,
    })
      .then(setMediaPipe)
      .catch((err) => console.error('Failed to preload MediaPipe', err));
  }, [engine, modelFilePath, basePath]);

  const handleError = useCallback(
    (error: any) => {
      console.warn(
        '[filters] Filter encountered an error and will be disabled',
      );
      disableBackgroundFilter();
      onError?.(error);
    },
    [disableBackgroundFilter, onError],
  );

  const isReady = useLegacyFilter ? !!tfLite : !!mediaPipe;
  return (
    <BackgroundFiltersContext.Provider
      value={{
        isSupported,
        performance,
        isReady,
        backgroundImage,
        backgroundBlurLevel,
        backgroundFilter,
        disableBackgroundFilter,
        applyBackgroundBlurFilter,
        applyBackgroundImageFilter,
        backgroundImages,
        tfFilePath,
        modelFilePath,
        basePath,
        onError: handleError,
      }}
    >
      {children}
      {isReady && (
        <BackgroundFilters
          tfLite={tfLite}
          engine={engine}
          onStats={handleStats}
        />
      )}
    </BackgroundFiltersContext.Provider>
  );
};

const BackgroundFilters = (props: {
  tfLite?: TFLite;
  engine: FilterEngine;
  onStats: (stats: PerformanceStats) => void;
}) => {
  const call = useCall();
  const { children, start } = useRenderer(props.tfLite, call, props.engine);
  const { onError, backgroundFilter } = useBackgroundFilters();
  const handleErrorRef = useRef<((error: any) => void) | undefined>(undefined);
  handleErrorRef.current = onError;

  const handleStatsRef = useRef<
    ((stats: PerformanceStats) => void) | undefined
  >(undefined);
  handleStatsRef.current = props.onStats;

  useEffect(() => {
    if (!call || !backgroundFilter) return;

    const { unregister } = call.camera.registerFilter((ms) => {
      return start(
        ms,
        (error) => handleErrorRef.current?.(error),
        (stats: PerformanceStats) => handleStatsRef.current?.(stats),
      );
    });
    return () => {
      unregister().catch((err) => console.warn(`Can't unregister filter`, err));
    };
  }, [call, start, backgroundFilter]);

  return children;
};

const useRenderer = (
  tfLite: TFLite | undefined,
  call: Call | undefined,
  engine: FilterEngine,
) => {
  const {
    backgroundFilter,
    backgroundBlurLevel,
    backgroundImage,
    modelFilePath,
    basePath,
  } = useBackgroundFilters();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement>(null);
  const [videoSize, setVideoSize] = useState<{ width: number; height: number }>(
    {
      width: 1920,
      height: 1080,
    },
  );

  const start = useCallback(
    (
      ms: MediaStream,
      onError?: (error: any) => void,
      onStats?: (stats: PerformanceStats) => void,
    ) => {
      let outputStream: MediaStream | undefined;
      let processor: VirtualBackground | undefined;
      let renderer: Renderer | undefined;

      const output = new Promise<MediaStream>((resolve, reject) => {
        if (!backgroundFilter) {
          reject(new Error('No filter specified'));
          return;
        }

        const videoEl = videoRef.current;
        const canvasEl = canvasRef.current;
        const bgImageEl = bgImageRef.current;

        const [track] = ms.getVideoTracks();

        if (!track) {
          reject(new Error('No video tracks in input media stream'));
          return;
        }

        if (engine === FilterEngine.MEDIA_PIPE) {
          call?.tracer.trace('backgroundFilters.enable', {
            backgroundFilter,
            backgroundBlurLevel,
            backgroundImage,
            engine,
          });

          if (!videoEl) {
            reject(new Error('Renderer started before elements are ready'));
            return;
          }

          const trackSettings = track.getSettings();
          flushSync(() =>
            setVideoSize({
              width: trackSettings.width ?? 0,
              height: trackSettings.height ?? 0,
            }),
          );

          processor = new VirtualBackground(
            track,
            {
              basePath: basePath,
              modelPath: modelFilePath,
              backgroundBlurLevel,
              backgroundImage,
              backgroundFilter,
            },
            { onError, onStats },
          );
          processor
            .start()
            .then((processedTrack) => {
              outputStream = new MediaStream([processedTrack]);
              resolve(outputStream);
            })
            .catch((error) => {
              reject(error);
            });

          return;
        }

        if (engine === FilterEngine.TF) {
          if (!videoEl || !canvasEl || (backgroundImage && !bgImageEl)) {
            reject(new Error('Renderer started before elements are ready'));
            return;
          }

          videoEl.srcObject = ms;
          videoEl.play().then(
            () => {
              const trackSettings = track.getSettings();
              flushSync(() =>
                setVideoSize({
                  width: trackSettings.width ?? 0,
                  height: trackSettings.height ?? 0,
                }),
              );
              call?.tracer.trace('backgroundFilters.enable', {
                backgroundFilter,
                backgroundBlurLevel,
                backgroundImage,
                engine,
              });

              if (!tfLite) {
                reject(new Error('TensorFlow Lite not loaded'));
                return;
              }

              renderer = createRenderer(
                tfLite,
                videoEl,
                canvasEl,
                {
                  backgroundFilter,
                  backgroundBlurLevel,
                  backgroundImage: bgImageEl ?? undefined,
                },
                onError,
              );
              outputStream = canvasEl.captureStream();

              resolve(outputStream);
            },
            () => {
              reject(new Error('Could not play the source video stream'));
            },
          );
          return;
        }

        reject(new Error('No supported engine available'));
      });

      return {
        output,
        stop: () => {
          call?.tracer.trace('backgroundFilters.disable', null);
          processor?.stop();
          renderer?.dispose();
          if (videoRef.current) videoRef.current.srcObject = null;
          if (outputStream) disposeOfMediaStream(outputStream);
        },
      };
    },
    [
      backgroundBlurLevel,
      backgroundFilter,
      backgroundImage,
      call?.tracer,
      tfLite,
      engine,
      modelFilePath,
      basePath,
    ],
  );

  const children = (
    <div className="str-video__background-filters">
      <video
        className={clsx(
          'str-video__background-filters__video',
          videoSize.height > videoSize.width &&
            'str-video__background-filters__video--tall',
        )}
        ref={videoRef}
        playsInline
        muted
        controls={false}
        {...videoSize}
      />
      {backgroundImage && (
        <img
          className="str-video__background-filters__background-image"
          alt="Background"
          ref={bgImageRef}
          crossOrigin="anonymous"
          src={backgroundImage}
          {...videoSize}
        />
      )}
      <canvas
        className="str-video__background-filters__target-canvas"
        {...videoSize}
        ref={canvasRef}
      />
    </div>
  );

  return { start, children };
};
