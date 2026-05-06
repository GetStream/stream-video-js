import type { ScopedLogger } from '../../../logger';
import type {
  AllClientEvents,
  AllClientEventTypes,
  ClientEventListener,
  StreamVideoEvent,
} from '../types';

type ListenerMap = Partial<
  Record<AllClientEventTypes, ClientEventListener<AllClientEventTypes>[]>
>;

/**
 * Typed event dispatcher with per-listener error isolation. A listener that
 * throws is logged at error level and never aborts delivery to subsequent
 * listeners.
 */
export class EventDispatcher {
  private logger: ScopedLogger;
  private listeners: ListenerMap = {};

  constructor(args: { logger: ScopedLogger }) {
    this.logger = args.logger;
  }

  on = <E extends keyof AllClientEvents>(
    name: E,
    cb: ClientEventListener<E>,
  ): (() => void) => {
    const list = (this.listeners[name] ??= []) as ClientEventListener<E>[];
    list.push(cb);
    this.logger.debug(`Adding listener for ${String(name)} event`);
    return () => this.off(name, cb);
  };

  off = <E extends keyof AllClientEvents>(
    name: E,
    cb: ClientEventListener<E>,
  ): void => {
    this.logger.debug(`Removing listener for ${String(name)} event`);
    const current = this.listeners[name];
    if (!current) return;
    this.listeners[name] = current.filter(
      (l) => l !== cb,
    ) as ClientEventListener<AllClientEventTypes>[];
  };

  dispatch = (event: StreamVideoEvent): void => {
    this.logger.debug(`Dispatching event: ${event.type}`, event);
    const all = (this.listeners.all ?? []).slice();
    const typed = (this.listeners[event.type] ?? []).slice();
    for (const listener of all) {
      try {
        listener(event);
      } catch (e) {
        this.logger.error(`listener for 'all' threw on ${event.type}`, e);
      }
    }
    for (const listener of typed) {
      try {
        listener(event);
      } catch (e) {
        this.logger.error(`listener for '${event.type}' threw`, e);
      }
    }
  };

  clear = (): void => {
    this.listeners = {};
  };
}
