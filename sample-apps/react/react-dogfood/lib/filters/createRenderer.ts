import { TFLite } from './tflite';
import { buildWebGL2Pipeline } from './webgl2/webgl2Pipeline';

export type BackgroundConfig = 'none' | 'blur' | 'image';

export function createRenderer(
  tflite: TFLite,
  videoSource: HTMLVideoElement,
  targetCanvas: HTMLCanvasElement,
  options: {
    backgroundConfig: BackgroundConfig;
    backgroundImage?: HTMLImageElement;
    fps?: number;
  },
) {
  const { backgroundConfig, backgroundImage, fps = 30 } = options;
  if (backgroundConfig === 'image' && !backgroundImage) {
    throw new Error(
      'backgroundImage element is required when backgroundConfig is image',
    );
  }

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
  }, 1000 / (fps <= 0 ? 30 : fps));

  return function dispose() {
    pipeline.cleanUp();
    clearInterval(id);
  };
}
