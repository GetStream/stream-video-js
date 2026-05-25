import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreamClient } from '../client';
import { StableWSConnection } from '../connection';
import type { WSConnectionError } from '../types';

class StuckWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: StuckWebSocket[] = [];

  // instance-level constants so consumers can read e.g. ws.CLOSED
  CONNECTING = StuckWebSocket.CONNECTING;
  OPEN = StuckWebSocket.OPEN;
  CLOSING = StuckWebSocket.CLOSING;
  CLOSED = StuckWebSocket.CLOSED;

  readyState = StuckWebSocket.CONNECTING;
  url: string;
  onopen: ((ev?: unknown) => unknown) | null = null;
  onclose: ((ev?: unknown) => unknown) | null = null;
  onerror: ((ev?: unknown) => unknown) | null = null;
  onmessage: ((ev?: unknown) => unknown) | null = null;

  constructor(url: string | URL) {
    this.url = url.toString();
    StuckWebSocket.instances.push(this);
  }

  close = () => {
    this.readyState = StuckWebSocket.CLOSED;
  };

  send = () => {};
}

// A drivable mock that lets the test fire onopen / onmessage / onclose
// at chosen points so we can observe behavior between handshake events.
class ManualWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: ManualWebSocket[] = [];

  CONNECTING = ManualWebSocket.CONNECTING;
  OPEN = ManualWebSocket.OPEN;
  CLOSING = ManualWebSocket.CLOSING;
  CLOSED = ManualWebSocket.CLOSED;

  readyState = ManualWebSocket.CONNECTING;
  url: string;
  onopen: ((ev?: unknown) => unknown) | null = null;
  onclose: ((ev?: unknown) => unknown) | null = null;
  onerror: ((ev?: unknown) => unknown) | null = null;
  onmessage: ((ev?: unknown) => unknown) | null = null;
  sentMessages: string[] = [];

  constructor(url: string | URL) {
    this.url = url.toString();
    ManualWebSocket.instances.push(this);
  }

  fireOpen = () => {
    this.readyState = ManualWebSocket.OPEN;
    this.onopen?.({});
  };

  fireConnectionOk = (connectionId: string) => {
    this.onmessage?.({
      data: JSON.stringify({
        type: 'connection.ok',
        connection_id: connectionId,
        me: { id: 'test-user' },
      }),
    } as MessageEvent);
  };

  close = () => {
    this.readyState = ManualWebSocket.CLOSED;
  };

  send = (data: string) => {
    this.sentMessages.push(data);
  };
}

const buildClient = () => {
  const client = new StreamClient('test-key', {
    browser: false,
    defaultWsTimeout: 5000,
    WebSocketImpl: StuckWebSocket as unknown as typeof WebSocket,
    timeout: 1000,
  });

  vi.spyOn(client.tokenManager, 'tokenReady').mockResolvedValue('fake-token');
  vi.spyOn(client.tokenManager, 'loadToken').mockResolvedValue('fake-token');
  vi.spyOn(client.tokenManager, 'getToken').mockReturnValue('fake-token');

  client._setUser({ id: 'test-user' });
  client.userID = 'test-user';
  client.clientID = 'test-user--abcdef';

  // matches what StreamClient.openConnection does before kicking off connect()
  client._setupConnectionIdPromise();

  return client;
};

