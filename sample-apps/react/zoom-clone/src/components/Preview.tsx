import { useState, useRef, useLayoutEffect, PropsWithChildren } from 'react';
import { clsx } from 'clsx';
import { CallControlsButton } from '@stream-io/video-react-sdk';

export const Preview = ({ children }: PropsWithChildren) => {
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setvideoMuted] = useState(false);
  const [state, setState] = useState<{
    type: 'error' | 'finished' | 'starting';
    message?: string;
  }>({ type: 'starting' });

  useLayoutEffect(() => {
    const $el = videoElementRef.current;
    let mediaStream: MediaStream | undefined;
    let interrupted = false;

    navigator.mediaDevices
      .getUserMedia({ video: { width: 960, height: 540 } })
      .then((ms) => {
        if (interrupted) return ms.getTracks().forEach((t) => t.stop());
        mediaStream = ms;
        setTimeout(() => {
          if (!$el) return;
          $el.srcObject = ms;
        }, 0);

        setState({ type: 'finished' });
      })
      .catch((error) => {
        setState({ type: 'error', message: error.message });
      });

    return () => {
      interrupted = true;
      if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  return (
    <>
      {(state.type === 'error' || state.type === 'starting') && (
        <div className="w-2/5 h-96 bg-zinc-700 rounded-lg text-2xl text-zinc-50 flex-col flex justify-center items-center">
          {state.message ?? 'Video is starting...'}
          <span className="text-sm">
            {state.type === 'error' &&
              '(reset permissions and reload the page)'}
          </span>
        </div>
      )}

      <video
        className={clsx(
          'w-2/5 rounded-xl',
          state.type !== 'finished' && 'hidden',
        )}
        autoPlay
        muted
        ref={videoElementRef}
      />

      <div className="flex justify-between items-center w-2/5">
        <div className="str-video__call-controls bg-zinc-700 rounded-full px-6">
          <CallControlsButton
            icon={audioMuted ? 'mic-off' : 'mic'}
            onClick={() => setAudioMuted((pv) => !pv)}
          />
          <CallControlsButton
            icon={videoMuted ? 'camera-off' : 'camera'}
            onClick={() => setvideoMuted((pv) => !pv)}
          />
        </div>
        {children}
      </div>
    </>
  );
};
