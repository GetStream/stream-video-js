import processorSource from './processor.js?raw';
import type { FastEnhancerModel } from '../FastEnhancerNoiseCancellation';

/**
 * The `modelSize` ids the worklet's `fe_init` expects.
 */
const MODEL_IDS: Record<FastEnhancerModel, number> = {
  tiny: 0,
  base: 1,
  small: 2,
};

const fetchAsset = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`.trim(),
    );
  }
  return response;
};

const addProcessorModule = async (ctx: AudioContext) => {
  const blob = new Blob([processorSource], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  try {
    await ctx.audioWorklet.addModule(url);
  } finally {
    URL.revokeObjectURL(url);
  }
};

/**
 * Loads the FastEnhancer worklet and model into the given audio context.
 *
 * Resolves with the worklet node once the worklet has replied `ready`.
 * The node starts with its own bypass on, so it processes nothing until
 * `set_bypass { enabled: false }` is posted.
 */
export const createFastEnhancerNode = async (
  ctx: AudioContext,
  opts: {
    model: FastEnhancerModel;
    basePath: string;
    simd: boolean;
    hpf: boolean;
    agc: boolean;
    timeoutMs: number;
  },
): Promise<AudioWorkletNode> => {
  const { model, simd, hpf, agc, timeoutMs } = opts;
  const prefix = `${opts.basePath.replace(/\/+$/, '')}/fe_${model}`;
  const variant = simd ? 'simd' : 'scalar';

  const [wasmBytes, exportMap, weightBytes] = await Promise.all([
    fetchAsset(`${prefix}_${variant}.wasm`).then((r) => r.arrayBuffer()),
    fetchAsset(`${prefix}_${variant}.exports.json`).then(
      (r) => r.json() as Promise<Record<string, string>>,
    ),
    fetchAsset(`${prefix}_48k.bin`).then((r) => r.arrayBuffer()),
    addProcessorModule(ctx),
  ]);

  const node = new AudioWorkletNode(ctx, 'fastenhancer-processor', {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [1],
  });

  try {
    await new Promise<void>((resolve, reject) => {
      const settle = (error?: Error) => {
        clearTimeout(timeoutId);
        node.port.removeEventListener('message', onMessage);
        node.removeEventListener('processorerror', onProcessorError);
        if (error) reject(error);
        else resolve();
      };
      const onMessage = (e: MessageEvent) => {
        const type = e.data?.type;
        if (type === 'ready') settle();
        if (type === 'error') {
          settle(
            new Error(
              `FastEnhancer worklet failed to initialize: ${e.data.message || 'unknown error'}`,
            ),
          );
        }
      };
      const onProcessorError = () => {
        settle(new Error('FastEnhancer worklet stopped during initialization'));
      };
      const timeoutId = setTimeout(() => {
        settle(
          new Error(
            `FastEnhancer worklet did not become ready within ${timeoutMs} ms`,
          ),
        );
      }, timeoutMs);

      node.port.addEventListener('message', onMessage);
      node.port.start();
      node.addEventListener('processorerror', onProcessorError);

      node.port.postMessage(
        {
          type: 'init',
          wasmBytes,
          weightBytes,
          exportMap,
          modelSize: MODEL_IDS[model],
        },
        [wasmBytes, weightBytes],
      );
      node.port.postMessage({ type: 'set_hpf', enabled: hpf });
      node.port.postMessage({ type: 'set_agc', enabled: agc });
      node.port.postMessage({ type: 'set_bypass', enabled: true });
    });
  } catch (err) {
    node.port.postMessage({ type: 'destroy' });
    node.disconnect();
    node.port.close();
    throw err;
  }

  return node;
};
