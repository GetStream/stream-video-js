import { WorkerTimer } from '@stream-io/worker-timer';
import { TFLite } from './tflite';
import { buildWebGL2Pipeline } from './webgl2/webgl2Pipeline';
import { getSegmentationParams, SegmentationLevel } from './segmentation';
import { BackgroundBlurLevel, BackgroundFilter } from '../types';

export type Renderer = {
  /**
   * Disposes of the renderer.
   */
  dispose: () => void;
};

export function createRenderer(
  tflite: TFLite,
  videoSource: HTMLVideoElement,
  targetCanvas: HTMLCanvasElement,
  options: {
    backgroundFilter: BackgroundFilter;
    segmentationLevel?: SegmentationLevel;
    backgroundImage?: HTMLImageElement;
    backgroundBlurLevel?: BackgroundBlurLevel;
    fps?: number;
  },
  onError?: (error: any) => void,
): Renderer {
  const {
    backgroundFilter,
    backgroundImage,
    backgroundBlurLevel,
    segmentationLevel = SegmentationLevel.HIGH,
    fps = 30,
  } = options;
  if (backgroundFilter === 'image' && !backgroundImage) {
    throw new Error(
      `backgroundImage element is required when backgroundFilter is image`,
    );
  }

  const pipeline = buildWebGL2Pipeline(
    videoSource,
    backgroundImage,
    backgroundBlurLevel,
    backgroundFilter,
    targetCanvas,
    tflite,
    getSegmentationParams(segmentationLevel),
  );

  const timers = new WorkerTimer({ useWorker: true });
  const id = timers.setInterval(
    () => {
      try {
        pipeline.render();

        if (backgroundFilter === 'image') {
          pipeline.updatePostProcessingConfig();
        }
      } catch (error) {
        onError?.(error);
      }
    },
    Math.floor(1000 / (fps <= 0 ? 30 : fps)),
  );

  return {
    dispose: () => {
      pipeline.cleanUp();
      timers.clearInterval(id);
      timers.destroy();
    },
  };
}
