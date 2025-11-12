import { packageName, version } from './version';

let lastModelFilePath = '';
let modelFileCache: ArrayBuffer | undefined;
export const loadMediaPipe = async (
  options: {
    basePath?: string;
    modelPath?: string;
  } = {},
): Promise<ArrayBuffer> => {
  const {
    basePath = `https://unpkg.com/${packageName}@${version}/mediapipe`,
    modelPath = `${basePath}/models/selfie_segmenter.tflite`,
  } = options;

  const model =
    modelPath === lastModelFilePath && modelFileCache
      ? modelFileCache
      : await fetch(modelPath).then((r) => r.arrayBuffer());

  modelFileCache = model;
  lastModelFilePath = modelPath;

  return model;
};
