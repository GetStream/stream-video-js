// @ts-expect-error - module is not declared
import { createTFLiteSIMDModule } from './tflite-simd.js';
import { packageName, version } from './version';

// This is a WebAssembly module compiled from the TensorFlow Lite C++ library.
const createTFLite = createTFLiteSIMDModule as (opts?: any) => Promise<TFLite>;

export interface TFLite extends EmscriptenModule {
  _getModelBufferMemoryOffset(): number;
  _getInputMemoryOffset(): number;
  _getInputHeight(): number;
  _getInputWidth(): number;
  _getInputChannelCount(): number;
  _getOutputMemoryOffset(): number;
  _getOutputHeight(): number;
  _getOutputWidth(): number;
  _getOutputChannelCount(): number;
  _loadModel(bufferSize: number): number;
  _runInference(): number;
}

let lastModelFilePath = '';
let modelFileCache: ArrayBuffer | undefined;

export const loadTFLite = async (
  options: {
    basePath?: string;
    tfFilePath?: string;
    modelFilePath?: string;
  } = {},
) => {
  const {
    basePath = `https://unpkg.com/${packageName}@${version}/tf`,
    tfFilePath = `${basePath}/tflite/tflite-simd.wasm`,
    modelFilePath = `${basePath}/models/segm_full_v679.tflite`,
  } = options;
  let tfLite: TFLite | undefined;
  try {
    tfLite = await createTFLite({ locateFile: () => tfFilePath });
  } catch (error) {
    console.warn('Failed to create TFLite SIMD WebAssembly module.', error);
    throw new Error(`TFLite backend unavailable`);
  }

  const model =
    modelFilePath === lastModelFilePath && modelFileCache
      ? modelFileCache
      : await fetch(modelFilePath).then((r) => r.arrayBuffer());

  // Cache the model file for future use.
  modelFileCache = model;

  const modelBufferOffset = tfLite._getModelBufferMemoryOffset();
  tfLite.HEAPU8.set(new Uint8Array(model), modelBufferOffset);
  tfLite._loadModel(model.byteLength);

  return tfLite;
};
