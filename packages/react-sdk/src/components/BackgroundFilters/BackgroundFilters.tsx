import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import { useCall } from '@stream-io/video-react-bindings';
import { disposeOfMediaStream } from '@stream-io/video-client';
import {
  BackgroundBlurLevel,
  BackgroundFilter,
  createRenderer,
  isPlatformSupported,
  loadTFLite,
  TFLite,
} from '@stream-io/video-filters-web';

export type BackgroundFiltersProps = {
  /**
   * Enables or disables the background-blurring feature.
   * @default true.
   */
  isBlurringEnabled?: boolean;

  /**
   * A list of URLs to use as background images.
   */
  backgroundImages?: string[];

  /**
   * The background filter to apply to the video (by default).
   * @default 'none'.
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
   * @default 'https://unpkg.com/@stream-io/video-filters-web/tf'.
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
   * The path to the TensorFlow Lite model file.
   * Override this prop to use a custom path to the TensorFlow Lite model file
   * (e.g., if you choose to host it yourself).
   */
  modelFilePath?: string;
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
    isBlurringEnabled = true,
    backgroundImages = [],
    backgroundFilter: bgFilterFromProps = undefined,
    backgroundImage: bgImageFromProps = undefined,
    backgroundBlurLevel: bgBlurLevelFromProps = 'high',
    tfFilePath,
    modelFilePath,
    basePath,
  } = props;

  const [backgroundFilter, setBackgroundFilter] = useState(bgFilterFromProps);
  const [backgroundImage, setBackgroundImage] = useState(bgImageFromProps);
  const [backgroundBlurLevel, setBackgroundBlurLevel] =
    useState(bgBlurLevelFromProps);

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
    setBackgroundBlurLevel('high');
  }, []);

  const [isSupported, setIsSupported] = useState(false);
  useEffect(() => {
    isPlatformSupported().then(setIsSupported);
  }, []);

  const [tfLite, setTfLite] = useState<TFLite>();
  useEffect(() => {
    // don't try to load TFLite if the platform is not supported
    if (!isSupported) return;
    loadTFLite({ basePath, modelFilePath, tfFilePath })
      .then(setTfLite)
      .catch((err) => console.error('Failed to load TFLite', err));
  }, [basePath, isSupported, modelFilePath, tfFilePath]);

  return (
    <BackgroundFiltersContext.Provider
      value={{
        isSupported,
        isReady: !!tfLite,
        backgroundImage,
        backgroundBlurLevel,
        backgroundFilter,
        disableBackgroundFilter,
        applyBackgroundBlurFilter,
        applyBackgroundImageFilter,
        backgroundImages,
        isBlurringEnabled,
        tfFilePath,
        modelFilePath,
        basePath,
      }}
    >
      {children}
      {tfLite && backgroundFilter && <BackgroundFilters tfLite={tfLite} />}
    </BackgroundFiltersContext.Provider>
  );
};

const BackgroundFilters = (props: { tfLite: TFLite }) => {
  const { tfLite } = props;
  const call = useCall();
  const { backgroundImage, backgroundFilter } = useBackgroundFilters();
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [bgImageRef, setBgImageRef] = useState<HTMLImageElement | null>(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);

  // Holds a ref to the `resolve` function of the returned Promise as part
  // of the `camera.registerFilter()` API. Once the filter is initialized,
  // it should be called with the filtered MediaStream as an argument.
  const signalFilterReadyRef =
    useRef<(value: MediaStream | PromiseLike<MediaStream>) => void>();

  const [mediaStream, setMediaStream] = useState<MediaStream>();
  const unregister = useRef<Promise<void>>();
  useEffect(() => {
    if (!call || !backgroundFilter) return;
    const register = (unregister.current || Promise.resolve()).then(() =>
      call.camera.registerFilter(async (ms) => {
        return new Promise<MediaStream>((resolve) => {
          signalFilterReadyRef.current = resolve;
          setMediaStream(ms);
        });
      }),
    );

    return () => {
      unregister.current = register
        .then((unregisterFilter) => unregisterFilter())
        .then(() => (signalFilterReadyRef.current = undefined))
        .then(() => setMediaStream(undefined))
        .catch((err) => console.error('Failed to unregister filter', err));
    };
  }, [backgroundFilter, call]);

  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => {
    if (!mediaStream || !videoRef) return;
    const handleOnPlay = () => {
      const [track] = mediaStream.getVideoTracks();
      if (!track) return;
      const { width: w = 0, height: h = 0 } = track.getSettings();
      setWidth(w);
      setHeight(h);
      setIsPlaying(true);
    };
    videoRef.addEventListener('play', handleOnPlay);
    videoRef.srcObject = mediaStream;
    videoRef.play().catch((err) => {
      console.error('Failed to play video', err);
    });
    return () => {
      videoRef.removeEventListener('play', handleOnPlay);
      videoRef.srcObject = null;
      setIsPlaying(false);
    };
  }, [mediaStream, videoRef]);

  useEffect(() => {
    const resolveFilter = signalFilterReadyRef.current;
    if (!canvasRef || !resolveFilter) return;

    const filter = canvasRef.captureStream();
    resolveFilter(filter);
    return () => {
      disposeOfMediaStream(filter);
    };
  }, [canvasRef]);

  return (
    <div
      className="str-video__background-filters"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {mediaStream && isPlaying && (
        <RenderPipeline
          tfLite={tfLite}
          videoRef={videoRef}
          canvasRef={canvasRef}
          backgroundImageRef={bgImageRef}
        />
      )}
      <video
        className={clsx(
          'str-video__background-filters__video',
          height > width && 'str-video__background-filters__video--tall',
        )}
        ref={setVideoRef}
        autoPlay
        playsInline
        controls={false}
        width={width}
        height={height}
        muted
        loop
      />
      {backgroundImage && (
        <img
          className="str-video__background-filters__background-image"
          key={backgroundImage}
          alt="Background"
          ref={setBgImageRef}
          src={backgroundImage}
          width={width}
          height={height}
        />
      )}
      {isPlaying && (
        <canvas
          className="str-video__background-filters__target-canvas"
          width={width}
          height={height}
          ref={setCanvasRef}
        />
      )}
    </div>
  );
};

const RenderPipeline = (props: {
  tfLite: TFLite;
  videoRef: HTMLVideoElement | null;
  canvasRef: HTMLCanvasElement | null;
  backgroundImageRef: HTMLImageElement | null;
}) => {
  const { tfLite, videoRef, canvasRef, backgroundImageRef } = props;
  const { backgroundFilter, backgroundBlurLevel } = useBackgroundFilters();
  useEffect(() => {
    if (!videoRef || !canvasRef || !backgroundFilter) return;
    if (backgroundFilter === 'image' && !backgroundImageRef) return;

    const renderer = createRenderer(tfLite, videoRef, canvasRef, {
      backgroundFilter,
      backgroundImage: backgroundImageRef ?? undefined,
      backgroundBlurLevel,
    });
    return () => {
      renderer.dispose();
    };
  }, [
    backgroundBlurLevel,
    backgroundFilter,
    backgroundImageRef,
    canvasRef,
    tfLite,
    videoRef,
  ]);

  return null;
};
