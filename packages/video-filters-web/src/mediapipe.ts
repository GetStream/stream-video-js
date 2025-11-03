import { packageName, version } from './version';

let lastModelFilePath = '';
let modelFileCache: ArrayBuffer | undefined;
export const loadMediaPipe = async (
  options: {
    wasmPath?: string;
    modelPath?: string;
  } = {},
): Promise<ArrayBuffer> => {
  const basePath = `https://unpkg.com/${packageName}@${version}/mediapipe`;

  const { modelPath = `${basePath}/models/selfie_segmenter.tflite` } = options;

  const model =
    modelPath === lastModelFilePath && modelFileCache
      ? modelFileCache
      : await fetch(modelPath).then((r) => r.arrayBuffer());

  modelFileCache = model;
  lastModelFilePath = modelPath;

  return model;
};

export const isMediaPipeSupported = () =>
  typeof MediaStreamTrackGenerator !== 'undefined' &&
  typeof MediaStreamTrackProcessor !== 'undefined';
