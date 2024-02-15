import { useEffect } from 'react';
import { buildWebGL2Pipeline } from './webgl2/webgl2Pipeline';
import useTFLite from './useTFLite';

function useRenderingPipeline(
  videoSource: HTMLVideoElement | undefined,
  targetCanvas: HTMLCanvasElement | undefined,
  options: {
    backgroundConfig: 'none' | 'blur' | 'image';
    backgroundImage?: HTMLImageElement;
  },
) {
  const { backgroundConfig, backgroundImage } = options;

  const { tflite } = useTFLite();

  useEffect(() => {
    if (!videoSource || !tflite) return;
    if (backgroundConfig === 'image' && !backgroundImage) return;
    if (!targetCanvas) return;

    const pipeline = buildWebGL2Pipeline(
      videoSource,
      backgroundImage,
      backgroundConfig,
      targetCanvas,
      tflite,
    );

    const id = setInterval(() => {
      pipeline.render();

      if (backgroundConfig === 'image') {
        pipeline.updatePostProcessingConfig();
      }
    }, 1000 / 30); // 30fps

    return () => {
      pipeline.cleanUp();
      clearInterval(id);
    };
  }, [backgroundConfig, backgroundImage, targetCanvas, tflite, videoSource]);
}

export default useRenderingPipeline;
