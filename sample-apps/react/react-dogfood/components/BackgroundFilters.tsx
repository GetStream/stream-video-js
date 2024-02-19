import { useEffect, useRef, useState } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import { createRenderer } from '../lib/filters/createRenderer';
import { loadTFLite, TFLite } from '../lib/filters/tflite';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const BackgroundFilters = () => {
  const call = useCall();
  const [videoRef, setVideoRef] = useState<HTMLVideoElement>();
  const [backgroundImageRef, setBackgroundImageRef] =
    useState<HTMLImageElement>();
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement>();

  const resolveFilterRef =
    useRef<(value: MediaStream | PromiseLike<MediaStream>) => void>();

  const [mediaStream, setMediaStream] = useState<MediaStream>();
  useEffect(() => {
    if (!call) return;
    return call.camera.registerFilter(async (ms) => {
      setMediaStream(ms);
      return new Promise<MediaStream>((resolve) => {
        resolveFilterRef.current = resolve;
      });
    });
  }, [call]);

  useEffect(() => {
    if (!mediaStream || !videoRef || !canvasRef) return;
    videoRef.srcObject = mediaStream;

    const handleOnPlay = () => {
      const resolveFilter = resolveFilterRef.current;
      if (!resolveFilter) return;
      const filter = canvasRef.captureStream();
      resolveFilter(filter);
    };
    videoRef.addEventListener('play', handleOnPlay);
    return () => {
      videoRef.removeEventListener('play', handleOnPlay);
      videoRef.srcObject = null;
    };
  }, [canvasRef, mediaStream, videoRef]);

  return (
    <div className="rd__camera-filters">
      {mediaStream && (
        <RenderPipeline
          videoRef={videoRef}
          canvasRef={canvasRef}
          backgroundImageRef={backgroundImageRef}
        />
      )}
      <video
        // @ts-expect-error null vs undefined
        ref={setVideoRef}
        autoPlay
        playsInline
        controls={false}
        width="1920"
        height="1080"
        muted
        loop
        style={{ objectFit: 'cover' }}
      />
      <img
        alt="Background"
        // @ts-expect-error null vs undefined
        ref={setBackgroundImageRef}
        src={`${basePath}/backgrounds/porch.jpg`}
        width="1920"
        height="1080"
      />
      <canvas
        width="1920"
        height="1080"
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
}) => {
  const { videoRef, canvasRef, backgroundImageRef } = props;
  const [tfLite, setTfLite] = useState<TFLite>();
  useEffect(() => {
    loadTFLite({ basePath }).then(setTfLite);
  }, []);
  useEffect(() => {
    if (!tfLite || !videoRef || !canvasRef) return;
    const dispose = createRenderer(tfLite, videoRef, canvasRef, {
      backgroundConfig: 'image',
      backgroundImage: backgroundImageRef,
    });
    return () => {
      dispose();
    };
  }, [backgroundImageRef, canvasRef, tfLite, videoRef]);

  return null;
};
