/**
 * How long a model file request may wait for the server's response.
 * Only the response has to arrive in time: a slow download that is making
 * progress is bounded by the caller's overall deadline instead.
 */
const RESPONSE_TIMEOUT_MS = 10000;

const ABORTED_MESSAGE = 'Noise cancellation initialization was aborted';

/**
 * Fetches the given URL as an `ArrayBuffer`.
 * Fails when the server doesn't respond within `RESPONSE_TIMEOUT_MS`,
 * and when the caller's `signal` aborts.
 */
const fetchAsset = async (
  url: string,
  signal: AbortSignal,
): Promise<ArrayBuffer> => {
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
    return await response.arrayBuffer();
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

/**
 * Reads the model id from the header of a `FEW1` weights file: the magic,
 * a version and the model id, each 4 bytes.
 */
const readModelId = (weights: ArrayBuffer, url: string): number => {
  const header = new Uint8Array(weights, 0, Math.min(12, weights.byteLength));
  if (
    header.length < 12 ||
    String.fromCharCode(...header.subarray(0, 4)) !== 'FEW1'
  ) {
    throw new Error(`${url} is not a noise cancellation weights file`);
  }
  return new DataView(weights).getUint32(8, true);
};

const addProcessorModule = (ctx: AudioContext, url: string) =>
  ctx.audioWorklet.addModule(url);

/**
 * Loads the worklet and the model into the given audio context,
 * creates the worklet node and posts the model to it.
 *
 * It doesn't wait for the worklet's `ready` reply: the worklet may only run
 * once the audio context does (e.g., after a user gesture), so the caller
 * listens for `ready` and `error` on the node's port. The port isn't started
 * here, so those messages queue until the caller starts it.
 * The node starts with its bypass on, so it processes nothing until
 * `set_bypass { enabled: false }` is posted.
 *
 * The caller bounds the load with `signal`: aborting it cancels the fetches
 * and rejects with a generic error (the caller knows the cause).
 * No node is returned once the signal has aborted.
 * Only `signal.aborted` and the `abort` event are used, which older Safari
 * versions support too.
 */
export const createProcessorNode = async (
  ctx: AudioContext,
  opts: { basePath: string; model: string; signal: AbortSignal },
): Promise<AudioWorkletNode> => {
  const { signal } = opts;
  const base = opts.basePath.replace(/\/+$/, '');
  const prefix = `${base}/models/${opts.model}`;
  const weightsUrl = `${prefix}/weights.bin`;

  const [wasmBytes, weightBytes] = await Promise.all([
    fetchAsset(`${prefix}/engine.wasm`, signal),
    fetchAsset(weightsUrl, signal),
    addProcessorModule(ctx, `${base}/processor.js`),
  ]);
  // `addModule` can't be aborted, so check before creating the node
  if (signal.aborted) throw new Error(ABORTED_MESSAGE);
  const modelId = readModelId(weightBytes, weightsUrl);

  const node = new AudioWorkletNode(ctx, 'stream-noise-cancellation', {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [1],
    // the processor reads the first channel only: downmix stereo input
    channelCount: 1,
    channelCountMode: 'explicit',
  });
  node.port.postMessage({ type: 'init', wasmBytes, weightBytes, modelId }, [
    wasmBytes,
    weightBytes,
  ]);
  node.port.postMessage({ type: 'set_bypass', enabled: true });
  return node;
};
