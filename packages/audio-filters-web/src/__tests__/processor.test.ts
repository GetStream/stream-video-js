import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODEL } from '../stream/model';

const dir = join(__dirname, '..', 'stream');
const processorSource = readFileSync(join(dir, 'processor.js'), 'utf8');
const wasm = readFileSync(join(dir, 'models', MODEL, 'engine.wasm'));
const weights = readFileSync(join(dir, 'models', MODEL, 'weights.bin'));
const modelId = weights.readUInt32LE(8);

const HOP = 512;
const QUANTUM = 128;
/** The worklet's buffering on top of the engine's one-hop delay. */
const BUFFERING = HOP - QUANTUM;

type Message = { type: string; [key: string]: unknown };

type Processor = {
  port: { onmessage: (e: { data: unknown }) => void };
  process: (inputs: Float32Array[][], outputs: Float32Array[][]) => boolean;
};

/**
 * Evaluates the worklet source with stand-ins for the AudioWorklet scope,
 * and returns the processor with the messages it posts.
 */
const createProcessor = (clock: () => number = () => performance.now()) => {
  const messages: Message[] = [];
  let ProcessorClass: (new () => Processor) | undefined;
  class AudioWorkletProcessor {
    port = {
      onmessage: (() => {}) as (e: { data: unknown }) => void,
      postMessage: (message: Message) => messages.push(message),
    };
  }
  new Function(
    'registerProcessor',
    'AudioWorkletProcessor',
    'sampleRate',
    'currentTime',
    'performance',
    processorSource,
  )(
    (_: string, cls: new () => Processor) => (ProcessorClass = cls),
    AudioWorkletProcessor,
    48000,
    0,
    { now: clock },
  );
  const processor = new ProcessorClass!();
  const send = (data: unknown) => processor.port.onmessage({ data });
  const init = (weightBytes: Uint8Array = weights) =>
    send({
      type: 'init',
      wasmBytes: wasm.buffer.slice(
        wasm.byteOffset,
        wasm.byteOffset + wasm.byteLength,
      ),
      weightBytes: weightBytes.buffer.slice(
        weightBytes.byteOffset,
        weightBytes.byteOffset + weightBytes.byteLength,
      ),
      modelId,
    });
  /** Runs `input` through in render quanta, returns the output. */
  const run = (input: Float32Array) => {
    const output = new Float32Array(input.length);
    for (let i = 0; i < input.length; i += QUANTUM) {
      const out = new Float32Array(QUANTUM);
      processor.process([[input.subarray(i, i + QUANTUM)]], [[out]]);
      output.set(out, i);
    }
    return output;
  };
  return { processor, messages, send, init, run };
};

/** Deterministic noise bursts, 48 kHz. */
const signal = (frames: number) => {
  const x = new Float32Array(frames * HOP);
  let seed = 7;
  for (let i = 0; i < x.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const gain = Math.floor(i / 4800) % 2 ? 0.3 : 0.02;
    x[i] = (seed / 4294967296 - 0.5) * gain;
  }
  return x;
};

/** Runs the engine directly, frame by frame. */
const reference = (input: Float32Array) => {
  const ex = new WebAssembly.Instance(new WebAssembly.Module(wasm), {})
    .exports as Record<string, CallableFunction> & {
    memory: WebAssembly.Memory;
  };
  const ptr = ex.malloc(weights.length) as number;
  new Uint8Array(ex.memory.buffer).set(weights, ptr);
  const state = ex.fe_init(modelId, ptr, weights.length) as number;
  ex.free(ptr);
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i += HOP) {
    const inPtr = ex.fe_get_input_ptr(state) as number;
    const outPtr = ex.fe_get_output_ptr(state) as number;
    new Float32Array(ex.memory.buffer, inPtr, HOP).set(
      input.subarray(i, i + HOP),
    );
    ex.fe_process_inplace(state);
    output.set(new Float32Array(ex.memory.buffer, outPtr, HOP), i);
  }
  return output;
};

describe('noise cancellation worklet processor', () => {
  it('loads the vendored model and replies ready', () => {
    const { messages, init } = createProcessor();
    init();
    expect(messages).toEqual([{ type: 'ready', hopSize: HOP }]);
  });

  it('outputs the engine output, delayed by the worklet buffering', () => {
    const { init, run } = createProcessor();
    init();
    const input = signal(40);
    const output = run(input);
    const expected = reference(input);

    expect(output.every(Number.isFinite)).toBe(true);
    expect(output.subarray(0, BUFFERING).every((v) => v === 0)).toBe(true);
    for (let i = 0; i + BUFFERING < output.length; i += 997) {
      expect(output[i + BUFFERING]).toBeCloseTo(expected[i], 6);
    }
    // the model suppresses: less energy out than in
    const energy = (a: Float32Array) => a.reduce((s, v) => s + v * v, 0);
    expect(energy(output)).toBeLessThan(energy(input));
  });

  it('passes the input through, delayed by the buffering, while bypassed', () => {
    const { init, send, run } = createProcessor();
    init();
    send({ type: 'set_bypass', enabled: true });
    const input = signal(8);
    const output = run(input);
    expect(Array.from(output.subarray(BUFFERING))).toEqual(
      Array.from(input.subarray(0, input.length - BUFFERING)),
    );
  });

  it('passes the input through before the model is loaded', () => {
    const { run } = createProcessor();
    const input = signal(2);
    expect(Array.from(run(input))).toEqual(Array.from(input));
  });

  it('replies error for weights the engine rejects', () => {
    const { messages, init } = createProcessor();
    init(weights.subarray(0, 1000));
    expect(messages).toEqual([
      { type: 'error', message: expect.stringContaining('fe_init') },
    ]);
  });

  it('enters and leaves its passthrough on overruns', () => {
    // every clock read advances by `step`, so each frame takes `step` ms
    let t = 0;
    let step = 1;
    const { messages, init, run } = createProcessor(() => (t += step));
    init();
    step = 20; // over the 10.67 ms budget
    run(signal(5));
    expect(messages.at(-1)).toEqual({ type: 'auto_bypass', enabled: true });

    step = 1;
    run(signal(16 * 3));
    expect(messages.at(-1)).toEqual({ type: 'auto_bypass', enabled: false });
  });

  it('stops after destroy', () => {
    const { processor, messages, init, send } = createProcessor();
    init();
    send({ type: 'destroy' });
    expect(messages.at(-1)).toEqual({ type: 'destroyed' });
    const out = new Float32Array(QUANTUM);
    expect(processor.process([[new Float32Array(QUANTUM)]], [[out]])).toBe(
      false,
    );
  });
});
