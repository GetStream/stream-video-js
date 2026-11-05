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

const ABORTED_MESSAGE = 'FastEnhancer initialization was aborted';

const fetchAsset = async (url: string, signal: AbortSignal) => {
  const response = await fetch(url, { signal });
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
 *
 * The caller bounds the whole load with `signal`: aborting it cancels the
 * fetches, stops waiting for `ready`, and rejects with a generic error (the
 * caller knows the cause). No node is returned once the signal has aborted.
 * Only `signal.aborted` and the `abort` event are used, which older Safari
 * versions support too.
 */
export const createFastEnhancerNode = async (
  ctx: AudioContext,
  opts: {
    model: FastEnhancerModel;
    basePath: string;
    simd: boolean;
    hpf: boolean;
    agc: boolean;
    signal: AbortSignal;
  },
): Promise<AudioWorkletNode> => {
  const { model, simd, hpf, agc, signal } = opts;
  const assertNotAborted = () => {
    if (signal.aborted) throw new Error(ABORTED_MESSAGE);
  };
  const prefix = `${opts.basePath.replace(/\/+$/, '')}/fe_${model}`;
  const variant = simd ? 'simd' : 'scalar';

  const [wasmBytes, exportMap, weightBytes] = await Promise.all([
    fetchAsset(`${prefix}_${variant}.wasm`, signal).then((r) =>
      r.arrayBuffer(),
    ),
    fetchAsset(`${prefix}_${variant}.exports.json`, signal).then(
      (r) => r.json() as Promise<Record<string, string>>,
    ),
    fetchAsset(`${prefix}_48k.bin`, signal).then((r) => r.arrayBuffer()),
    addProcessorModule(ctx),
  ]);
  // `addModule` can't be aborted, so check before creating the node
  assertNotAborted();

  const node = new AudioWorkletNode(ctx, 'fastenhancer-processor', {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [1],
    // the processor reads the first channel only: downmix stereo input
    channelCount: 1,
    channelCountMode: 'explicit',
  });

  try {
    await new Promise<void>((resolve, reject) => {
      const settle = (error?: unknown) => {
        signal.removeEventListener('abort', onAbort);
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
      const onAbort = () => settle(new Error(ABORTED_MESSAGE));

      signal.addEventListener('abort', onAbort);
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
    assertNotAborted();
  } catch (err) {
    node.port.postMessage({ type: 'destroy' });
    node.disconnect();
    node.port.close();
    throw err;
  }

  return node;
};
