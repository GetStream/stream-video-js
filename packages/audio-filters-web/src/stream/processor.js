/**
 * The noise cancellation AudioWorkletProcessor. Runs the mol engine (the
 * FastEnhancer architecture, compiled to WebAssembly) on the audio thread.
 *
 * Loaded from a blob URL, so it can't import anything.
 *
 * Messages in:
 * - `{ type: 'init', wasmBytes, weightBytes, modelId }`: compiles the engine
 *   and loads the weights, replies `ready` or `error`.
 * - `{ type: 'set_bypass', enabled }`: passes the input through, unprocessed.
 * - `{ type: 'destroy' }`: releases the engine, replies `destroyed`.
 *
 * Messages out:
 * - `{ type: 'ready', hopSize }`, `{ type: 'error', message }`
 * - `{ type: 'auto_bypass', enabled }`: entering or leaving the passthrough
 *   it falls back to when frames take longer than real time.
 * - `{ type: 'process_error', message }`: a frame threw and passed through.
 * - `{ type: 'destroyed' }`
 *
 * The output lags the input by one hop (the engine) plus `hop - 128`
 * samples of buffering here.
 */

const QUANTUM = 128;
/** Consecutive overrunning frames that switch to passthrough. */
const OVERRUN_THRESHOLD = 5;
/** Consecutive in-budget probes that leave passthrough. */
const RECOVERY_THRESHOLD = 3;
/** In passthrough, every this many frames run the engine as a probe. */
const PROBE_INTERVAL = 16;

/**
 * `performance` is missing from some AudioWorklet scopes, and frozen in
 * others; fall back to `Date.now` then.
 */
const perf = typeof performance !== 'undefined' ? performance : undefined;
let perfFrozen = !perf;
let perfChecked = !perf;
let perfLast = 0;
let perfSameCount = 0;

const checkTimer = () => {
  if (perfChecked) return;
  const t = perf.now();
  if (t !== perfLast) {
    if (perfSameCount > 0 || perfLast > 0) perfChecked = true;
    perfLast = t;
    perfSameCount = 0;
    return;
  }
  perfSameCount++;
  if (perfSameCount >= 3) {
    perfFrozen = true;
    perfChecked = true;
  }
};

const now = () => {
  if (!perfFrozen) return perf.now();
  return typeof Date !== 'undefined' ? Date.now() : currentTime * 1000;
};

class NoiseCancellationProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.engine = undefined;
    this.state = 0;
    this.hopSize = 512;
    this.budgetMs = (this.hopSize / sampleRate) * 1000;
    this.destroyed = false;
    this.bypass = false;
    this.autoPassthrough = false;
    this.overruns = 0;
    this.successes = 0;
    this.probeCounter = 0;

    this.inputBuffer = new Float32Array(this.hopSize + QUANTUM);
    this.inputPos = 0;
    this.outputPos = 0;
    this.passthroughFrame = new Float32Array(this.hopSize);
    this.lastFramePassthrough = false;
    this.heap = undefined;

    this.port.onmessage = (e) => this.handleMessage(e.data);
  }

  handleMessage(msg) {
    switch (msg && msg.type) {
      case 'init':
        this.init(msg);
        break;
      case 'set_bypass':
        this.bypass = !!msg.enabled;
        break;
      case 'destroy':
        this.destroy();
        break;
    }
  }

  init({ wasmBytes, weightBytes, modelId }) {
    try {
      this.release();
      // Synchronous: the worklet scope has no `compileStreaming`, and the
      // module is small (~45 KB).
      const module = new WebAssembly.Module(wasmBytes);
      const engine = new WebAssembly.Instance(module, {}).exports;
      if (engine._initialize) engine._initialize();

      const weights = new Uint8Array(weightBytes);
      const ptr = engine.malloc(weights.length);
      if (!ptr) throw new Error('malloc failed for the weights');
      let state;
      try {
        new Uint8Array(engine.memory.buffer).set(weights, ptr);
        state = engine.fe_init(modelId, ptr, weights.length);
      } finally {
        engine.free(ptr);
      }
      if (!state) {
        throw new Error(`fe_init rejected the weights (model id ${modelId})`);
      }

      this.engine = engine;
      this.state = state;
      this.hopSize = engine.fe_get_hop_size(state);
      this.budgetMs = (this.hopSize / sampleRate) * 1000;
      this.inputBuffer = new Float32Array(this.hopSize + QUANTUM);
      this.inputPos = 0;
      this.outputPos = 0;
      this.passthroughFrame = new Float32Array(this.hopSize);
      this.autoPassthrough = false;
      this.overruns = 0;
      this.successes = 0;
      this.probeCounter = 0;
      this.port.postMessage({ type: 'ready', hopSize: this.hopSize });
    } catch (err) {
      this.release();
      this.port.postMessage({ type: 'error', message: String(err.message) });
    }
  }

  release() {
    if (this.engine && this.state) this.engine.fe_destroy(this.state);
    this.engine = undefined;
    this.state = 0;
    this.heap = undefined;
  }

  destroy() {
    this.release();
    this.destroyed = true;
    this.port.postMessage({ type: 'destroyed' });
  }

  /** A Float32Array view of the engine memory, renewed if it grew. */
  heapF32() {
    const { buffer } = this.engine.memory;
    if (!this.heap || this.heap.buffer !== buffer) {
      this.heap = new Float32Array(buffer);
    }
    return this.heap;
  }

  passThrough() {
    this.passthroughFrame.set(this.inputBuffer.subarray(0, this.hopSize));
    this.lastFramePassthrough = true;
  }

  /** Runs the engine on the buffered frame, returns its duration in ms. */
  runEngine() {
    this.lastFramePassthrough = false;
    const { engine, state, hopSize } = this;
    const t0 = now();
    const heap = this.heapF32();
    heap.set(
      this.inputBuffer.subarray(0, hopSize),
      engine.fe_get_input_ptr(state) >> 2,
    );
    engine.fe_process_inplace(state);
    return now() - t0;
  }

  processFrame() {
    if (this.bypass) {
      this.passThrough();
      return;
    }
    if (!this.autoPassthrough) {
      if (this.runEngine() <= this.budgetMs) {
        this.overruns = 0;
      } else if (++this.overruns >= OVERRUN_THRESHOLD) {
        this.autoPassthrough = true;
        this.overruns = 0;
        this.successes = 0;
        this.probeCounter = 0;
        this.port.postMessage({ type: 'auto_bypass', enabled: true });
      }
      return;
    }
    if (++this.probeCounter < PROBE_INTERVAL) {
      this.passThrough();
      return;
    }
    this.probeCounter = 0;
    if (this.runEngine() > this.budgetMs) {
      this.successes = 0;
    } else if (++this.successes >= RECOVERY_THRESHOLD) {
      this.autoPassthrough = false;
      this.successes = 0;
      this.overruns = 0;
      this.port.postMessage({ type: 'auto_bypass', enabled: false });
    }
  }

  process(inputs, outputs) {
    if (this.destroyed) return false;
    checkTimer();

    const output = outputs[0] && outputs[0][0];
    if (!output) return true;
    const input = inputs[0] && inputs[0][0];
    if (!this.engine || !input) {
      if (input) output.set(input);
      else output.fill(0);
      return true;
    }

    const { hopSize } = this;
    const len = Math.min(QUANTUM, output.length, input.length);
    this.inputBuffer.set(input.subarray(0, len), this.inputPos);
    this.inputPos += len;

    if (this.inputPos >= hopSize) {
      try {
        this.processFrame();
      } catch (err) {
        this.passThrough();
        this.port.postMessage({
          type: 'process_error',
          message: String((err && err.message) || err),
        });
      }
      this.inputBuffer.copyWithin(0, hopSize, this.inputPos);
      this.inputPos -= hopSize;
      this.outputPos = 0;
    }

    output.fill(0);
    const start = this.outputPos;
    const available = Math.max(0, Math.min(len, hopSize - start));
    if (available > 0) {
      if (this.lastFramePassthrough) {
        output.set(this.passthroughFrame.subarray(start, start + available));
      } else {
        const offset = this.engine.fe_get_output_ptr(this.state) >> 2;
        output.set(
          this.heapF32().subarray(offset + start, offset + start + available),
        );
      }
    }
    this.outputPos += len;
    return true;
  }
}

registerProcessor('stream-noise-cancellation', NoiseCancellationProcessor);
