import { ScopedLogger, videoLoggerSystem } from '../logger';

export type EventMap = Record<string, unknown>;

export type Listener<P> = (payload: P) => void | Promise<void>;

export type AnyListener<M extends EventMap> = <E extends keyof M>(
  event: E,
  payload: M[E],
) => void | Promise<void>;

/**
 * Tiny, type-safe event emitter.
 *
 * Usage styles:
 * - compose: `private readonly events = new TypedEventEmitter<MyMap>()`
 * - extend:  `class Foo extends TypedEventEmitter<MyMap> {}`
 *
 * Listener exceptions (sync throw or rejected promise) are caught and logged,
 * so one bad listener cannot break dispatch for the rest.
 */
export class TypedEventEmitter<M extends EventMap> {
  private readonly emitterLogger: ScopedLogger;
  private readonly byEvent = new Map<keyof M, Set<Listener<any>>>();
  private readonly anyListeners = new Set<AnyListener<M>>();

  constructor(loggerScope = 'TypedEventEmitter') {
    this.emitterLogger = videoLoggerSystem.getLogger(loggerScope);
  }

  on<E extends keyof M>(event: E, fn: Listener<M[E]>): () => void {
    let listeners = this.byEvent.get(event);
    if (!listeners) {
      listeners = new Set();
      this.byEvent.set(event, listeners);
    }
    listeners.add(fn as Listener<any>);
    return () => this.off(event, fn);
  }

  once<E extends keyof M>(event: E, fn: Listener<M[E]>): () => void {
    const wrapper: Listener<M[E]> = (payload) => {
      this.off(event, wrapper);
      return fn(payload);
    };
    return this.on(event, wrapper);
  }

  off<E extends keyof M>(event: E, fn: Listener<M[E]>): void {
    const listeners = this.byEvent.get(event);
    if (!listeners) return;
    listeners.delete(fn as Listener<any>);
    if (listeners.size === 0) this.byEvent.delete(event);
  }

  onAny(fn: AnyListener<M>): () => void {
    this.anyListeners.add(fn);
    return () => {
      this.anyListeners.delete(fn);
    };
  }

  emit<E extends keyof M>(event: E, payload: M[E]): void {
    const listeners = this.byEvent.get(event);
    if (listeners && listeners.size > 0) {
      for (const listener of [...listeners]) {
        this.invoke(() => listener(payload), event);
      }
    }
    if (this.anyListeners.size > 0) {
      for (const listener of [...this.anyListeners]) {
        this.invoke(() => listener(event, payload), event);
      }
    }
  }

  removeAllListeners(event?: keyof M): void {
    if (event === undefined) {
      this.byEvent.clear();
      this.anyListeners.clear();
    } else {
      this.byEvent.delete(event);
    }
  }

  private invoke(run: () => void | Promise<void>, event: keyof M): void {
    try {
      const result = run();
      if (result && typeof (result as Promise<void>).then === 'function') {
        (result as Promise<void>).catch((err) => {
          this.emitterLogger.warn(
            `Listener for '${String(event)}' rejected`,
            err,
          );
        });
      }
    } catch (err) {
      this.emitterLogger.warn(`Listener for '${String(event)}' threw`, err);
    }
  }
}
