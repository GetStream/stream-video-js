import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import { loadTFLite, TFLite } from '../lib/filters/tflite';
import {
  BackgroundConfig,
  createRenderer,
} from '../lib/filters/createRenderer';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export type BackgroundFiltersProps = {
  isBlurringEnabled?: boolean;
  backgroundImages?: string[];
  backgroundFilter?: BackgroundConfig;
  backgroundImage?: string;
  tfFilePath?: string;
  modelFilePath?: string;
};

export type BackgroundFiltersAPI = {
  setBackgroundFilter: (filter: BackgroundConfig, imageUrl?: string) => void;
};

export type BackgroundFiltersContextValue = BackgroundFiltersProps &
  BackgroundFiltersAPI;

const BackgroundFiltersContext = createContext<
  BackgroundFiltersContextValue | undefined
>(undefined);

export const useBackgroundFilters = () => {
  return useContext(BackgroundFiltersContext);
};

export const BackgroundFiltersProvider = (
  props: PropsWithChildren<BackgroundFiltersProps>,
) => {
  const {
    children,
    isBlurringEnabled = true,
    backgroundImages = [],
    backgroundFilter: backgroundFilterFromProps = 'none',
    backgroundImage: backgroundImageFromProps = undefined,
    tfFilePath,
    modelFilePath,
  } = props;

  const [backgroundFilterConfig, setBackgroundFilterConfig] = useState(
    backgroundFilterFromProps,
  );
  const [backgroundImage, setBackgroundImage] = useState(
    backgroundImageFromProps,
  );
  const setBackgroundFilter = useCallback(
    (filter: BackgroundConfig, imageUrl?: string) => {
      setBackgroundFilterConfig(filter);
      setBackgroundImage(imageUrl);
    },
    [],
  );
  return (
    <BackgroundFiltersContext.Provider
      value={{
        isBlurringEnabled,
        backgroundImages,
        backgroundFilter: backgroundFilterConfig,
        setBackgroundFilter,
        backgroundImage,
      }}
    >
      {children}
      <BackgroundFilters
        tfFilePath={tfFilePath}
        modelFilePath={modelFilePath}
      />
    </BackgroundFiltersContext.Provider>
  );
};

const BackgroundFilters = (props: {
  tfFilePath?: string;
  modelFilePath?: string;
}) => {
  const { tfFilePath, modelFilePath } = props;
  const call = useCall();
  const { backgroundImage, backgroundFilter } = useBackgroundFilters() || {};
  const [videoRef, setVideoRef] = useState<HTMLVideoElement>();
  const [backgroundImageRef, setBackgroundImageRef] =
    useState<HTMLImageElement>();
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement>();

  const resolveFilterRef =
    useRef<(value: MediaStream | PromiseLike<MediaStream>) => void>();

  const [mediaStream, setMediaStream] = useState<MediaStream>();
  useEffect(() => {
    if (!call || backgroundFilter === 'none') return;
    const registerFilter = call.camera.registerFilter(async (ms) => {
      return new Promise<MediaStream>((resolve) => {
        setMediaStream(ms);
        resolveFilterRef.current = resolve;
      });
    });

    return () => {
      registerFilter
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
  const { width = 0, height = 0 } = videoTrack?.getSettings() || {};

  const objectFit = width > height ? 'cover' : 'contain';
  return (
    <div className="rd__camera-filters">
      {mediaStream && (
        <RenderPipeline
          videoRef={videoRef}
          canvasRef={canvasRef}
          backgroundImageRef={backgroundImageRef}
          backgroundFilter={backgroundFilter || 'none'}
          tfFilePath={tfFilePath}
          modelFilePath={modelFilePath}
        />
      )}
      <video
        // @ts-expect-error null vs undefined
        ref={setVideoRef}
        autoPlay
        playsInline
        controls={false}
        width={width}
        height={height}
        muted
        loop
        style={{ objectFit }}
      />
      {backgroundImage && (
        <img
          alt="Background"
          // @ts-expect-error null vs undefined
          ref={setBackgroundImageRef}
          key={backgroundImage}
          src={backgroundImage}
          width="1920"
          height="1080"
        />
      )}
      <canvas
        width={width}
        height={height}
        // @ts-expect-error null vs undefined
        ref={setCanvasRef}
      />
    </div>
  );
};

const RenderPipeline = (props: {
  videoRef: HTMLVideoElement | undefined;
  canvasRef: HTMLCanvasElement | undefined;
  backgroundImageRef: HTMLImageElement | undefined;
  backgroundFilter: BackgroundConfig;
  tfFilePath?: string;
  modelFilePath?: string;
}) => {
  const {
    videoRef,
    canvasRef,
    backgroundImageRef,
    backgroundFilter,
    tfFilePath,
    modelFilePath,
  } = props;
  const [tfLite, setTfLite] = useState<TFLite>();
  useEffect(() => {
    loadTFLite({ basePath, modelFilePath, tfFilePath }).then(setTfLite);
  }, [modelFilePath, tfFilePath]);

  useEffect(() => {
    if (!tfLite || !videoRef || !canvasRef) return;
    if (backgroundFilter === 'image' && !backgroundImageRef) return;

    const dispose = createRenderer(tfLite, videoRef, canvasRef, {
      backgroundConfig: backgroundFilter,
      backgroundImage: backgroundImageRef,
    });
    return () => {
      dispose();
    };
  }, [backgroundImageRef, canvasRef, backgroundFilter, tfLite, videoRef]);

  return null;
};
