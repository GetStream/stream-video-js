import {
  DetailedHTMLProps,
  useEffect,
  useRef,
  VideoHTMLAttributes,
} from 'react';

export const Video = (
  props: DetailedHTMLProps<
    VideoHTMLAttributes<HTMLVideoElement>,
    HTMLVideoElement
  > & {
    stream?: MediaStream;
  },
) => {
  const { stream } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const $el = videoRef.current;
    if (!$el) return;
    if (stream) {
      $el.srcObject = stream;
    }
    return () => {
      $el.srcObject = null;
    };
  }, [stream]);
  return <video {...props} ref={videoRef} />;
};
