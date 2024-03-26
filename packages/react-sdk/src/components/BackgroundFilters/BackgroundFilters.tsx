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
import {
  BackgroundBlurLevel,
  BackgroundConfig,
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
  backgroundFilter?: BackgroundConfig;

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

export type BackgroundFiltersContextValue = BackgroundFiltersProps &
  BackgroundFiltersAPI;

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
    backgroundFilter: bgFilterFromProps = 'none',
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
    setBackgroundFilter('none');
    setBackgroundImage(undefined);
    setBackgroundBlurLevel('high');
  }, []);

  const [isSupported, setIsSupported] = useState(false);
  useEffect(() => {
    isPlatformSupported().then(setIsSupported);
  }, []);

  const [tfLite, setTfLite] = useState<TFLite>();
  useEffect(() => {
    loadTFLite({ basePath, modelFilePath, tfFilePath })
      .then(setTfLite)
      .catch((err) => console.error('Failed to load TFLite', err));
  }, [basePath, modelFilePath, tfFilePath]);

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
      {tfLite && backgroundFilter !== 'none' && (
        <BackgroundFilters tfLite={tfLite} />
      )}
    </BackgroundFiltersContext.Provider>
  );
};

const BackgroundFilters = (props: { tfLite: TFLite }) => {
  const call = useCall();
  const { backgroundImage, backgroundFilter } = useBackgroundFilters();
  const { tfLite } = props;
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [bgImageRef, setBgImageRef] = useState<HTMLImageElement | null>(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);

  const resolveFilterRef =
    useRef<(value: MediaStream | PromiseLike<MediaStream>) => void>();

  const [mediaStream, setMediaStream] = useState<MediaStream>();
  const registerFilterRef = useRef(Promise.resolve(async () => {}));
  useEffect(() => {
    if (!call || backgroundFilter === 'none') return;
    registerFilterRef.current = registerFilterRef.current.then(() =>
      call.camera.registerFilter(async (ms) => {
        return new Promise<MediaStream>((resolve) => {
          setMediaStream(ms);
          resolveFilterRef.current = resolve;
        });
      }),
    );

    return () => {
      registerFilterRef.current
        .then((unregister) => unregister())
        .then(() => setMediaStream(undefined))
        .catch((err) => console.error('Failed to unregister filter', err));
    };
  }, [backgroundFilter, call]);

  useEffect(() => {
    if (!mediaStream || !videoRef || !canvasRef) return;

    const handleOnPlay = () => {
      const [track] = mediaStream.getVideoTracks();
      if (track) {
        const { width: w = 0, height: h = 0 } = track.getSettings();
        setWidth(w);
        setHeight(h);
      }

      const resolveFilter = resolveFilterRef.current;
      if (!resolveFilter) return;
      const filter = canvasRef.captureStream();
      resolveFilter(filter);
    };
    videoRef.addEventListener('play', handleOnPlay);

    videoRef.srcObject = mediaStream;
    videoRef.play().catch((err) => console.error('Failed to play video', err));
    return () => {
      videoRef.removeEventListener('play', handleOnPlay);
      videoRef.srcObject = null;
    };
  }, [canvasRef, mediaStream, videoRef]);

  return (
    <div
      className="str-video__background-filters"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {mediaStream && (
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
      <canvas
        className="str-video__background-filters__target-canvas"
        key={`key-${width}${height}`}
        width={width}
        height={height}
        ref={setCanvasRef}
      />
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
  const { backgroundFilter = 'none', backgroundBlurLevel } =
    useBackgroundFilters();

  useEffect(() => {
    if (!videoRef || !canvasRef) return;
    if (backgroundFilter === 'none') return;
    if (backgroundFilter === 'image' && !backgroundImageRef) return;

    const dispose = createRenderer(tfLite, videoRef, canvasRef, {
      backgroundConfig: backgroundFilter,
      backgroundImage: backgroundImageRef ?? undefined,
      backgroundBlurLevel,
    });
    return () => {
      dispose();
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
