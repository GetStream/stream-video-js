export type WebSocketHandlers = {
  onOpen: () => void;
  onMessage: (event: MessageEvent) => void;
  onClose: (event: CloseEvent) => void;
  onError: (event: Event) => void;
};

/**
 * Minimal WebSocket wrapper holding no application state. Construction takes
 * the URL and a `WebSocketImpl` constructor (defaults to the global
 * WebSocket); `open()` actually creates the underlying socket and binds
 * handlers.
 */
export class WebSocketTransport {
  private url: string;
  private WebSocketImpl: typeof WebSocket;
  private ws?: WebSocket;
  private closePromise?: Promise<void>;

  constructor(args: { url: string; WebSocketImpl: typeof WebSocket }) {
    this.url = args.url;
    this.WebSocketImpl = args.WebSocketImpl;
  }

  open = (handlers: WebSocketHandlers): void => {
    const ws = new this.WebSocketImpl(this.url);
    this.ws = ws;
    ws.onopen = () => handlers.onOpen();
    ws.onmessage = (event) => handlers.onMessage(event);
    ws.onclose = (event) => handlers.onClose(event);
    ws.onerror = (event) => handlers.onError(event);
  };

  /** Returns true if `send()` succeeded; false if the underlying call threw. */
  send = (payload: string): boolean => {
    try {
      this.ws?.send(payload);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Closes the underlying socket and resolves when the close completes (or
   * after `gracefulTimeoutMs` if the server never replies). Idempotent: a
   * second call returns the same promise.
   */
  close = (
    code: number,
    reason: string,
    gracefulTimeoutMs = 1000,
  ): Promise<void> => {
    if (this.closePromise) return this.closePromise;
    const ws = this.ws;
    this.closePromise = new Promise<void>((resolve) => {
      if (!ws || ws.readyState !== ws.OPEN) {
        resolve();
        return;
      }
      const done = () => resolve();
      ws.onclose = done;
      setTimeout(done, gracefulTimeoutMs);
      try {
        ws.close(code, reason);
      } catch {
        // already closed: fall through
      }
    });
    return this.closePromise;
  };

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}
