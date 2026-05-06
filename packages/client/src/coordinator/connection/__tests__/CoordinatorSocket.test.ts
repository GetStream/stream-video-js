import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoordinatorSocket } from '../internal/CoordinatorSocket';
import { ConnectionIdGate } from '../internal/ConnectionIdGate';
import { EventDispatcher } from '../internal/EventDispatcher';
import { WebSocketTransport } from '../internal/WebSocketTransport';
import { TokenManager } from '../token_manager';
import { WebSocketConnectionError } from '../types';
import { MockWebSocket } from './helpers/MockWebSocket';
import { ManualWebSocket } from './helpers/ManualWebSocket';
import { createFakeLogger } from './helpers/fakeLogger';
import { createFakeWorkerTimer } from './helpers/fakeTimers';

const setupSocket = (overrides?: {
  WebSocketImpl?: typeof WebSocket;
  authMessage?: string;
  staticToken?: boolean;
  authHandshakeTimeoutMs?: number;
  defaultWsTimeoutMs?: number;
  unhealthyDispatchDelayMs?: number;
  pingIntervalMs?: number;
  healthTimeoutMs?: number;
}) => {
  const logger = createFakeLogger();
  const eventDispatcher = new EventDispatcher({ logger });
  const gate = new ConnectionIdGate();
  const tokenManager = new TokenManager(
    overrides?.staticToken ? 'server-secret' : undefined,
  );
  // Force tokenManager to either static or pretend a token is loaded.
  if (overrides?.staticToken) {
    // Skip validation by setting state directly.
    (tokenManager as unknown as { token: string }).token = 'static-token';
    (tokenManager as unknown as { type: string }).type = 'static';
  } else {
    (tokenManager as unknown as { token: string }).token = 'jwt-token';
    (tokenManager as unknown as { type: string }).type = 'provider';
    (
      tokenManager as unknown as { tokenProvider: () => Promise<string> }
    ).tokenProvider = async () => 'jwt-token';
  }

  const WebSocketImpl =
    overrides?.WebSocketImpl ?? (MockWebSocket as unknown as typeof WebSocket);

  const transportFactory = (url: string) =>
    new WebSocketTransport({ url, WebSocketImpl });

  const socket = new CoordinatorSocket({
    urlBuilder: () => 'wss://coordinator/connect',
    authMessageBuilder: () => overrides?.authMessage ?? '{"auth":"msg"}',
    tokenManager,
    eventDispatcher,
    gate,
    transportFactory,
    timers: createFakeWorkerTimer(),
    getClientId: () => 'client-1',
    logger,
    options: {
      pingIntervalMs: overrides?.pingIntervalMs ?? 25000,
      healthTimeoutMs: overrides?.healthTimeoutMs ?? 35000,
      unhealthyDispatchDelayMs: overrides?.unhealthyDispatchDelayMs ?? 5000,
      defaultWsTimeoutMs: overrides?.defaultWsTimeoutMs ?? 1000,
      authHandshakeTimeoutMs: overrides?.authHandshakeTimeoutMs ?? 1000,
      disconnectTimeoutMs: 100,
    },
  });

  return { socket, eventDispatcher, gate, tokenManager, logger };
};

const connectedEvent = (id = 'conn-1') => ({
  type: 'connection.ok',
  connection_id: id,
  created_at: new Date().toISOString(),
  me: { id: 'jane' },
});

