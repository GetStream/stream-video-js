import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NoiseCancellationConfiguration } from '../INoiseCancellation';

type Listener = (payload: unknown) => void;

/**
 * A stand-in engine that records how the router drives it.
 */
class EngineStub {
  static instances: EngineStub[] = [];
  readonly engine: string;
  readonly options: unknown;
  model?: string;
  readonly listeners: Record<string, Listener[]> = {};
  configuration?: NoiseCancellationConfiguration;

  isSupported = vi.fn(() => true);
  init = vi.fn(async () => {});
  isEnabled = vi.fn(async () => true);
  canAutoEnable = vi.fn(async () => false);
  enable = vi.fn(async () => {});
  disable = vi.fn(async () => {});
  dispose = vi.fn(async () => {});
  setSuppressionLevel = vi.fn();
  toFilter = vi.fn(() => (ms: MediaStream) => ({ output: ms }));
  configure = vi.fn((configuration: NoiseCancellationConfiguration) => {
    this.configuration = configuration;
  });

  constructor(engine: string, options: unknown) {
    this.engine = engine;
    this.options = options;
    EngineStub.instances.push(this);
  }

  on = (event: string, callback: Listener) => {
    (this.listeners[event] ??= []).push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback,
      );
    };
  };

  off = () => {};

  emit = (event: string, payload: unknown) => {
    this.listeners[event]?.forEach((listener) => listener(payload));
  };
}

vi.mock('../KrispNoiseCancellation', () => ({
  KrispNoiseCancellation: class extends EngineStub {
    constructor(options: unknown) {
      super('krisp', options);
    }
  },
}));

vi.mock('../FastEnhancerNoiseCancellation', () => ({
  FastEnhancerNoiseCancellation: class extends EngineStub {
    constructor(options: unknown) {
      super('stream', options);
    }
  },
}));

const { NoiseCancellation } = await import('../NoiseCancellation');

const lastEngine = () => EngineStub.instances[EngineStub.instances.length - 1];

