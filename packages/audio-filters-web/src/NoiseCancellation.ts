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

/**
 * The noise cancellation engines {@link NoiseCancellation} can run.
 */
export type NoiseCancellationEngine = 'krisp' | 'stream';

const DEFAULT_ENGINE: NoiseCancellationEngine = 'krisp';

const engines: ReadonlyArray<string> = ['krisp', 'stream'];

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
    if (this.initialized) return;
    if (this.delegate && this.delegateEngine !== this.resolveEngine()) {
      this.dropDelegate();
    }
    this.delegate?.configure?.(configuration);
  };

  isSupported = () => this.getDelegate().isSupported();

  init = async (options?: { tracer?: Tracer }) => {
    const delegate = this.getDelegate();
    this.initialized = true;
    options?.tracer?.trace('noiseCancellation.engine', this.delegateEngine);
    await delegate.init(options);
  };

  isEnabled = async () => (this.delegate ? this.delegate.isEnabled() : false);

  canAutoEnable = async () => {
    const { canAutoEnable } = this.getDelegate();
    return canAutoEnable ? canAutoEnable() : true;
  };

  enable = () => this.getDelegate().enable();

  disable = () => this.getDelegate().disable();

  /**
   * Disposes the running engine. The next {@link isSupported} or
   * {@link init} picks the engine again.
   */
  dispose = async () => {
    const delegate = this.delegate;
    this.dropDelegate();
    this.initialized = false;
    await delegate?.dispose();
  };

  setSuppressionLevel = (level: number) => {
    this.getDelegate().setSuppressionLevel(level);
  };

  toFilter = () => this.getDelegate().toFilter();

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

  private resolveEngine = (): NoiseCancellationEngine => {
    const { engine } = this.configuration;
    if (!engine) return DEFAULT_ENGINE;
    if (engines.includes(engine)) return engine as NoiseCancellationEngine;
    console.warn(
      `Unknown noise cancellation engine "${engine}", using "${DEFAULT_ENGINE}"`,
    );
    return DEFAULT_ENGINE;
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
