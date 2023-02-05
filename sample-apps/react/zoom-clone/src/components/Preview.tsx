import {
  useState,
  useRef,
  useLayoutEffect,
  PropsWithChildren,
  createContext,
  useContext,
  ComponentProps,
  Dispatch,
  SetStateAction,
} from 'react';
import { clsx } from 'clsx';
import {
  CallControlsButton,
  useMediaDevices,
  MediaDevicesProvider,
  useActiveCall,
} from '@stream-io/video-react-sdk';
import { getAudioStream, getVideoStream } from '@stream-io/video-client';

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

    // FIXME: not sure about this
    const activeCall = useActiveCall();

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
        <MediaDevicesProvider
          enumerate={
            (videoState.type === 'finished' &&
              audioState.type === 'finished') ||
            !!activeCall
          }
        >
          {children}
        </MediaDevicesProvider>
      </PreviewContext.Provider>
    );
  },
  // MediaDevicesProviderWrapper: () => {

  //   return
  // },
  SpeechIndicator: () => {
    const { setAudioState } = usePreviewContext();
    const { selectedAudioDeviceId } = useMediaDevices();

    useLayoutEffect(() => {
      let mediaStream: MediaStream | undefined;
      let interrupted = false;

      getAudioStream(selectedAudioDeviceId)
        .then((ms) => {
          if (interrupted) return disposeOfMediaStream(ms);

          mediaStream = ms;
          // if (videoElementRef.current) videoElementRef.current.srcObject = ms;
          // isTalkingElement (microphone testing)
          setAudioState!({ type: 'finished' });
        })
        .catch((error) => {
          setAudioState!({ type: 'error', message: error.message });
        });

      return () => {
        interrupted = true;
        if (mediaStream) disposeOfMediaStream(mediaStream);
      };
    }, [selectedAudioDeviceId]);

    return <div />;
  },
  Video: ({ className }: ComponentProps<'video'>) => {
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    const { setVideoState, initialVideoMuted } = usePreviewContext();
    const { selectedVideoDeviceId } = useMediaDevices();

    useLayoutEffect(() => {
      let mediaStream: MediaStream | undefined;
      let interrupted = false;

      if (initialVideoMuted) return;

      getVideoStream(selectedVideoDeviceId)
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
    }, [selectedVideoDeviceId, initialVideoMuted]);

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
        {(videoState.type === 'error' ||
          videoState.type === 'starting' ||
          initialVideoMuted) && (
          <div className="lg:w-3/5 xl:w-1/4 w-full h-96 bg-zinc-700 rounded-lg text-2xl text-zinc-50 flex-col flex justify-center items-center">
            {videoState.type === 'error' && videoState.message}
            {videoState.type === 'starting' && 'Video is starting...'}
            {initialVideoMuted && 'Video is disabled'}
            <span className="text-sm">
              {videoState.type === 'error' &&
                '(reset permissions and reload the page)'}
            </span>
          </div>
        )}

        <Preview.Video
          className={clsx(
            'lg:w-3/5 xl:w-1/4 w-full rounded-lg h-96 object-cover',
            (videoState.type !== 'finished' || initialVideoMuted) && 'hidden',
          )}
        />
        <Preview.SpeechIndicator />

        <div className="flex justify-between items-center lg:w-3/5 xl:w-1/4 w-full">
          <div className="str-video__call-controls bg-zinc-700 rounded-full px-6">
            <CallControlsButton
              icon={initialAudioMuted ? 'mic-off' : 'mic'}
              onClick={() => setInitialAudioMuted!((pv) => !pv)}
            />
            <CallControlsButton
              icon={initialVideoMuted ? 'camera-off' : 'camera'}
              onClick={() => setInitialVideoMuted!((pv) => !pv)}
            />
          </div>
        </div>
      </>
    );
  },
};
