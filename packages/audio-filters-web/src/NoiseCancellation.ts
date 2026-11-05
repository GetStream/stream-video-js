import {
  KrispNoiseCancellation,
  type KrispNoiseCancellationOptions,
} from './KrispNoiseCancellation';
import {
  FastEnhancerNoiseCancellation,
  type FastEnhancerNoiseCancellationOptions,
} from './FastEnhancerNoiseCancellation';
import type {
  Events,
  INoiseCancellation,
  NoiseCancellationConfiguration,
} from './INoiseCancellation';
import type { Tracer } from './tracer';

const engines = ['krisp', 'stream'] as const;

/**
 * The noise cancellation engines {@link NoiseCancellation} can run.
 */
export type NoiseCancellationEngine = (typeof engines)[number];

const DEFAULT_ENGINE: NoiseCancellationEngine = 'krisp';

/**
 * Options to pass to the NoiseCancellation instance.
 * The top-level options configure the Krisp engine.
 */
export type NoiseCancellationOptions = KrispNoiseCancellationOptions & {
  /**
   * Options for the `stream` (FastEnhancer) engine.
   */
  fastEnhancer?: FastEnhancerNoiseCancellationOptions;
};

/**
 * Noise Cancellation that runs the engine the call settings pick
 * (`extra_opts.noise_cancellation.engine`, applied through
 * {@link configure}), or Krisp when they don't pick one.
 *
 * The engine is created on the first {@link isSupported} or {@link init}
 * call and stays fixed from {@link init} until {@link dispose}. A different
 * engine configured in the meantime applies on the next `init`.
 */
export class NoiseCancellation implements INoiseCancellation {
  private readonly krispOptions: KrispNoiseCancellationOptions;
  private readonly fastEnhancerOptions?: FastEnhancerNoiseCancellationOptions;

  private configuration: NoiseCancellationConfiguration = {};
  private delegate?: INoiseCancellation;
  private delegateEngine?: NoiseCancellationEngine;
  private stopForwarding?: () => void;
  private initialized = false;
  private warnedEngine?: string;

  private readonly listeners: Partial<Record<keyof Events, Array<any>>> = {};

  /**
   * Constructs a new instance.
   */
  constructor({
    fastEnhancer,
    ...krispOptions
  }: NoiseCancellationOptions = {}) {
    this.krispOptions = krispOptions;
    this.fastEnhancerOptions = fastEnhancer;
  }

  /**
   * The engine the current configuration selects. A running engine keeps
   * running until {@link dispose}; a new engine applies on the next
   * {@link init}.
   */
  get engine(): NoiseCancellationEngine {
    return this.resolveEngine();
  }

  /**
   * Applies options from the call settings: the engine to run, and the
   * engine options. Options passed to the constructor take precedence.
   * Call it before {@link isSupported} and {@link init}.
   */
  configure = (configuration: NoiseCancellationConfiguration) => {
    this.configuration = configuration;
    const { engine } = configuration;
    if (engine && !this.isKnownEngine(engine) && engine !== this.warnedEngine) {
      this.warnedEngine = engine;
      console.warn(
        `Unknown noise cancellation engine "${engine}", using "${DEFAULT_ENGINE}"`,
      );
    }
    if (this.initialized) return;
    if (this.delegate && this.delegateEngine !== this.resolveEngine()) {
      this.dropDelegate();
    }
    this.delegate?.configure?.(configuration);
  };

  isSupported = () => this.getDelegate().isSupported();

  /**
   * Initializes the selected engine. When that fails, the engine is
   * discarded, so the next `init` picks the engine again.
   */
  init = async (options?: { tracer?: Tracer }) => {
    // a repeated init goes to the running engine, which reports it
    if (this.initialized && this.delegate) return this.delegate.init(options);
    const delegate = this.getDelegate();
    this.initialized = true;
    options?.tracer?.trace('noiseCancellation.engine', this.delegateEngine);
    try {
      await delegate.init(options);
    } catch (err) {
      if (this.delegate === delegate) {
        this.initialized = false;
        this.dropDelegate();
        delegate.dispose().catch((e) => {
          console.warn('Failed to dispose the noise cancellation engine', e);
        });
      }
      throw err;
    }
  };

  isEnabled = async () => (this.delegate ? this.delegate.isEnabled() : false);

  canAutoEnable = async () => {
    const canAutoEnable = this.delegate?.canAutoEnable;
    return canAutoEnable ? canAutoEnable() : true;
  };

  /**
   * Enables the running engine. Does nothing when no engine was created yet
   * or after {@link dispose}.
   */
  enable = async () => {
    await this.delegate?.enable();
  };

  /**
   * Disables the running engine. Does nothing when no engine was created yet
   * or after {@link dispose}.
   */
  disable = async () => {
    await this.delegate?.disable();
  };

  /**
   * Disposes the running engine. Its events, including the final `change`,
   * are forwarded until it is disposed. The next {@link isSupported} or
   * {@link init} picks the engine again.
   */
  dispose = async () => {
    const delegate = this.delegate;
    const stopForwarding = this.stopForwarding;
    this.stopForwarding = undefined;
    this.dropDelegate();
    this.initialized = false;
    try {
      await delegate?.dispose();
    } finally {
      stopForwarding?.();
    }
  };

  setSuppressionLevel = (level: number) => {
    this.requireDelegate().setSuppressionLevel(level);
  };

  toFilter = () => this.requireDelegate().toFilter();

  on = <E extends keyof Events, T = Events[E]>(event: E, callback: T) => {
    (this.listeners[event] ??= [] as T[]).push(callback);
    return () => {
      this.off(event, callback);
    };
  };

  off = <E extends keyof Events, T = Events[E]>(event: E, callback: T) => {
    const listeners = this.listeners[event] || [];
    this.listeners[event] = listeners.filter((cb) => cb !== callback);
  };

  private isKnownEngine = (engine: string): boolean =>
    engines.some((name) => name === engine.trim().toLowerCase());

  private resolveEngine = (): NoiseCancellationEngine => {
    const engine = this.configuration.engine?.trim().toLowerCase();
    return engines.find((name) => name === engine) ?? DEFAULT_ENGINE;
  };

  private requireDelegate = (): INoiseCancellation => {
    if (!this.delegate) throw new Error('NoiseCancellation is not initialized');
    return this.delegate;
  };

  private getDelegate = (): INoiseCancellation => {
    if (this.delegate) return this.delegate;
    const engine = this.resolveEngine();
    const delegate =
      engine === 'stream'
        ? new FastEnhancerNoiseCancellation(this.fastEnhancerOptions)
        : new KrispNoiseCancellation(this.krispOptions);
    delegate.configure?.(this.configuration);
    const forward =
      <E extends keyof Events>(event: E) =>
      (payload: Parameters<Events[E]>[0]) => {
        for (const listener of this.listeners[event] || []) listener(payload);
      };
    const offChange = delegate.on('change', forward('change'));
    const offOverload = delegate.on('overload', forward('overload'));
    this.stopForwarding = () => {
      offChange();
      offOverload();
    };
    this.delegate = delegate;
    this.delegateEngine = engine;
    return delegate;
  };

  private dropDelegate = () => {
    this.stopForwarding?.();
    this.stopForwarding = undefined;
    this.delegate = undefined;
    this.delegateEngine = undefined;
  };
}
