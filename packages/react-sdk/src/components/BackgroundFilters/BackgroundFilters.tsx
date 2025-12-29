import {
  Context,
  PropsWithChildren,
  useCallback,
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
  createRenderer,
  isMediaPipePlatformSupported,
  isPlatformSupported,
  loadMediaPipe,
  loadTFLite,
  PerformanceStats,
  Renderer,
  TFLite,
  VirtualBackground,
} from '@stream-io/video-filters-web';
import clsx from 'clsx';
import type {
  BackgroundFiltersPerformance,
  BackgroundFiltersProps,
  BackgroundFiltersContextValue,
  PerformanceDegradationReason,
} from './types';

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
 * Represents the available background filter processing engines.
 */
enum FilterEngine {
  TF,
  MEDIA_PIPE,
  NONE,
}

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
  if (useLegacyFilter) {
    const isTfPlatformSupported = await isPlatformSupported({
      forceSafariSupport,
      forceMobileSupport,
    });
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
  props: PropsWithChildren<BackgroundFiltersProps> & {
    // for code splitting. Prevents circular dependency issues where
    // this Context needs to be present in the main chunk, but also
    // imported by the background filters chunk.
    ContextProvider: Context<BackgroundFiltersContextValue | undefined>;
  },
) => {
  const {
    ContextProvider,
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
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
      reasons.push('frame-drop');
    }

    const qualityLimitationReasons =
      callStatsReport?.publisherStats?.qualityLimitationReasons;

    if (
      showLowFpsWarning &&
      qualityLimitationReasons &&
      qualityLimitationReasons?.includes('cpu')
    ) {
      reasons.push('cpu-throttling');
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
  const contextValue: BackgroundFiltersContextValue = {
    isSupported,
    performance,
    isReady,
    isLoading,
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
  };
  return (
    <ContextProvider.Provider value={contextValue}>
      {children}
      {isReady && (
        <BackgroundFilters
          api={contextValue}
          tfLite={tfLite}
          engine={engine}
          onStats={handleStats}
          setIsLoading={setIsLoading}
        />
      )}
    </ContextProvider.Provider>
  );
};

const BackgroundFilters = (props: {
  api: BackgroundFiltersContextValue;
  tfLite?: TFLite;
  engine: FilterEngine;
  onStats: (stats: PerformanceStats) => void;
  setIsLoading: (loading: boolean) => void;
}) => {
  const call = useCall();
  const { engine, api, tfLite, onStats, setIsLoading } = props;
  const { children, start } = useRenderer(api, tfLite, call, engine);
  const { onError, backgroundFilter } = api;
  const handleErrorRef = useRef<((error: any) => void) | undefined>(undefined);
  handleErrorRef.current = onError;

  const handleStatsRef = useRef<
    ((stats: PerformanceStats) => void) | undefined
  >(undefined);
  handleStatsRef.current = onStats;

  useEffect(() => {
    if (!call || !backgroundFilter) return;

    setIsLoading(true);
    const { unregister, registered } = call.camera.registerFilter((ms) => {
      return start(
        ms,
        (error) => handleErrorRef.current?.(error),
        (stats: PerformanceStats) => handleStatsRef.current?.(stats),
      );
    });
    registered.finally(() => {
      setIsLoading(false);
    });

    return () => {
      unregister().catch((err) => console.warn(`Can't unregister filter`, err));
    };
  }, [call, start, backgroundFilter, setIsLoading]);

  return children;
};

const useRenderer = (
  api: BackgroundFiltersContextValue,
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
  } = api;

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
