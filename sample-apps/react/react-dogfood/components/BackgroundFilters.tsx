import { useEffect, useState } from 'react';
import { CallingState, useCall } from '@stream-io/video-react-sdk';
import useRenderingPipeline from '../lib/filters/useRenderingPipeline';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const BackgroundFilters = () => {
  const call = useCall();
  const [videoRef, setVideoRef] = useState<HTMLVideoElement>();
  const [backgroundImageRef, setBackgroundImageRef] =
    useState<HTMLImageElement>();
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement>();

  useRenderingPipeline(videoRef, canvasRef, {
    backgroundConfig: 'image',
    backgroundImage: backgroundImageRef,
  });

  useEffect(() => {
    if (!call || !videoRef) return;
    const msUnsubscribe = call.camera.state.mediaStream$.subscribe((ms) => {
      if (ms) {
        videoRef!.srcObject = ms;
      }
    });

    const callStateUnsubscribe = call.state.callingState$.subscribe((s) => {
      if (s === CallingState.JOINED) {
        const stream = canvasRef?.captureStream();
        call.publishVideoStream(stream!);
      }
    });

    return () => {
      msUnsubscribe.unsubscribe();
      callStateUnsubscribe.unsubscribe();
    };
  }, [call, canvasRef, videoRef]);

  return (
    <div className="rd__camera-filters">
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