describe('NoiseCancellation', () => {
  beforeEach(() => {
    EngineStub.instances = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs Krisp when no engine is configured', async () => {
    const nc = new NoiseCancellation();
    expect(nc.engine).toBe('krisp');
    await nc.init();
    expect(EngineStub.instances).toHaveLength(1);
    expect(lastEngine().engine).toBe('krisp');
    expect(lastEngine().init).toHaveBeenCalled();
  });

  it('reports the running engine model', async () => {
    const nc = new NoiseCancellation();
    expect(nc.model).toBeUndefined();

    await nc.init();
    lastEngine().model = 'krisp-nc-o-med-v7';
    expect(nc.model).toBe('krisp-nc-o-med-v7');

    await nc.dispose();
    expect(nc.model).toBeUndefined();
  });

  it('runs the configured engine', async () => {
    const nc = new NoiseCancellation();
    nc.configure({ engine: 'stream' });
    expect(nc.engine).toBe('stream');
    expect(nc.isSupported()).toBe(true);
    await nc.init();
    expect(EngineStub.instances).toHaveLength(1);
    expect(lastEngine().engine).toBe('stream');
  });

  it('runs the default engine when the call settings select none', async () => {
    const nc = new NoiseCancellation({ defaultEngine: 'stream' });
    nc.configure({});
    expect(nc.engine).toBe('stream');
    await nc.init();
    expect(lastEngine().engine).toBe('stream');
  });

  it('lets the call settings override the default engine', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const nc = new NoiseCancellation({ defaultEngine: 'stream' });
    nc.configure({ engine: 'krisp' });
    expect(nc.engine).toBe('krisp');
    nc.configure({ engine: 'foo' });
    expect(nc.engine).toBe('stream');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('keeps defaultEngine out of the Krisp options', () => {
    const nc = new NoiseCancellation({
      defaultEngine: 'krisp',
      withSafariSupport: true,
    });
    nc.isSupported();
    expect(lastEngine().options).toEqual({ withSafariSupport: true });
  });

  it('falls back to Krisp for an unknown engine', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const nc = new NoiseCancellation();
    nc.configure({ engine: 'foo' });
    await nc.init();
    expect(lastEngine().engine).toBe('krisp');
    expect(warn).toHaveBeenCalled();
  });

  it('routes the top-level options to Krisp and fastEnhancer to FastEnhancer', () => {
    const krisp = new NoiseCancellation({
      basePath: '/krisp',
      fastEnhancer: { basePath: '/fe', model: 'base' },
    });
    krisp.isSupported();
    expect(lastEngine().options).toEqual({ basePath: '/krisp' });

    const fastEnhancer = new NoiseCancellation({
      basePath: '/krisp',
      fastEnhancer: { basePath: '/fe', model: 'base' },
    });
    fastEnhancer.configure({ engine: 'stream' });
    fastEnhancer.isSupported();
    expect(lastEngine().options).toEqual({ basePath: '/fe', model: 'base' });
  });

  it('passes the configuration on to the engine', () => {
    const nc = new NoiseCancellation();
    const configuration = {
      engine: 'krisp',
      withSafariSupport: true,
      modelPath: 'https://cdn.example.com/model.kef',
    };
    nc.configure(configuration);
    nc.isSupported();
    expect(lastEngine().configuration).toEqual(configuration);
  });

  it('switches the engine when it changes before init', async () => {
    const nc = new NoiseCancellation();
    nc.isSupported();
    expect(lastEngine().engine).toBe('krisp');

    nc.configure({ engine: 'stream' });
    await nc.init();
    expect(EngineStub.instances).toHaveLength(2);
    expect(lastEngine().engine).toBe('stream');
    expect(lastEngine().init).toHaveBeenCalled();
    expect(EngineStub.instances[0].init).not.toHaveBeenCalled();
  });

  it.each([
    ['krisp', 'stream'],
    ['stream', 'krisp'],
  ] as const)(
    'reports the running %s engine until dispose when %s is configured',
    async (initialEngine, nextEngine) => {
      const nc = new NoiseCancellation({ defaultEngine: initialEngine });
      await nc.init();
      const runningEngine = lastEngine();

      nc.configure({ engine: nextEngine });
      expect(nc.engine).toBe(initialEngine);
      await nc.enable();
      expect(runningEngine.enable).toHaveBeenCalled();
      expect(EngineStub.instances).toHaveLength(1);

      await nc.dispose();
      expect(runningEngine.dispose).toHaveBeenCalled();
      expect(nc.engine).toBe(nextEngine);
      await nc.init();
      expect(EngineStub.instances).toHaveLength(2);
      expect(lastEngine().engine).toBe(nextEngine);
      expect(nc.engine).toBe(nextEngine);
    },
  );

  it('delegates the API to the running engine', async () => {
    const nc = new NoiseCancellation();
    expect(await nc.isEnabled()).toBe(false);

    await nc.init();
    const engine = lastEngine();
    await nc.enable();
    await nc.disable();
    nc.setSuppressionLevel(42);
    nc.toFilter();
    expect(await nc.isEnabled()).toBe(true);
    expect(await nc.canAutoEnable()).toBe(false);
    expect(engine.enable).toHaveBeenCalled();
    expect(engine.disable).toHaveBeenCalled();
    expect(engine.setSuppressionLevel).toHaveBeenCalledWith(42);
    expect(engine.toFilter).toHaveBeenCalled();
  });

  it('forwards the engine events to listeners registered before init', async () => {
    const nc = new NoiseCancellation();
    const onChange = vi.fn();
    const onOverload = vi.fn();
    nc.on('change', onChange);
    const offOverload = nc.on('overload', onOverload);

    await nc.init();
    lastEngine().emit('change', true);
    lastEngine().emit('overload', { willRestore: true, overflowCount: 1 });
    expect(onChange).toHaveBeenCalledWith(true);
    expect(onOverload).toHaveBeenCalledWith({
      willRestore: true,
      overflowCount: 1,
    });

    offOverload();
    lastEngine().emit('overload', { willRestore: false, overflowCount: 2 });
    expect(onOverload).toHaveBeenCalledTimes(1);
  });

  it('stops forwarding the events of a disposed engine', async () => {
    const nc = new NoiseCancellation();
    const onChange = vi.fn();
    nc.on('change', onChange);
    await nc.init();
    const engine = lastEngine();
    await nc.dispose();

    engine.emit('change', false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('matches the engine case-insensitively and warns once for an unknown one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const nc = new NoiseCancellation();
    nc.configure({ engine: ' Stream ' });
    expect(nc.engine).toBe('stream');
    expect(warn).not.toHaveBeenCalled();

    nc.configure({ engine: 'foo' });
    nc.configure({ engine: 'foo' });
    expect(nc.engine).toBe('krisp');
    expect(nc.engine).toBe('krisp');
    nc.isSupported();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('forwards the final change event while disposing', async () => {
    const nc = new NoiseCancellation();
    const onChange = vi.fn();
    nc.on('change', onChange);
    await nc.init();
    const engine = lastEngine();
    engine.dispose.mockImplementation(async () => {
      engine.emit('change', false);
    });

    await nc.dispose();
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('discards an engine that fails to initialize', async () => {
    const nc = new NoiseCancellation();
    nc.configure({ engine: 'stream' });
    nc.isSupported();
    const failed = lastEngine();
    failed.init.mockRejectedValueOnce(new Error('model fetch failed'));

    await expect(nc.init()).rejects.toThrow('model fetch failed');
    expect(failed.dispose).toHaveBeenCalled();

    nc.configure({ engine: 'krisp' });
    await nc.init();
    expect(EngineStub.instances).toHaveLength(2);
    expect(lastEngine().engine).toBe('krisp');
    expect(lastEngine().init).toHaveBeenCalled();
  });

  it('sends a repeated init to the running engine', async () => {
    const nc = new NoiseCancellation();
    await nc.init();
    await nc.init();
    expect(EngineStub.instances).toHaveLength(1);
    expect(lastEngine().init).toHaveBeenCalledTimes(2);
  });

  it('creates no engine for calls made after dispose', async () => {
    const nc = new NoiseCancellation();
    await nc.init();
    await nc.dispose();

    await nc.enable();
    await nc.disable();
    expect(await nc.canAutoEnable()).toBe(true);
    expect(await nc.isEnabled()).toBe(false);
    expect(() => nc.toFilter()).toThrow('NoiseCancellation is not initialized');
    expect(() => nc.setSuppressionLevel(10)).toThrow(
      'NoiseCancellation is not initialized',
    );
    expect(EngineStub.instances).toHaveLength(1);
  });
});