describe('StableWSConnection - silent handshake hang', () => {
  beforeEach(() => {
    StuckWebSocket.instances = [];
    ManualWebSocket.instances = [];
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('rejects in-flight connectionIdPromise within defaultWsTimeout when WS upgrade silently stalls', async () => {
    const client = buildClient();

    // capture the promise that doAxiosRequest (e.g. from Call.join) would
    // already be awaiting before _connect runs to completion
    const originalConnectionIdPromise = client.connectionIdPromise!;
    expect(originalConnectionIdPromise).toBeDefined();

    // track settlement deterministically. If the orphaning bug regresses,
    // these stay false and the test fails via assertion (not a vitest
    // test-timeout, which would only signal "hang somewhere").
    let didResolve = false;
    let rejectionError: WSConnectionError | undefined;
    originalConnectionIdPromise.then(
      () => {
        didResolve = true;
      },
      (error: WSConnectionError) => {
        rejectionError = error;
      },
    );

    const wsConnection = new StableWSConnection(client);
    client.wsConnection = wsConnection;
    const connectAttempt = wsConnection.connect(5000);
    // attach a no-op rejection handler so vitest does not surface it as
    // unhandled while we orchestrate fake timers; we still assert below.
    const connectAttemptOutcome = connectAttempt.then(
      () => ({ kind: 'resolved' as const }),
      (error: WSConnectionError) => ({
        kind: 'rejected' as const,
        error,
      }),
    );

    // let the token mock resolve and the WS get instantiated
    await vi.advanceTimersByTimeAsync(0);
    expect(StuckWebSocket.instances.length).toBe(1);
    expect(StuckWebSocket.instances[0].readyState).toBe(
      StuckWebSocket.CONNECTING,
    );
    // before the watchdog fires, the original promise must still be pending
    expect(didResolve).toBe(false);
    expect(rejectionError).toBeUndefined();

    // trip the handshake watchdog
    await vi.advanceTimersByTimeAsync(5000);

    expect(didResolve).toBe(false);
    expect(rejectionError).toBeInstanceOf(Error);
    expect(rejectionError?.isWSFailure).toBe(true);
    expect(rejectionError?.message).toMatch(/WS handshake timed out/);

    // half-open WS should have been torn down by the catch block
    expect(StuckWebSocket.instances[0].readyState).toBe(StuckWebSocket.CLOSED);

    // isConnecting must be cleared so a subsequent reconnect can proceed
    expect(wsConnection.isConnecting).toBe(false);

    // and the connectionIdPromise must NOT have been replaced with a fresh
    // pending one in the catch: it stays rejected so any awaiter captured
    // between the catch and the _reconnect's retry interval fails fast
    // instead of silently capturing a never-settling P2. _reconnect's
    // entry guard (in _connect) will recreate it on the next attempt.
    expect(client.isConnectionIdPromisePending).toBe(false);

    // drain the outer connect()'s _waitForHealthy(5000) and assert it
    // bubbles up an isWSFailure rejection (rather than hanging forever)
    await vi.advanceTimersByTimeAsync(20000);
    const outcome = await connectAttemptOutcome;
    expect(outcome.kind).toBe('rejected');
  });

  it('does not schedule a reconnect (and leaves connectionIdPromise rejected) on a permanent, non-WS failure', async () => {
    const client = new StreamClient('test-key', {
      browser: false,
      defaultWsTimeout: 5000,
      WebSocketImpl: StuckWebSocket as unknown as typeof WebSocket,
      timeout: 1000,
    });
    // tokenReady rejects to push us into loadToken; loadToken then throws
    // to drive _connect into its catch with an error that has no
    // isWSFailure flag (the same shape as a permanent server reject).
    vi.spyOn(client.tokenManager, 'tokenReady').mockRejectedValue(
      new Error('token provider failed previously'),
    );
    vi.spyOn(client.tokenManager, 'loadToken').mockRejectedValue(
      new Error('permanent token error'),
    );
    vi.spyOn(client.tokenManager, 'getToken').mockReturnValue('fake-token');

    client._setUser({ id: 'test-user' });
    client.userID = 'test-user';
    client.clientID = 'test-user--abcdef';
    client._setupConnectionIdPromise();

    const originalConnectionIdPromise = client.connectionIdPromise!;
    let didResolve = false;
    let rejectionError: Error | undefined;
    originalConnectionIdPromise.then(
      () => {
        didResolve = true;
      },
      (error: Error) => {
        rejectionError = error;
      },
    );

    const wsConnection = new StableWSConnection(client);
    // spy on _reconnect to assert directly that no retry chain is
    // launched on permanent failures
    const reconnectSpy = vi.spyOn(wsConnection, '_reconnect');
    client.wsConnection = wsConnection;
    const connectAttempt = wsConnection.connect(5000);
    const connectAttemptOutcome = connectAttempt.then(
      () => ({ kind: 'resolved' as const }),
      (error: Error) => ({ kind: 'rejected' as const, error }),
    );

    // let the token mock rejections propagate through _connect's catch
    await vi.advanceTimersByTimeAsync(0);

    expect(didResolve).toBe(false);
    expect(rejectionError).toBeInstanceOf(Error);
    expect(rejectionError?.message).toMatch(/permanent token error/);

    // Finding #2: catch must NOT recreate connectionIdPromise as a fresh
    // pending one for permanent (non-isWSFailure) errors. Otherwise, a
    // doAxiosRequest issued in this window would capture a P that nothing
    // ever settles and would hang indefinitely.
    expect(client.isConnectionIdPromisePending).toBe(false);

    // and crucially, no reconnect chain was launched - the catch's
    // _reconnect() call is gated on err.isWSFailure, which is absent here.
    // drain a generous slice of fake time to be sure no retry sneaks in.
    await vi.advanceTimersByTimeAsync(20000);
    expect(reconnectSpy).not.toHaveBeenCalled();

    const outcome = await connectAttemptOutcome;
    expect(outcome.kind).toBe('rejected');
  });

  it('does not write resolveConnectionId when disconnect runs after the handshake completes', async () => {
    const client = new StreamClient('test-key', {
      browser: false,
      defaultWsTimeout: 5000,
      WebSocketImpl: ManualWebSocket as unknown as typeof WebSocket,
      timeout: 1000,
    });
    vi.spyOn(client.tokenManager, 'tokenReady').mockResolvedValue('fake-token');
    vi.spyOn(client.tokenManager, 'loadToken').mockResolvedValue('fake-token');
    vi.spyOn(client.tokenManager, 'getToken').mockReturnValue('fake-token');

    client._setUser({ id: 'test-user' });
    client.userID = 'test-user';
    client.clientID = 'test-user--abcdef';
    client._setupConnectionIdPromise();

    // observe whether resolveConnectionId is called by wrapping it
    let resolveConnectionIdCalled = false;
    const originalResolve = client.resolveConnectionId;
    client.resolveConnectionId = (...args: unknown[]) => {
      resolveConnectionIdCalled = true;
      return (originalResolve as (...a: unknown[]) => unknown)?.(...args);
    };

    const wsConnection = new StableWSConnection(client);
    client.wsConnection = wsConnection;
    const connectAttempt = wsConnection.connect(5000);
    const connectAttemptOutcome = connectAttempt.then(
      () => ({ kind: 'resolved' as const }),
      (error: Error) => ({ kind: 'rejected' as const, error }),
    );

    // let the token resolve and the WS get created
    await vi.advanceTimersByTimeAsync(0);
    const ws = ManualWebSocket.instances.at(-1)!;
    expect(ws).toBeDefined();

    // simulate a successful handshake: open, then connection.ok
    ws.fireOpen();
    ws.fireConnectionOk('stale-conn-id');

    // SYNCHRONOUSLY mark the connection as disconnected (as
    // closeConnection() / disconnectUser() would) BEFORE the await
    // Promise.race continuation in _connect runs. The post-handshake
    // isDisconnected guard in _connect must then short-circuit instead
    // of writing stale connection_id into the client's resolver.
    wsConnection.disconnect();

    // flush microtasks so the await Promise.race in _connect resumes
    await vi.advanceTimersByTimeAsync(0);

    // Finding #1: resolveConnectionId must NOT have been called and
    // wsConnection.connectionID must remain unset.
    expect(resolveConnectionIdCalled).toBe(false);
    expect(wsConnection.connectionID).toBeUndefined();

    // and the new ws must be torn down by the guard's destroy call
    expect(ws.readyState).toBe(ManualWebSocket.CLOSED);

    // The post-handshake guard must surface the abort to the caller of
    // connect() instead of silently returning. Otherwise _waitForHealthy
    // would observe the already-resolved connectionOpen and resolve with
    // a ConnectedEvent for a torn-down connection.
    await vi.advanceTimersByTimeAsync(20000);
    const outcome = await connectAttemptOutcome;
    expect(outcome.kind).toBe('rejected');
    if (outcome.kind === 'rejected') {
      expect(outcome.error.message).toMatch(
        /disconnect\(\) ran while connecting/,
      );
    }
  });

  it('rejects the captured client.connectionIdPromise when disconnect aborts a handshake (no reopen)', async () => {
    const client = new StreamClient('test-key', {
      browser: false,
      defaultWsTimeout: 5000,
      WebSocketImpl: ManualWebSocket as unknown as typeof WebSocket,
      timeout: 1000,
    });
    vi.spyOn(client.tokenManager, 'tokenReady').mockResolvedValue('fake-token');
    vi.spyOn(client.tokenManager, 'loadToken').mockResolvedValue('fake-token');
    vi.spyOn(client.tokenManager, 'getToken').mockReturnValue('fake-token');

    client._setUser({ id: 'test-user' });
    client.userID = 'test-user';
    client.clientID = 'test-user--abcdef';
    client._setupConnectionIdPromise();

    // capture the connection-id promise BEFORE the handshake races against
    // disconnect. doAxiosRequest awaits this same promise before sending
    // non-public REST calls, so if it never settles those callers hang
    // forever (the regression Codex flagged).
    const capturedPromise = client.connectionIdPromise!;
    expect(capturedPromise).toBeDefined();
    let capturedResolved = false;
    let capturedRejected: Error | undefined;
    capturedPromise.then(
      () => {
        capturedResolved = true;
      },
      (error: Error) => {
        capturedRejected = error;
      },
    );

    const wsConnection = new StableWSConnection(client);
    client.wsConnection = wsConnection;
    const connectAttempt = wsConnection.connect(5000);
    const connectAttemptOutcome = connectAttempt.then(
      () => ({ kind: 'resolved' as const }),
      (error: Error) => ({ kind: 'rejected' as const, error }),
    );

    await vi.advanceTimersByTimeAsync(0);
    const ws = ManualWebSocket.instances.at(-1)!;

    // successful handshake then synchronous disconnect (closeConnection
    // path - does NOT touch client.connectionIdPromise)
    ws.fireOpen();
    ws.fireConnectionOk('stale-conn-id');
    wsConnection.disconnect();

    await vi.advanceTimersByTimeAsync(0);

    // The captured connection-id promise must be rejected (not stuck
    // pending), so any in-flight doAxiosRequest fails fast.
    expect(capturedResolved).toBe(false);
    expect(capturedRejected).toBeInstanceOf(Error);
    expect(capturedRejected?.message).toMatch(
      /disconnect\(\) ran while connecting/,
    );

    // drain outer connect() bookkeeping
    await vi.advanceTimersByTimeAsync(20000);
    await connectAttemptOutcome;
  });

  it('rejects only the original promise when openConnection rotates resolvers mid-abort', async () => {
    const client = new StreamClient('test-key', {
      browser: false,
      defaultWsTimeout: 5000,
      WebSocketImpl: ManualWebSocket as unknown as typeof WebSocket,
      timeout: 1000,
    });
    vi.spyOn(client.tokenManager, 'tokenReady').mockResolvedValue('fake-token');
    vi.spyOn(client.tokenManager, 'loadToken').mockResolvedValue('fake-token');
    vi.spyOn(client.tokenManager, 'getToken').mockReturnValue('fake-token');

    client._setUser({ id: 'test-user' });
    client.userID = 'test-user';
    client.clientID = 'test-user--abcdef';
    client._setupConnectionIdPromise();

    // P1: the promise the in-flight _connect attempt is supposed to settle.
    const promiseP1 = client.connectionIdPromise!;
    let p1Resolved = false;
    let p1Rejected: Error | undefined;
    promiseP1.then(
      () => {
        p1Resolved = true;
      },
      (error: Error) => {
        p1Rejected = error;
      },
    );

    const wsConnection = new StableWSConnection(client);
    client.wsConnection = wsConnection;
    const connectAttempt = wsConnection.connect(5000);
    const connectAttemptOutcome = connectAttempt.then(
      () => ({ kind: 'resolved' as const }),
      (error: Error) => ({ kind: 'rejected' as const, error }),
    );

    await vi.advanceTimersByTimeAsync(0);
    const ws = ManualWebSocket.instances.at(-1)!;

    // synchronous chain: handshake completes, disconnect runs, and then
    // a concurrent openConnection() rotates the client-level resolvers
    // to a fresh P2 - all BEFORE the _connect catch runs.
    ws.fireOpen();
    ws.fireConnectionOk('stale-conn-id');
    wsConnection.disconnect();
    client._setupConnectionIdPromise();

    // P2: the rotated promise that the (hypothetical) follow-up
    // openConnection would own. The stale attempt's catch must NOT
    // settle this one.
    const promiseP2 = client.connectionIdPromise!;
    let p2Resolved = false;
    let p2Rejected: Error | undefined;
    promiseP2.then(
      () => {
        p2Resolved = true;
      },
      (error: Error) => {
        p2Rejected = error;
      },
    );

    // microtask flush -> _connect catch runs -> ownRejectConnectionId
    // (closure captured BEFORE rotation) settles P1. P2 is untouched.
    await vi.advanceTimersByTimeAsync(0);

    expect(p1Resolved).toBe(false);
    expect(p1Rejected).toBeInstanceOf(Error);
    expect(p1Rejected?.message).toMatch(/disconnect\(\) ran while connecting/);

    // P2 must still be pending - rotation isolation is the whole point
    // of capturing the reject closure per attempt.
    expect(p2Resolved).toBe(false);
    expect(p2Rejected).toBeUndefined();

    await vi.advanceTimersByTimeAsync(20000);
    await connectAttemptOutcome;
  });
});
