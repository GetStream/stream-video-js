import {
  ComponentProps,
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { clsx } from 'clsx';
import {
  createSoundDetector,
  DeviceSettings,
  getAudioStream,
  getVideoStream,
  IconButton,
  MediaDevicesProvider,
  useMediaDevices,
} from '@stream-io/video-react-sdk';

const disposeOfMediaStream = (ms: MediaStream) => {
  return ms.getTracks().forEach((track) => track.stop());
};

type SetMSState = (state: MediaStreamState) => void;
type SetInitialMuteState = Dispatch<SetStateAction<boolean>>;

const PreviewContext = createContext<{
  videoState: MediaStreamState;
  audioState: MediaStreamState;
  initialVideoMuted: boolean;
  initialAudioMuted: boolean;
  setVideoState: null | SetMSState;
  setAudioState: null | SetMSState;
  setInitialVideoMuted: null | SetInitialMuteState;
  setInitialAudioMuted: null | SetInitialMuteState;
}>({
  videoState: { type: 'starting' },
  audioState: { type: 'starting' },
  initialVideoMuted: false,
  initialAudioMuted: false,
  setVideoState: null,
  setAudioState: null,
  setInitialVideoMuted: null,
  setInitialAudioMuted: null,
});

export const usePreviewContext = () => useContext(PreviewContext);

type MediaStreamState =
  | {
      type: 'finished' | 'starting';
    }
  | { type: 'error'; message: string };

export const Preview = {
  Provider: ({ children }: PropsWithChildren) => {
    const [videoState, setVideoState] = useState<MediaStreamState>({
      type: 'starting',
    });
    const [audioState, setAudioState] = useState<MediaStreamState>({
      type: 'starting',
    });

    const [initialVideoMuted, setInitialVideoMuted] = useState<boolean>(false);
    const [initialAudioMuted, setInitialAudioMuted] = useState<boolean>(false);

    return (
      <PreviewContext.Provider
        value={{
          audioState,
          videoState,
          initialVideoMuted,
          initialAudioMuted,
          setAudioState,
          setVideoState,
          setInitialVideoMuted,
          setInitialAudioMuted,
        }}
      >
        <MediaDevicesProvider>{children}</MediaDevicesProvider>
      </PreviewContext.Provider>
    );
  },

  SpeechIndicator: () => {
    const { setAudioState, initialAudioMuted } = usePreviewContext();
    const { selectedAudioInputDeviceId } = useMediaDevices();
    const [percentage, setPercentage] = useState<number>(0);

    useLayoutEffect(() => {
      let mediaStream: MediaStream | undefined;
      let interrupted = false;
      let disposeOfSoundDetector:
        | undefined
        | ReturnType<typeof createSoundDetector>;

      if (initialAudioMuted) return;

      getAudioStream({ deviceId: selectedAudioInputDeviceId })
        .then((ms) => {
          if (interrupted) return disposeOfMediaStream(ms);

          mediaStream = ms;

          disposeOfSoundDetector = createSoundDetector(
            ms,
            ({ audioLevel }) => {
              setPercentage(audioLevel);
            },
            { detectionFrequencyInMs: 50 },
          );

          setAudioState!({ type: 'finished' });
        })
        .catch((error) => {
          setAudioState!({ type: 'error', message: error.message });
        });

      return () => {
        interrupted = true;
        disposeOfSoundDetector?.();
        if (mediaStream) disposeOfMediaStream(mediaStream);
        setPercentage(0);
      };
    }, [selectedAudioInputDeviceId, initialAudioMuted, setAudioState]);

    return (
      <div className="w-8 h-8 bg-zinc-600 rounded-full flex justify-center items-center">
        <div
          className="rounded-full bg-zinc-100 to-transparent w-full h-full
          "
          style={{ transform: `scale(${percentage / 100})` }}
        />
      </div>
    );
  },
  Video: ({ className }: ComponentProps<'video'>) => {
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    const { setVideoState, initialVideoMuted } = usePreviewContext();
    const { selectedVideoDeviceId } = useMediaDevices();

    useLayoutEffect(() => {
      let mediaStream: MediaStream | undefined;
      let interrupted = false;

      if (initialVideoMuted) return;

      getVideoStream({ deviceId: selectedVideoDeviceId })
        .then((ms) => {
          if (interrupted) return disposeOfMediaStream(ms);

          mediaStream = ms;
          if (videoElementRef.current) videoElementRef.current.srcObject = ms;
          setVideoState!({ type: 'finished' });
        })
        .catch((error) => {
          setVideoState!({ type: 'error', message: error.message });
        });

      return () => {
        interrupted = true;
        if (mediaStream) disposeOfMediaStream(mediaStream);
      };
    }, [selectedVideoDeviceId, initialVideoMuted, setVideoState]);

    return <video className={className} autoPlay muted ref={videoElementRef} />;
  },
  Layout: () => {
    const {
      videoState,
      initialAudioMuted,
      initialVideoMuted,
      setInitialAudioMuted,
      setInitialVideoMuted,
    } = usePreviewContext();

    return (
      <>
        <div className="relative lg:w-3/5 xl:w-1/4 w-full flex justify-center">
          <div className="absolute top-2 right-2 z-10">
            <DeviceSettings />
          </div>

          <div className="absolute bottom-2 left-2">
            <Preview.SpeechIndicator />
          </div>

          {(videoState.type === 'error' ||
            videoState.type === 'starting' ||
            initialVideoMuted) && (
            <div className=" w-full h-96 bg-zinc-700 rounded-lg text-2xl text-zinc-50 flex-col flex justify-center items-center">
              {videoState.type === 'error' &&
                !initialVideoMuted &&
                videoState.message}
              {videoState.type === 'starting' && 'Video is starting...'}
              {initialVideoMuted && 'Video is disabled'}
              <span className="text-sm">
                {videoState.type === 'error' &&
                  !initialVideoMuted &&
                  '(reset permissions and reload the page)'}
              </span>
            </div>
          )}

          <Preview.Video
            className={clsx(
              'w-full rounded-lg h-96 object-cover',
              (videoState.type !== 'finished' || initialVideoMuted) && 'hidden',
            )}
          />
        </div>

        <div className="flex justify-between items-center lg:w-3/5 xl:w-1/4 w-full">
          <div className="str-video__call-controls bg-zinc-700 rounded-full px-6">
            <IconButton
              icon={initialAudioMuted ? 'mic-off' : 'mic'}
              onClick={() => setInitialAudioMuted!((pv) => !pv)}
            />
            <IconButton
              icon={initialVideoMuted ? 'camera-off' : 'camera'}
              onClick={() => setInitialVideoMuted!((pv) => !pv)}
            />
          </div>
        </div>
      </>
    );
  },
};
