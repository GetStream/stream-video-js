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

/**
 * How long a model file request may wait for the server's response.
 * Only the response has to arrive in time: a slow download that is making
 * progress is bounded by the caller's overall deadline instead.
 */
const RESPONSE_TIMEOUT_MS = 10000;

const ABORTED_MESSAGE = 'FastEnhancer initialization was aborted';

/**
 * Fetches the given URL and reads its body with `read`.
 * Fails when the server doesn't respond within `RESPONSE_TIMEOUT_MS`,
 * and when the caller's `signal` aborts.
 */
const fetchAsset = async <T>(
  url: string,
  signal: AbortSignal,
  read: (response: Response) => Promise<T>,
): Promise<T> => {
  // A local controller, so that the response timeout can abort this request
  // alone (without the newer `AbortSignal.any`).
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal.addEventListener('abort', onAbort);
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, RESPONSE_TIMEOUT_MS);
  try {
    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`.trim(),
      );
    }
    return await read(response);
  } catch (err) {
    if (timedOut) {
      throw new Error(
        `No response from ${url} within ${RESPONSE_TIMEOUT_MS} ms`,
      );
    }
    throw err;
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
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
 * Loads the FastEnhancer worklet and model into the given audio context,
 * creates the worklet node and posts the model to it.
 *
 * It doesn't wait for the worklet's `ready` reply: the worklet may only run
 * once the audio context does (e.g., after a user gesture), so the caller
 * listens for `ready` and `error` on the node's port. The port isn't started
 * here, so those messages queue until the caller starts it.
 * The node starts with its own bypass on, so it processes nothing until
 * `set_bypass { enabled: false }` is posted.
 *
 * The caller bounds the load with `signal`: aborting it cancels the fetches
 * and rejects with a generic error (the caller knows the cause).
 * No node is returned once the signal has aborted.
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
  const prefix = `${opts.basePath.replace(/\/+$/, '')}/fe_${model}`;
  const variant = simd ? 'simd' : 'scalar';

  const [wasmBytes, exportMap, weightBytes] = await Promise.all([
    fetchAsset(`${prefix}_${variant}.wasm`, signal, (r) => r.arrayBuffer()),
    fetchAsset(
      `${prefix}_${variant}.exports.json`,
      signal,
      (r) => r.json() as Promise<Record<string, string>>,
    ),
    fetchAsset(`${prefix}_48k.bin`, signal, (r) => r.arrayBuffer()),
    addProcessorModule(ctx),
  ]);
  // `addModule` can't be aborted, so check before creating the node
  if (signal.aborted) throw new Error(ABORTED_MESSAGE);

  const node = new AudioWorkletNode(ctx, 'fastenhancer-processor', {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [1],
    // the processor reads the first channel only: downmix stereo input
    channelCount: 1,
    channelCountMode: 'explicit',
  });
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
  return node;
};
