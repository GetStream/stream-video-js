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
  isBlurringEnabled?: boolean;
  backgroundImages?: string[];
  backgroundFilter?: BackgroundConfig;
  backgroundImage?: string;
  backgroundBlurLevel?: BackgroundBlurLevel;
  tfFilePath?: string;
  modelFilePath?: string;
  basePath?: string;
};

export type BackgroundFiltersAPI = {
  isSupported: boolean;
  disableBackgroundFilter: () => void;
  applyBackgroundBlurFilter: (blurLevel: BackgroundBlurLevel) => void;
  applyBackgroundImageFilter: (imageUrl: string) => void;
};

export type BackgroundFiltersContextValue = BackgroundFiltersProps &
  BackgroundFiltersAPI;

const BackgroundFiltersContext = createContext<
  BackgroundFiltersContextValue | undefined
>(undefined);

export const useBackgroundFilters = () => {
  const context = useContext(BackgroundFiltersContext);
  if (!context) {
    throw new Error(
      'useBackgroundFilters must be used within a BackgroundFiltersProvider',
    );
  }
  return context;
};

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

  return (
    <BackgroundFiltersContext.Provider
      value={{
        isSupported,
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
      <BackgroundFilters />
    </BackgroundFiltersContext.Provider>
  );
};

const BackgroundFilters = () => {
  const call = useCall();
  const { backgroundImage, backgroundFilter } = useBackgroundFilters();
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [bgImageRef, setBgImageRef] = useState<HTMLImageElement | null>(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);

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

  const videoTrack = mediaStream?.getVideoTracks()[0];
  const { width = 1920, height = 1080 } = videoTrack?.getSettings() || {};

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
  videoRef: HTMLVideoElement | null;
  canvasRef: HTMLCanvasElement | null;
  backgroundImageRef: HTMLImageElement | null;
}) => {
  const { videoRef, canvasRef, backgroundImageRef } = props;
  const {
    backgroundFilter = 'none',
    backgroundBlurLevel,
    tfFilePath,
    modelFilePath,
    basePath,
  } = useBackgroundFilters();
  const [tfLite, setTfLite] = useState<TFLite>();
  useEffect(() => {
    loadTFLite({ basePath, modelFilePath, tfFilePath })
      .then(setTfLite)
      .catch((err) => {});
  }, [basePath, modelFilePath, tfFilePath]);

  useEffect(() => {
    if (!tfLite || !videoRef || !canvasRef) return;
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
