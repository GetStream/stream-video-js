import { vi } from 'vitest';

/**
 * Test double for the WebSocket constructor. Each instance is recorded on
 * `MockWebSocket.instances` so tests can drive lifecycle events via the
 * `fireOpen / fireMessage / fireClose / fireError` helpers.
 *
 * Call `MockWebSocket.reset()` in `beforeEach` to clear the instance list.
 */
export class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static reset = (): void => {
    MockWebSocket.instances = [];
  };

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  // mirror the static enum on the prototype for `ws.readyState !== ws.OPEN`
  // checks inside the production code under test.
  readonly CONNECTING = MockWebSocket.CONNECTING;
  readonly OPEN = MockWebSocket.OPEN;
  readonly CLOSING = MockWebSocket.CLOSING;
  readonly CLOSED = MockWebSocket.CLOSED;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  send = vi.fn();

  close = vi.fn((code?: number, reason?: string) => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({
      code: code ?? 1000,
      reason: reason ?? '',
      wasClean: true,
    } as CloseEvent);
  });

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  fireOpen = (): void => {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  };

  fireMessage = (data: unknown): void => {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
  };

  fireRawMessage = (data: unknown): void => {
    this.onmessage?.({ data } as MessageEvent);
  };

  fireClose = (code = 1006, reason = '', wasClean = false): void => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason, wasClean } as CloseEvent);
  };

  fireError = (): void => {
    this.onerror?.(new Event('error'));
  };
}
