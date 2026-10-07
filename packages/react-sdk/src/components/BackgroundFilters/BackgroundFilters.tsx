import {
  Context,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { Call, disposeOfMediaStream } from '@stream-io/video-client';
import {
  BackgroundBlurLevel,
  BackgroundEffectOptions,
  isMediaPipePlatformSupported,
  loadMediaPipe,
  PerformanceStats,
  VirtualBackground,
} from '@stream-io/video-filters-web';
import type {
  BackgroundFiltersPerformance,
  BackgroundFiltersProps,
  BackgroundFiltersContextValue,
  PerformanceDegradationReason,
} from './types';

type MediaStreamTrackVideoStats = {
  deliveredFrames: number;
  discardedFrames: number;
  totalFrames: number;
};

type MediaStreamTrackWithStats = MediaStreamTrack & {
  stats?: MediaStreamTrackVideoStats;
};

/**
 * Constants for FPS warning calculation.
 * Smooths the processed-to-source FPS ratio and uses hysteresis
 * so the degradation warning doesn't flicker near the limit.
 */
const ALPHA = 0.2;
const FPS_RATIO_WARNING_THRESHOLD_LOWER = 0.75;
const FPS_RATIO_WARNING_THRESHOLD_UPPER = 0.85;

const EMPTY_BACKGROUND_IMAGES: string[] = [];

/**
 * Represents the available background filter processing engines.
 */
enum FilterEngine {
  // values are reported in the `backgroundFilters.enable` trace, keep them stable
  MEDIA_PIPE = 1,
  NONE = 2,
}

/**
 * Determines whether the MediaPipe filter engine is available.
 *
 * Returns NONE if it isn't supported.
 */
const determineEngine = async (
  forceSafariSupport: boolean | undefined,
  forceMobileSupport: boolean | undefined,
): Promise<FilterEngine> => {
  const isMediaPipeSupported = await isMediaPipePlatformSupported({
    forceSafariSupport,
    forceMobileSupport,
  });

  return isMediaPipeSupported ? FilterEngine.MEDIA_PIPE : FilterEngine.NONE;
};

/**
 * Samples the raw camera track's frame stats (W3C MediaCapture Extensions) at a
 * fixed interval and returns a live source fps estimate. Returns `undefined`
 * while warming up, when the camera is off, or when the browser doesn't expose
 * `MediaStreamTrack.stats` (currently Chromium-only).
 */
const useTrackFramesPerSecond = (call: Call | undefined) => {
  const { useCameraState } = useCallStateHooks();
  const { rootMediaStream } = useCameraState();
  const [fps, setFps] = useState<number | undefined>(undefined);
  const trackId = rootMediaStream?.getVideoTracks()[0]?.id;

  useEffect(() => {
    if (!call) {
      setFps(undefined);
      return;
    }

    let previousSnapshot:
      (MediaStreamTrackVideoStats & { capturedAt: number }) | undefined;
    let previousTrackId: string | undefined;

    const intervalId = setInterval(() => {
      const track = rootMediaStream?.getVideoTracks()[0] as
        MediaStreamTrackWithStats | undefined;

      const stats = track?.stats;
      if (!track || !stats) {
        previousSnapshot = undefined;
        setFps(undefined);
        return;
      }

      if (track.id !== previousTrackId) {
        previousTrackId = track.id;
        previousSnapshot = undefined;
        setFps(undefined);
      }

      const currentSnapshot = {
        deliveredFrames: stats.deliveredFrames,
        discardedFrames: stats.discardedFrames,
        totalFrames: stats.totalFrames,
        capturedAt: performance.now(),
      };

      if (previousSnapshot) {
        const elapsedSec =
          (currentSnapshot.capturedAt - previousSnapshot.capturedAt) / 1000;

        const delivered =
          currentSnapshot.deliveredFrames - previousSnapshot.deliveredFrames;

        const nextFps = Math.round(delivered / elapsedSec);
        setFps(nextFps);
      }
      previousSnapshot = currentSnapshot;
    }, 1000);

    return () => {
      clearInterval(intervalId);
      setFps(undefined);
    };
  }, [call, rootMediaStream, trackId]);

  return fps;
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
    backgroundImages = EMPTY_BACKGROUND_IMAGES,
    backgroundFilter: bgFilterFromProps = undefined,
    backgroundImage: bgImageFromProps = undefined,
    backgroundBlurLevel: bgBlurLevelFromProps = undefined,
    modelFilePath,
    basePath,
    onError,
    forceSafariSupport,
    forceMobileSupport,
    segmentationOptions,
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

  const rootFps = useTrackFramesPerSecond(call);
  const cameraFrameRate = callStatsReport?.publisherStats?.camera?.frameRate;

  const sourceFps = rootFps ?? cameraFrameRate;
  const fpsRatioEmaRef = useRef<number | undefined>(undefined);

  const handleStats = useCallback(
    (stats: PerformanceStats) => {
      const fps = stats?.fps;
      if (fps == null || !sourceFps) {
        fpsRatioEmaRef.current = undefined;
        setShowLowFpsWarning(false);
        return;
      }

      const ratio = fps / sourceFps;
      const prevRatioEma = fpsRatioEmaRef.current ?? ratio;

      const nextFpsRatioEma = ALPHA * ratio + (1 - ALPHA) * prevRatioEma;
      fpsRatioEmaRef.current = nextFpsRatioEma;

      setShowLowFpsWarning((prev) => {
        if (prev && nextFpsRatioEma > FPS_RATIO_WARNING_THRESHOLD_UPPER)
          return false;
        if (!prev && nextFpsRatioEma < FPS_RATIO_WARNING_THRESHOLD_LOWER)
          return true;

        return prev;
      });
    },
    [sourceFps],
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
        ratio: fpsRatioEmaRef.current,
        sourceFps,
      });
    }
    prevDegradedRef.current = currentDegraded;
  }, [
    performance.degraded,
    performance.reason,
    backgroundFilter,
    call?.tracer,
    sourceFps,
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

    fpsRatioEmaRef.current = undefined;
    setShowLowFpsWarning(false);
  }, []);

  const [engine, setEngine] = useState<FilterEngine>(FilterEngine.NONE);
  const [isSupported, setIsSupported] = useState(false);
  useEffect(() => {
    determineEngine(forceSafariSupport, forceMobileSupport).then(
      (determinedEngine) => {
        setEngine(determinedEngine);
        setIsSupported(determinedEngine !== FilterEngine.NONE);
      },
    );
  }, [forceMobileSupport, forceSafariSupport]);

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

  const isReady = !!mediaPipe;

  const contextValue = useMemo<BackgroundFiltersContextValue>(
    () => ({
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
      modelFilePath,
      basePath,
      onError: handleError,
      segmentationOptions,
    }),
    [
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
      modelFilePath,
      basePath,
      handleError,
      segmentationOptions,
    ],
  );
  return (
    <ContextProvider.Provider value={contextValue}>
      {children}
      {isReady && (
        <BackgroundFilters
          api={contextValue}
          onStats={handleStats}
          setIsLoading={setIsLoading}
        />
      )}
    </ContextProvider.Provider>
  );
};

