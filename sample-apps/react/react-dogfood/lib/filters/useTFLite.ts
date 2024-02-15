import { useEffect, useState } from 'react';

// defined in tflite-simd.js
declare function createTFLiteSIMDModule(): Promise<TFLite>;

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

function useTFLite(
  props: { tfFilePath?: string; modelFilePath?: string } = {},
) {
  const {
    tfFilePath = '/tflite/tflite-simd.wasm',
    modelFilePath = '/models/segm_full_v679.tflite',
  } = props;

  const [tfliteSIMD, setTFLiteSIMD] = useState<TFLite>();
  const [selectedTFLite, setSelectedTFLite] = useState<TFLite>();
  const [isSIMDSupported, setSIMDSupported] = useState(false);

  useEffect(() => {
    async function loadTFLite() {
      try {
        // @ts-ignore
        const createdTFLiteSIMD = await createTFLiteSIMDModule({
          locateFile: () => tfFilePath,
        });
        setTFLiteSIMD(createdTFLiteSIMD);
        setSIMDSupported(true);
      } catch (error) {
        console.warn('Failed to create TFLite SIMD WebAssembly module.', error);
      }
    }

    loadTFLite();
  }, [tfFilePath]);

  useEffect(() => {
    async function loadTFLiteModel() {
      if (!isSIMDSupported || !tfliteSIMD) return;

      if (!tfliteSIMD) {
        throw new Error(`TFLite backend unavailable`);
      }

      const model = await fetch(modelFilePath).then((r) => r.arrayBuffer());
      const modelBufferOffset = tfliteSIMD._getModelBufferMemoryOffset();
      tfliteSIMD.HEAPU8.set(new Uint8Array(model), modelBufferOffset);
      tfliteSIMD._loadModel(model.byteLength);

      setSelectedTFLite(tfliteSIMD);
    }

    loadTFLiteModel().catch((error) => {
      console.warn('Failed to load TFLite model.', error);
    });
  }, [isSIMDSupported, modelFilePath, tfliteSIMD]);

  return { tflite: selectedTFLite, isSIMDSupported };
}

export default useTFLite;