describe('CoordinatorSocket', () => {
  beforeEach(() => {
    MockWebSocket.reset();
    ManualWebSocket.reset();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(0);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('connect resolves with ConnectedEvent when server replies connection.ok', async () => {
    const { socket, gate } = setupSocket();
    gate.arm();
    const connectPromise = socket.connect();
    // Yield so runHandshake's async prologue runs and creates the WS.
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-id-A'));
    const result = await connectPromise;
    expect(result?.connection_id).toBe('conn-id-A');
    expect(socket.isHealthy()).toBe(true);
    expect(socket.getConnectionId()).toBe('conn-id-A');
    await expect(gate.await()).resolves.toBe('conn-id-A');
  });

  it('connect rejects with isWSFailure=false when server sends connection.error during handshake', async () => {
    const { socket, gate } = setupSocket();
    gate.arm();
    const connectPromise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage({
      type: 'connection.error',
      connection_id: 'x',
      created_at: new Date().toISOString(),
      error: { code: 4, message: 'auth failed', StatusCode: 0 },
    });
    await expect(connectPromise).rejects.toBeInstanceOf(
      WebSocketConnectionError,
    );
    await expect(gate.await()).rejects.toBeInstanceOf(WebSocketConnectionError);
  });

  it('connection.changed:true is dispatched BEFORE the connection.ok event (review fix)', async () => {
    const { socket, eventDispatcher, gate } = setupSocket();
    gate.arm();
    const order: string[] = [];
    eventDispatcher.on('connection.changed', (e) =>
      order.push(`changed:${e.online}`),
    );
    eventDispatcher.on('connection.ok', () => order.push('ok'));
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-1'));
    await promise;
    expect(order).toEqual(['changed:true', 'ok']);
  });

  it('WS_CLOSED_SUCCESS rejects the handshake but does NOT call gate.reject directly (close path)', async () => {
    const { socket, gate } = setupSocket();
    gate.arm();
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireClose(1000, 'auth rejected', true);
    // The handshake error propagates via runHandshake's catch which rejects the gate.
    await expect(promise).rejects.toBeInstanceOf(WebSocketConnectionError);
    await expect(gate.await()).rejects.toBeInstanceOf(WebSocketConnectionError);
  });

  it('abnormal close rejects the gate with isWSFailure:true (F12)', async () => {
    const { socket, eventDispatcher, gate } = setupSocket();
    gate.arm();
    const connection = socket.connect().catch(() => {});
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-A'));
    await connection;
    expect(socket.isHealthy()).toBe(true);

    const onChanged = vi.fn();
    eventDispatcher.on('connection.changed', onChanged);

    ws.fireClose(1006, 'abnormal');
    // gate.reject is called synchronously during onclose.
    await expect(gate.await()).rejects.toMatchObject({ isWSFailure: true });
  });

  it('handleOnline triggers reconnect only when not healthy', async () => {
    const { socket, gate } = setupSocket();
    gate.arm();
    const connection = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-A'));
    await connection;

    socket.handleOnline();
    // Healthy path: no new transport.
    expect(MockWebSocket.instances).toHaveLength(1);

    // Force unhealthy and call online again: it should schedule a reconnect.
    ws.fireClose(1006, 'abnormal');
    socket.handleOnline();
    // Allow the scheduled 10ms reconnect to fire.
    await vi.advanceTimersByTimeAsync(20);
    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(2);
  });

  it('handleOffline marks unhealthy and dispatches connection.changed:false immediately', async () => {
    const { socket, eventDispatcher, gate } = setupSocket();
    gate.arm();
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-1'));
    await promise;

    const onChanged = vi.fn();
    eventDispatcher.on('connection.changed', onChanged);
    socket.handleOffline();
    expect(onChanged).toHaveBeenCalledWith({
      type: 'connection.changed',
      online: false,
    });
    expect(socket.isHealthy()).toBe(false);
  });

  it('mid-stream connection.error with code 40 (non-static) schedules reconnect with refreshToken (F7)', async () => {
    const { socket, eventDispatcher, gate, tokenManager, logger } = setupSocket(
      { staticToken: false },
    );
    gate.arm();
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-1'));
    await promise;

    // Spy: provider invocation count on tokenManager.loadToken
    const loadTokenSpy = vi.spyOn(tokenManager, 'loadToken');

    // Mid-stream connection.error (code 40) expected to fire refresh.
    // Note: today's quirk (F13) means the FIRST mid-stream connection.error is
    // silently consumed by the handshake-error guard (because
    // isConnectionOpenResolved is still false after connection.ok). Send TWO
    // errors to exercise the reconnect path.
    ws.fireMessage({
      type: 'connection.error',
      connection_id: 'x',
      created_at: new Date().toISOString(),
      error: { code: 40, message: 'expired', StatusCode: 0 },
    });
    ws.fireMessage({
      type: 'connection.error',
      connection_id: 'x',
      created_at: new Date().toISOString(),
      error: { code: 40, message: 'expired', StatusCode: 0 },
    });
    // F7 log message wording check.
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        'onMessage(): WS failure due to expired token, scheduling reconnect with refreshed token',
      ),
    );
    // Allow the scheduled reconnect to fire (random retryInterval; cap 5s).
    await vi.advanceTimersByTimeAsync(6000);
    expect(loadTokenSpy).toHaveBeenCalled();
    expect(eventDispatcher).toBeDefined();
  });

  it('non-string message data is parsed as null (binary frame ignored)', async () => {
    const { socket, gate, eventDispatcher } = setupSocket();
    gate.arm();
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-1'));
    await promise;

    const all = vi.fn();
    eventDispatcher.on('all', all);
    ws.fireRawMessage(new ArrayBuffer(8));
    expect(all).not.toHaveBeenCalled();
  });

  it('disconnect() during a healthy connection does NOT reject the gate (F12 carve-out)', async () => {
    const { socket, gate } = setupSocket();
    gate.arm();
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-1'));
    await promise;

    const awaiter = gate.await();
    await socket.disconnect();
    // The gate stays settled with the connection_id from before.
    await expect(awaiter).resolves.toBe('conn-1');
  });

  it('disconnect() is idempotent', async () => {
    const { socket, gate } = setupSocket();
    gate.arm();
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-1'));
    await promise;
    await socket.disconnect();
    await expect(socket.disconnect()).resolves.toBeUndefined();
    expect(socket.isDisconnected()).toBe(true);
  });

  it('auth-handshake watchdog rejects the gate with AUTH_HANDSHAKE_TIMEOUT (F14)', async () => {
    const { socket, gate } = setupSocket({
      WebSocketImpl: ManualWebSocket as unknown as typeof WebSocket,
      authHandshakeTimeoutMs: 200,
      defaultWsTimeoutMs: 500,
    });
    gate.arm();
    // A server that never completes the handshake puts the socket into a
    // reconnect loop in this fake-timer setup. We verify the typed gate
    // rejection and then let the outer connect() resolve via its 500 ms
    // poll timeout (well before the random 250-500 ms reconnect delay).
    const connectP = socket.connect().catch(() => {});
    await vi.advanceTimersByTimeAsync(0);
    const ws = ManualWebSocket.instances[0];
    ws.fireOpen();
    await vi.advanceTimersByTimeAsync(250);
    await expect(gate.await()).rejects.toMatchObject({
      code: 'AUTH_HANDSHAKE_TIMEOUT',
      isWSFailure: true,
    });
    await vi.advanceTimersByTimeAsync(900);
    await connectP;
  });

  it('auth-handshake watchdog is cleared on connection.ok (no double reject)', async () => {
    const { socket, gate } = setupSocket({
      authHandshakeTimeoutMs: 100,
    });
    gate.arm();
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-1'));
    const result = await promise;
    expect(result?.connection_id).toBe('conn-1');
    // Past the watchdog: must not fire / must not change state.
    await vi.advanceTimersByTimeAsync(500);
    expect(socket.isHealthy()).toBe(true);
  });

  it('listener that throws in dispatch does not break socket flow (F2 from socket perspective)', async () => {
    const { socket, eventDispatcher, gate } = setupSocket();
    gate.arm();
    eventDispatcher.on('connection.ok', () => {
      throw new Error('boom');
    });
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-1'));
    await expect(promise).resolves.toBeDefined();
    expect(socket.isHealthy()).toBe(true);
  });

  it('F13 quirk: first mid-stream connection.error is silently consumed; second triggers reconnect', async () => {
    const { socket, gate, tokenManager } = setupSocket({ staticToken: false });
    gate.arm();
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-1'));
    await promise;

    const loadTokenSpy = vi.spyOn(tokenManager, 'loadToken');

    // First mid-stream error: handshake-error guard fires (isConnectionOpenResolved
    // was still false), early-return. No reconnect scheduled.
    ws.fireMessage({
      type: 'connection.error',
      connection_id: 'x',
      created_at: new Date().toISOString(),
      error: { code: 40, message: 'expired', StatusCode: 0 },
    });
    expect(loadTokenSpy).not.toHaveBeenCalled();

    // Second mid-stream error: now isConnectionOpenResolved=true, falls through
    // to the reconnect-handler branch.
    ws.fireMessage({
      type: 'connection.error',
      connection_id: 'x',
      created_at: new Date().toISOString(),
      error: { code: 40, message: 'expired', StatusCode: 0 },
    });
    await vi.advanceTimersByTimeAsync(6000);
    expect(loadTokenSpy).toHaveBeenCalled();
  });
});
