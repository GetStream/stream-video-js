import {
  addConnectionEventListeners,
  removeConnectionEventListeners,
} from '../utils';

export type NetworkStatusBridgeArgs = {
  /** Defaults to addConnectionEventListeners. Injected for testability. */
  register?: (cb: (event: Event) => void) => void;
  /** Defaults to removeConnectionEventListeners. Injected for testability. */
  unregister?: (cb: (event: Event) => void) => void;
  onOnline: () => void;
  onOffline: () => void;
};

/**
 * Single owner around addConnectionEventListeners / removeConnectionEventListeners.
 *
 * The legacy code registered two parallel handlers (one in StreamClient for
 * `network.changed`, another inside StableWSConnection to drive reconnect).
 * The bridge collapses those into one registration; the parent decides what
 * to do in the supplied callbacks.
 */
export class NetworkStatusBridge {
  private register: (cb: (event: Event) => void) => void;
  private unregister: (cb: (event: Event) => void) => void;
  private onOnline: () => void;
  private onOffline: () => void;
  private attached = false;

  constructor(args: NetworkStatusBridgeArgs) {
    this.register = args.register ?? addConnectionEventListeners;
    this.unregister = args.unregister ?? removeConnectionEventListeners;
    this.onOnline = args.onOnline;
    this.onOffline = args.onOffline;
  }

  private handler = (event: Event): void => {
    if (event.type === 'online') this.onOnline();
    else if (event.type === 'offline') this.onOffline();
  };

  attach = (): void => {
    if (this.attached) return;
    this.register(this.handler);
    this.attached = true;
  };

  detach = (): void => {
    if (!this.attached) return;
    this.unregister(this.handler);
    this.attached = false;
  };
}
