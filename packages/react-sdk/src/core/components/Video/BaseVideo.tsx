import { ComponentPropsWithRef, forwardRef, useEffect, useState } from 'react';
import { Browsers } from '@stream-io/video-client';

import { applyElementToRef } from '../../../utilities';

export type BaseVideoProps = ComponentPropsWithRef<'video'> & {
  stream?: MediaStream;
};

/**
 * @description Extends video element with `stream` property
 * (`srcObject`) to reactively handle stream changes
 */
export const BaseVideo = forwardRef<HTMLVideoElement, BaseVideoProps>(
  function BaseVideo({ stream, ...rest }, ref) {
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
      null,
    );

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

    return (
      <video
        autoPlay
        playsInline
        {...rest}
        ref={(element) => {
          applyElementToRef(ref, element);
          setVideoElement(element);
        }}
      />
    );
  },
);
