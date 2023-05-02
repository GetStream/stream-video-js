import {
  DetailedHTMLProps,
  ForwardedRef,
  forwardRef,
  useEffect,
  useState,
  VideoHTMLAttributes,
} from 'react';
import { Browsers } from '@stream-io/video-client';

export type VideoProps = DetailedHTMLProps<
  VideoHTMLAttributes<HTMLVideoElement>,
  HTMLVideoElement
> & {
  stream?: MediaStream;
};

/**
 * @description Extends video element with `stream` property
 * (`srcObject`) to reactively handle stream changes
 */
export const BaseVideo = forwardRef<HTMLVideoElement, VideoProps>(
  ({ stream, ...rest }, ref) => {
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
      null,
    );
    const setRef: ForwardedRef<HTMLVideoElement> = (instance) => {
      setVideoElement(instance);
      if (typeof ref === 'function') {
        (ref as (instance: HTMLVideoElement | null) => void)(instance);
      } else if (ref) {
        ref.current = instance;
      }
    };

    useEffect(() => {
      if (!videoElement || !stream) return;
      if (stream === videoElement.srcObject) return;

      videoElement.srcObject = stream;
      if (Browsers.isSafari() || Browsers.isFirefox()) {
        // Firefox and Safari have some timing issue
        setTimeout(() => {
          videoElement.srcObject = stream;
          videoElement.play().catch((e) => {
            console.error(`Failed to play stream`, e);
          });
        }, 0);
      }

      return () => {
        videoElement.pause();
        videoElement.srcObject = null;
      };
    }, [stream, videoElement]);

    return <video autoPlay playsInline {...rest} ref={setRef} />;
  },
);
