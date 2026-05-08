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
  authMessageBuilder?: () => string;
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
    authMessageBuilder:
      overrides?.authMessageBuilder ??
      (() => overrides?.authMessage ?? '{"auth":"msg"}'),
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

    // Single mid-stream connection.error (code 40) MUST trigger a token
    // refresh + reconnect. Regression test for the legacy "first mid-stream
    // error is silently consumed" quirk that this rewrite removes.
    ws.fireMessage({
      type: 'connection.error',
      connection_id: 'x',
      created_at: new Date().toISOString(),
      error: { code: 40, message: 'expired', StatusCode: 0 },
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        'onMessage(): WS failure due to expired token, scheduling reconnect with refreshed token',
      ),
    );
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

  it('regression: first mid-stream connection.error after connection.ok takes the mid-stream branch', async () => {
    // Inverts the legacy F13 quirk: in the legacy implementation,
    // isConnectionOpenResolved was never set on connection.ok, so the FIRST
    // mid-stream connection.error was silently consumed by the handshake-error
    // guard. The new implementation marks the handshake resolved on
    // connection.ok, so a single mid-stream code-40 error correctly triggers
    // a token refresh + reconnect.
    const { socket, gate, tokenManager } = setupSocket({ staticToken: false });
    gate.arm();
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-1'));
    await promise;

    const loadTokenSpy = vi.spyOn(tokenManager, 'loadToken');
    ws.fireMessage({
      type: 'connection.error',
      connection_id: 'x',
      created_at: new Date().toISOString(),
      error: { code: 40, message: 'expired', StatusCode: 0 },
    });
    await vi.advanceTimersByTimeAsync(6000);
    expect(loadTokenSpy).toHaveBeenCalled();
    expect(socket.isHealthy()).toBe(false);
  });

  it('mid-stream connection.error code 40 with isStatic() does NOT trigger reconnect', async () => {
    const { socket, gate, tokenManager } = setupSocket({ staticToken: true });
    gate.arm();
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-1'));
    await promise;

    const loadTokenSpy = vi.spyOn(tokenManager, 'loadToken');
    ws.fireMessage({
      type: 'connection.error',
      connection_id: 'x',
      created_at: new Date().toISOString(),
      error: { code: 40, message: 'expired', StatusCode: 0 },
    });
    await vi.advanceTimersByTimeAsync(6000);
    expect(loadTokenSpy).not.toHaveBeenCalled();
  });

  it('health.check is sent every pingIntervalMs after connection.ok', async () => {
    const { socket, gate } = setupSocket({
      pingIntervalMs: 1000,
      healthTimeoutMs: 60000,
    });
    gate.arm();
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-1'));
    await promise;

    // The first ping fires pingIntervalMs after connection.ok.
    expect(ws.send).toHaveBeenCalledTimes(1); // auth message
    await vi.advanceTimersByTimeAsync(1000);
    expect(ws.send).toHaveBeenCalledTimes(2);
    const payload = ws.send.mock.calls[1][0];
    const parsed = JSON.parse(payload as string);
    expect(parsed[0]).toMatchObject({
      type: 'health.check',
      client_id: 'client-1',
    });
  });

  it('watchdog firing dispatches connection.changed:false after unhealthyDispatchDelayMs', async () => {
    const { socket, eventDispatcher, gate } = setupSocket({
      pingIntervalMs: 60000,
      healthTimeoutMs: 100,
      unhealthyDispatchDelayMs: 5000,
    });
    gate.arm();
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage(connectedEvent('conn-1'));
    await promise;

    const onChanged = vi.fn();
    eventDispatcher.on('connection.changed', onChanged);

    // Trigger the watchdog: advance past healthTimeoutMs (100 ms) of silence.
    await vi.advanceTimersByTimeAsync(150);
    // Watchdog set health to false but the dispatch is deferred 5 s.
    expect(onChanged).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(4900);
    expect(onChanged).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(150);
    expect(onChanged).toHaveBeenCalledWith({
      type: 'connection.changed',
      online: false,
    });
  });

  it('stale onclose from a prior transport is dropped via wsId guard', async () => {
    const { socket, eventDispatcher, gate } = setupSocket();
    gate.arm();
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const firstWs = MockWebSocket.instances[0];
    firstWs.fireOpen();
    firstWs.fireMessage(connectedEvent('conn-1'));
    await promise;

    // Bump wsId by triggering disconnect (does not reject the gate).
    await socket.disconnect();
    const onChanged = vi.fn();
    eventDispatcher.on('connection.changed', onChanged);

    // Fire an "old" onclose against the first ws AFTER disconnect bumped wsId.
    // The new wsId guard must drop it: setHealth must not run, no new
    // connection.changed dispatch, no scheduled reconnect.
    firstWs.onclose?.({
      code: 1006,
      reason: '',
      wasClean: false,
    } as CloseEvent);
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('received_at is stamped on the event before dispatch', async () => {
    const { socket, eventDispatcher, gate } = setupSocket();
    gate.arm();
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    let captured: { received_at?: Date | string } | undefined;
    eventDispatcher.on('connection.ok', (event) => {
      captured = event as unknown as { received_at?: Date | string };
    });
    ws.fireMessage(connectedEvent('conn-1'));
    await promise;
    expect(captured?.received_at).toBeInstanceOf(Date);
  });

  it('onOpen does not crash when the auth message builder throws (user/token missing)', async () => {
    const builder = vi.fn(() => {
      throw new Error('user or token missing');
    });
    const { socket, gate } = setupSocket({ authMessageBuilder: builder });
    gate.arm();
    // The connect promise hangs in this scenario because no event ever
    // settles the in-flight handshake. We only assert the synchronous
    // contract: fireOpen exercises onOpen, the builder throws inside, the
    // socket logs + returns without sending the auth message.
    void socket.connect().catch(() => {});
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    expect(() => ws.fireOpen()).not.toThrow();
    expect(builder).toHaveBeenCalled();
    expect(ws.send).not.toHaveBeenCalled();
  });

  it('connect() after disconnect() succeeds with a fresh transport', async () => {
    const { socket, gate } = setupSocket();
    gate.arm();
    const first = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    MockWebSocket.instances[0].fireOpen();
    MockWebSocket.instances[0].fireMessage(connectedEvent('conn-A'));
    await first;
    await socket.disconnect();
    expect(socket.isDisconnected()).toBe(true);

    // Re-arm the gate (the StreamClient facade does this in openConnection).
    gate.arm();
    const second = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    expect(MockWebSocket.instances).toHaveLength(2);
    MockWebSocket.instances[1].fireOpen();
    MockWebSocket.instances[1].fireMessage(connectedEvent('conn-B'));
    const result = await second;
    expect(result?.connection_id).toBe('conn-B');
    expect(socket.isDisconnected()).toBe(false);
  });

  it('concurrent close + REST: gate rejects on close, then resolves on next handshake', async () => {
    const { socket, gate } = setupSocket();
    gate.arm();
    const first = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws1 = MockWebSocket.instances[0];
    ws1.fireOpen();
    ws1.fireMessage(connectedEvent('conn-A'));
    await first;
    expect(await gate.await()).toBe('conn-A');

    // Abnormal close: invalidates the gate (rotates settled -> fresh rejected).
    ws1.fireClose(1006, 'abnormal');
    await expect(gate.await()).rejects.toBeInstanceOf(WebSocketConnectionError);

    // Drive the inline reconnect cycle by advancing fake timers (the random
    // retryInterval for failures=1 falls in [250 ms, 2500 ms]), then drive
    // the new transport to connection.ok. The next handshake's gate.arm()
    // rotates the rejected state to fresh pending; gate.resolve sets new id.
    await vi.advanceTimersByTimeAsync(3000);
    const ws2 = MockWebSocket.instances[1];
    expect(ws2).toBeDefined();
    ws2.fireOpen();
    ws2.fireMessage(connectedEvent('conn-B'));
    expect(await gate.await()).toBe('conn-B');
  });

  it('auth-handshake watchdog is cleared on a handshake-time connection.error', async () => {
    const { socket, gate } = setupSocket({ authHandshakeTimeoutMs: 200 });
    gate.arm();
    const promise = socket.connect();
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage({
      type: 'connection.error',
      connection_id: 'x',
      created_at: new Date().toISOString(),
      error: { code: 4, message: 'auth failed', StatusCode: 0 },
    });
    await expect(promise).rejects.toBeInstanceOf(WebSocketConnectionError);
    // Past the watchdog window: must not fire (rejection.error already
    // surfaced; double-reject would be a regression).
    await vi.advanceTimersByTimeAsync(500);
    // gate is rejected with the connection.error, NOT AUTH_HANDSHAKE_TIMEOUT.
    await expect(gate.await()).rejects.not.toMatchObject({
      code: 'AUTH_HANDSHAKE_TIMEOUT',
    });
  });

  it('auth-handshake watchdog is cleared on onClose', async () => {
    const { socket, gate } = setupSocket({ authHandshakeTimeoutMs: 200 });
    gate.arm();
    const promise = socket.connect().catch((e) => e);
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    // Fire close BEFORE the watchdog deadline.
    ws.fireClose(1006, 'abnormal');
    // Past the watchdog window: must not fire AUTH_HANDSHAKE_TIMEOUT.
    await vi.advanceTimersByTimeAsync(500);
    await expect(gate.await()).rejects.not.toMatchObject({
      code: 'AUTH_HANDSHAKE_TIMEOUT',
    });
    await vi.advanceTimersByTimeAsync(2000);
    await promise;
  });

  it('connect() with handshake-time code 40 schedules a refreshToken reconnect', async () => {
    const { socket, gate, tokenManager } = setupSocket({
      staticToken: false,
      authHandshakeTimeoutMs: 60000,
      defaultWsTimeoutMs: 600,
    });
    gate.arm();
    const loadTokenSpy = vi.spyOn(tokenManager, 'loadToken');
    const promise = socket.connect().catch((e) => e);
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.fireOpen();
    ws.fireMessage({
      type: 'connection.error',
      connection_id: 'x',
      created_at: new Date().toISOString(),
      error: { code: 40, message: 'expired', StatusCode: 0 },
    });
    // The handshake-time refresh path is fire-and-forget; advancing past the
    // random retryInterval for failures=1 ([250, 2500] ms) drives the reconnect.
    await vi.advanceTimersByTimeAsync(3000);
    expect(loadTokenSpy).toHaveBeenCalled();
    // Drain the outer poll timeout so the connect promise settles.
    await vi.advanceTimersByTimeAsync(700);
    await promise;
  });

  it('auth send failure does NOT arm the watchdog', async () => {
    const { socket, gate } = setupSocket({ authHandshakeTimeoutMs: 200 });
    gate.arm();
    void socket.connect().catch(() => {});
    await vi.advanceTimersByTimeAsync(0);
    const ws = MockWebSocket.instances[0];
    ws.send.mockImplementationOnce(() => {
      throw new Error('send failed');
    });
    ws.fireOpen();
    // Past the watchdog deadline: gate must NOT have an AUTH_HANDSHAKE_TIMEOUT
    // rejection because onOpen returned early and never armed the watchdog.
    await vi.advanceTimersByTimeAsync(500);
    expect(gate.isPending()).toBe(true);
  });

  it('stale auth watchdog from a prior transport is a no-op (wsId guard)', async () => {
    const { socket, gate } = setupSocket({
      WebSocketImpl: ManualWebSocket as unknown as typeof WebSocket,
      authHandshakeTimeoutMs: 200,
      defaultWsTimeoutMs: 60000,
    });
    gate.arm();
    void socket.connect().catch(() => {});
    await vi.advanceTimersByTimeAsync(0);
    const firstWs = ManualWebSocket.instances[0];
    firstWs.fireOpen();
    // The watchdog is now armed for wsId=1. Bump wsId via disconnect; the
    // watchdog body checks `myWsId !== this.wsId` and must early-return.
    // Don't await disconnect: ManualWebSocket.close() does not auto-fire
    // onclose, so the awaited promise depends on the graceful-close timer.
    void socket.disconnect();
    // Drain the disconnect's graceful timer (100 ms) plus advance past the
    // original auth watchdog deadline (200 ms). The stale watchdog body
    // runs but no-ops because of the wsId guard.
    await vi.advanceTimersByTimeAsync(500);
    expect(socket.isDisconnected()).toBe(true);
    // gate must NOT carry an AUTH_HANDSHAKE_TIMEOUT rejection.
    if (gate.isSettled()) {
      await expect(gate.await()).rejects.not.toMatchObject({
        code: 'AUTH_HANDSHAKE_TIMEOUT',
      });
    }
  });
});
