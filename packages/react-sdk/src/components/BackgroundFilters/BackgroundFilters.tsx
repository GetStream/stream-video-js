import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import clsx from 'clsx';
import { useCall } from '@stream-io/video-react-bindings';
import { disposeOfMediaStream, getLogger } from '@stream-io/video-client';
import {
  BackgroundBlurLevel,
  BackgroundFilter,
  createRenderer,
  isPlatformSupported,
  loadTFLite,
  Renderer,
  TFLite,
} from '@stream-io/video-filters-web';

export type BackgroundFiltersProps = {
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

  /**
   * When a started filter encounters an error, this callback will be executed.
   * The default behavior (not overridable) is unregistering a failed filter.
   * Use this callback to display UI error message, disable the corresponsing stream,
   * or to try registering the filter again.
   */
  onError?: (error: any) => void;
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
    backgroundImages = [],
    backgroundFilter: bgFilterFromProps = undefined,
    backgroundImage: bgImageFromProps = undefined,
    backgroundBlurLevel: bgBlurLevelFromProps = 'high',
    tfFilePath,
    modelFilePath,
    basePath,
    onError,
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

  const handleError = useCallback(
    (error: any) => {
      getLogger(['filters'])(
        'warn',
        'Filter encountered an error and will be disabled',
      );
      disableBackgroundFilter();
      onError?.(error);
    },
    [disableBackgroundFilter, onError],
  );

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
        tfFilePath,
        modelFilePath,
        basePath,
        onError: handleError,
      }}
    >
      {children}
      {tfLite && <BackgroundFilters tfLite={tfLite} />}
    </BackgroundFiltersContext.Provider>
  );
};

const BackgroundFilters = (props: { tfLite: TFLite }) => {
  const call = useCall();
  const { children, start } = useRenderer(props.tfLite);
  const { backgroundFilter, onError } = useBackgroundFilters();
  const handleErrorRef = useRef<((error: any) => void) | undefined>(undefined);
  handleErrorRef.current = onError;

  useEffect(() => {
    if (!call || !backgroundFilter) return;
    const { unregister } = call.camera.registerFilter((ms) =>
      start(ms, (error) => handleErrorRef.current?.(error)),
    );
    return () => {
      unregister();
    };
  }, [backgroundFilter, call, start]);

  return children;
};

const useRenderer = (tfLite: TFLite) => {
  const { backgroundFilter, backgroundBlurLevel, backgroundImage } =
    useBackgroundFilters();
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
    (ms: MediaStream, onError?: (error: any) => void) => {
      let outputStream: MediaStream | undefined;
      let renderer: Renderer | undefined;

      const output = new Promise<MediaStream>((resolve, reject) => {
        if (!backgroundFilter) {
          reject(new Error('No filter specified'));
          return;
        }

        const videoEl = videoRef.current;
        const canvasEl = canvasRef.current;
        const bgImageEl = bgImageRef.current;

        if (!videoEl || !canvasEl || (backgroundImage && !bgImageEl)) {
          // You should start renderer in effect or event handlers
          reject(new Error('Renderer started before elements are ready'));
          return;
        }

        videoEl.srcObject = ms;
        videoEl.play().then(
          () => {
            const [track] = ms.getVideoTracks();

            if (!track) {
              reject(new Error('No video tracks in input media stream'));
              return;
            }

            const trackSettings = track.getSettings();
            flushSync(() =>
              setVideoSize({
                width: trackSettings.width ?? 0,
                height: trackSettings.height ?? 0,
              }),
            );
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
      });

      return {
        output,
        stop: () => {
          renderer?.dispose();
          videoRef.current && (videoRef.current.srcObject = null);
          outputStream && disposeOfMediaStream(outputStream);
        },
      };
    },
    [backgroundBlurLevel, backgroundFilter, backgroundImage, tfLite],
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

  return {
    start,
    children,
  };
};