const BackgroundFilters = (props: {
  api: BackgroundFiltersContextValue;
  onStats: (stats: PerformanceStats) => void;
  setIsLoading: (loading: boolean) => void;
}) => {
  const call = useCall();
  const { api, onStats, setIsLoading } = props;
  const start = useRenderer(api, call);
  const { onError, backgroundFilter } = api;
  const handleErrorRef = useRef<((error: any) => void) | undefined>(undefined);
  handleErrorRef.current = onError;

  const handleStatsRef = useRef<
    ((stats: PerformanceStats) => void) | undefined
  >(undefined);
  handleStatsRef.current = onStats;

  const filterActive = !!backgroundFilter;

  useEffect(() => {
    if (!call || !filterActive) return;

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
  }, [call, start, filterActive, setIsLoading]);

  return null;
};

const useRenderer = (
  api: BackgroundFiltersContextValue,
  call: Call | undefined,
) => {
  const {
    backgroundFilter,
    backgroundBlurLevel,
    backgroundImage,
    modelFilePath,
    basePath,
    segmentationOptions,
  } = api;

  const optionsRef = useRef<BackgroundEffectOptions>({});
  optionsRef.current = {
    backgroundFilter,
    backgroundBlurLevel,
    backgroundImage,
    segmentationOptions,
  };

  const processorRef = useRef<VirtualBackground | undefined>(undefined);

  const start = useCallback(
    (
      ms: MediaStream,
      onError?: (error: any) => void,
      onStats?: (stats: PerformanceStats) => void,
    ) => {
      let outputStream: MediaStream | undefined;
      let processor: VirtualBackground | undefined;

      const output = new Promise<MediaStream>((resolve, reject) => {
        const options = optionsRef.current;
        if (!options.backgroundFilter) {
          reject(new Error('No filter specified'));
          return;
        }

        const [track] = ms.getVideoTracks();
        if (!track) {
          reject(new Error('No video tracks in input media stream'));
          return;
        }

        call?.tracer.trace('backgroundFilters.enable', {
          ...options,
          engine: FilterEngine.MEDIA_PIPE,
          modelFilePath,
        });

        processor = new VirtualBackground(
          track,
          { ...options, basePath, modelPath: modelFilePath },
          { onError, onStats },
        );
        processorRef.current = processor;
        processor
          .start()
          .then((processedTrack) => {
            outputStream = new MediaStream([processedTrack]);
            resolve(outputStream);
          })
          .catch(reject);
      });

      return {
        output,
        stop: () => {
          call?.tracer.trace('backgroundFilters.disable', null);
          processorRef.current = undefined;
          processor?.stop();
          if (outputStream) disposeOfMediaStream(outputStream);
        },
      };
    },
    [call?.tracer, modelFilePath, basePath],
  );

  useEffect(() => {
    if (!backgroundFilter) return;

    processorRef.current
      ?.updateOptions({
        backgroundFilter,
        backgroundBlurLevel,
        backgroundImage,
        segmentationOptions,
      })
      .catch((err) =>
        console.warn(`[filters] Can't apply the background options`, err),
      );
  }, [
    backgroundFilter,
    backgroundBlurLevel,
    backgroundImage,
    segmentationOptions,
  ]);

  return start;
};
