import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketTransport } from '../internal/WebSocketTransport';
import { MockWebSocket } from './helpers/MockWebSocket';
import { ManualWebSocket } from './helpers/ManualWebSocket';

describe('WebSocketTransport', () => {
  beforeEach(() => {
    MockWebSocket.reset();
    ManualWebSocket.reset();
  });

  it('open() instantiates the WebSocket via the injected impl', () => {
    const t = new WebSocketTransport({
      url: 'wss://x',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    });
    t.open({
      onOpen: vi.fn(),
      onMessage: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
    });
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe('wss://x');
  });

  it('forwards open/message/close/error to the supplied handlers', () => {
    const onOpen = vi.fn();
    const onMessage = vi.fn();
    const onClose = vi.fn();
    const onError = vi.fn();
    const t = new WebSocketTransport({
      url: 'wss://x',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    });
    t.open({ onOpen, onMessage, onClose, onError });
    const ws = MockWebSocket.instances[0];

    ws.fireOpen();
    ws.fireMessage({ type: 'health.check' });
    ws.fireError();
    ws.fireClose(1006);

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('send() returns true on success, false when the underlying call throws', () => {
    const t = new WebSocketTransport({
      url: 'wss://x',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    });
    t.open({
      onOpen: vi.fn(),
      onMessage: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
    });
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    expect(t.send('payload')).toBe(true);
    ws.send.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    expect(t.send('payload')).toBe(false);
  });

  it('close() sends a close frame and resolves on onclose', async () => {
    const t = new WebSocketTransport({
      url: 'wss://x',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    });
    t.open({
      onOpen: vi.fn(),
      onMessage: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
    });
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    await expect(t.close(1000, 'manual')).resolves.toBeUndefined();
    expect(ws.close).toHaveBeenCalledWith(1000, 'manual');
  });

  it('close() resolves after the graceful timeout when the server never replies', async () => {
    vi.useFakeTimers();
    try {
      const t = new WebSocketTransport({
        url: 'wss://x',
        WebSocketImpl: ManualWebSocket as unknown as typeof WebSocket,
      });
      t.open({
        onOpen: vi.fn(),
        onMessage: vi.fn(),
        onClose: vi.fn(),
        onError: vi.fn(),
      });
      ManualWebSocket.instances[0].fireOpen();
      const closing = t.close(1000, 'manual', 100);
      let resolved = false;
      closing.then(() => {
        resolved = true;
      });
      await vi.advanceTimersByTimeAsync(50);
      expect(resolved).toBe(false);
      await vi.advanceTimersByTimeAsync(60);
      expect(resolved).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('close() is idempotent — second call returns the same promise', async () => {
    const t = new WebSocketTransport({
      url: 'wss://x',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    });
    t.open({
      onOpen: vi.fn(),
      onMessage: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
    });
    MockWebSocket.instances[0].fireOpen();
    const a = t.close(1000, 'manual');
    const b = t.close(1000, 'manual');
    expect(a).toBe(b);
    await a;
  });

  it('close() on an already-closed (or never-opened) WS resolves immediately', async () => {
    const t = new WebSocketTransport({
      url: 'wss://x',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    });
    t.open({
      onOpen: vi.fn(),
      onMessage: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
    });
    // never fired open — readyState stays CONNECTING
    await expect(t.close(1000, 'manual')).resolves.toBeUndefined();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
