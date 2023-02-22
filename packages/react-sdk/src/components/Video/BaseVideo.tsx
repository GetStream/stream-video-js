import {
  DetailedHTMLProps,
  ForwardedRef,
  forwardRef,
  useEffect,
  useRef,
  VideoHTMLAttributes,
} from 'react';
import { Browsers } from '@stream-io/video-client';
import { useMediaDevices } from '../../contexts';

export type VideoProps = DetailedHTMLProps<
  VideoHTMLAttributes<HTMLVideoElement>,
  HTMLVideoElement
> & {
  stream?: MediaStream;
};

export const BaseVideo = forwardRef<HTMLVideoElement, VideoProps>(
  ({ stream, ...rest }, ref) => {
    const { disposeMediaStream } = useMediaDevices();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const setRef: ForwardedRef<HTMLVideoElement> = (instance) => {
      videoRef.current = instance;
      if (typeof ref === 'function') {
        (ref as (instance: HTMLVideoElement | null) => void)(instance);
      } else if (ref) {
        ref.current = instance;
      }
    };

    useEffect(() => {
      const $el = videoRef.current;
      if (!$el) return;
      if (stream && stream !== $el.srcObject) {
        $el.srcObject = stream;
        if (Browsers.isSafari() || Browsers.isFirefox()) {
          // Firefox and Safari have some timing issue
          setTimeout(() => {
            $el.srcObject = stream;
            $el.play().catch((e) => {
              console.error(`Failed to play stream`, e);
            });
          }, 0);
        }
      }
      return () => {
        $el.pause();
        $el.srcObject = null;
        stream && disposeMediaStream(stream);
      };
    }, [disposeMediaStream, stream]);
    return <video autoPlay playsInline {...rest} ref={setRef} />;
  },
);
