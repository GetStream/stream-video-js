import { vi } from 'vitest';

/**
 * Test double for the WebSocket constructor that does NOT auto-fire `onclose`
 * when `close()` is called. Tests can drive the close manually via
 * `fireClose()` to exercise races (e.g. `disconnect()` while the WS is
 * mid-flight).
 */
export class ManualWebSocket {
  static instances: ManualWebSocket[] = [];
  static reset = (): void => {
    ManualWebSocket.instances = [];
  };

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = ManualWebSocket.CONNECTING;
  readonly OPEN = ManualWebSocket.OPEN;
  readonly CLOSING = ManualWebSocket.CLOSING;
  readonly CLOSED = ManualWebSocket.CLOSED;

  url: string;
  readyState: number = ManualWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  send = vi.fn();
  close = vi.fn();

  constructor(url: string) {
    this.url = url;
    ManualWebSocket.instances.push(this);
  }

  fireOpen = (): void => {
    this.readyState = ManualWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  };

  fireMessage = (data: unknown): void => {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
  };

  fireClose = (code = 1006, reason = '', wasClean = false): void => {
    this.readyState = ManualWebSocket.CLOSED;
    this.onclose?.({ code, reason, wasClean } as CloseEvent);
  };

  fireError = (): void => {
    this.onerror?.(new Event('error'));
  };
}
