import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreamSfuClient } from '../StreamSfuClient';
import { Dispatcher } from '../rtc';
import { StreamClient } from '../coordinator/connection/client';

/**
 * Minimal `WebSocket` stub used to drive `StreamSfuClient.close()` while the
 * underlying connection is still in `CONNECTING` state. The constructor
 * leaves `readyState = CONNECTING`; `close()` records the call and flips
 * to `CLOSED` so subsequent assertions can see what happened.
 */
class CapturingWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: CapturingWebSocket[] = [];

  readyState = CapturingWebSocket.CONNECTING;
  url: string;
  binaryType = 'blob';
  closeArgs: { code?: number; reason?: string } | undefined;
  private listeners = new Map<string, Set<(e: unknown) => void>>();

  constructor(url: string | URL) {
    this.url = typeof url === 'string' ? url : url.toString();
    CapturingWebSocket.instances.push(this);
  }

  addEventListener(event: string, listener: (e: unknown) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
  }
  removeEventListener(event: string, listener: (e: unknown) => void) {
    this.listeners.get(event)?.delete(listener);
  }
  close(code?: number, reason?: string) {
    this.closeArgs = { code, reason };
    this.readyState = CapturingWebSocket.CLOSED;
  }
}

const buildSfuClient = () => {
  const dispatcher = new Dispatcher();
  const streamClient = new StreamClient('test-key');
  return new StreamSfuClient({
    dispatcher,
    sessionId: 'session-id-test',
    streamClient,
    cid: 'default:test',
    credentials: {
      server: {
        url: 'https://test.invalid',
        ws_endpoint: 'wss://test.invalid/ws',
        edge_name: 'sfu-test',
      },
      token: 'token',
      ice_servers: [],
    },
    tag: 'test',
    enableTracing: false,
  });
};

describe('StreamSfuClient.close()', () => {
  beforeEach(() => {
    CapturingWebSocket.instances = [];
    vi.stubGlobal('WebSocket', CapturingWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('closes the WebSocket even when it is still in CONNECTING state', () => {
    const sfuClient = buildSfuClient();
    const ws = CapturingWebSocket.instances.at(-1)!;
    expect(ws.readyState).toBe(CapturingWebSocket.CONNECTING);

    sfuClient.close(1000, 'tearing down');

    expect(ws.closeArgs).toBeDefined();
    expect(ws.closeArgs?.code).toBe(1000);
    expect(ws.readyState).toBe(CapturingWebSocket.CLOSED);
  });

  it('rejects a pending joinResponseTask on close so awaiters do not hang', async () => {
    const sfuClient = buildSfuClient();
    const joinTask = sfuClient.joinTask;

    sfuClient.close(1000, 'aborting');

    await expect(joinTask).rejects.toThrow(/SFU client disposed/);
  });

  it('does not blow up when the WebSocket is already CLOSED', () => {
    const sfuClient = buildSfuClient();
    const ws = CapturingWebSocket.instances.at(-1)!;
    ws.readyState = CapturingWebSocket.CLOSED;

    expect(() => sfuClient.close(1000, 'noop')).not.toThrow();
    // close() should not be called twice
    expect(ws.closeArgs).toBeUndefined();
  });

  it('leaveAndClose returns within ~grace period when the SFU is silent (no hang)', async () => {
    const sfuClient = buildSfuClient();
    vi.spyOn(
      sfuClient as unknown as {
        notifyLeave: (reason: string) => Promise<void>;
      },
      'notifyLeave',
    ).mockResolvedValue(undefined);

    // joinResponseTask stays pending forever — verify leaveAndClose still returns.
    const start = Date.now();
    await Promise.race([
      sfuClient.leaveAndClose('silent-sfu'),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('leaveAndClose hung past 2x grace')),
          StreamSfuClient.LEAVE_NOTIFY_GRACE_MS * 2,
        ),
      ),
    ]);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(StreamSfuClient.LEAVE_NOTIFY_GRACE_MS * 2);
  });

  it('close() does NOT produce an unhandled rejection when nobody awaits joinTask', async () => {
    // Capture unhandledrejection events that fire during this test. Without
    // the safe-catch attached to `joinResponseTask.promise`, dispose-time
    // reject would surface here.
    const unhandled: PromiseRejectionEvent[] = [];
    const onUnhandled = (e: PromiseRejectionEvent) => {
      unhandled.push(e);
      // mark as handled so it doesn't crash the test runner
      e.preventDefault?.();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', onUnhandled);
    }
    // Node-side fallback so the test passes regardless of test environment.
    const onProcessUnhandled = (reason: unknown) => {
      unhandled.push({ reason } as unknown as PromiseRejectionEvent);
    };
    process.on('unhandledRejection', onProcessUnhandled);

    try {
      const sfuClient = buildSfuClient();
      // Intentionally do NOT touch joinTask anywhere — no .catch, no await.
      sfuClient.close(1000, 'aborting before any join');

      // give microtasks + a tick for any unhandledrejection event to fire
      await new Promise((r) => setTimeout(r, 50));
      expect(unhandled).toHaveLength(0);
    } finally {
      if (typeof window !== 'undefined') {
        window.removeEventListener('unhandledrejection', onUnhandled);
      }
      process.off('unhandledRejection', onProcessUnhandled);
    }
  });
});

describe('StreamSfuClient.leaveAndClose()', () => {
  beforeEach(() => {
    CapturingWebSocket.instances = [];
    vi.stubGlobal('WebSocket', CapturingWebSocket);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  type JoinResponseTaskHandle = {
    joinResponseTask: {
      resolve: (v: unknown) => void;
      reject: (err: unknown) => void;
    };
  };

  it('notifies the SFU when joinResponseTask is already resolved', async () => {
    const sfuClient = buildSfuClient();
    (sfuClient as unknown as JoinResponseTaskHandle).joinResponseTask.resolve(
      {},
    );
    const notifyLeaveSpy = vi
      .spyOn(
        sfuClient as unknown as {
          notifyLeave: (reason: string) => Promise<void>;
        },
        'notifyLeave',
      )
      .mockResolvedValue(undefined);

    await sfuClient.leaveAndClose('user-leaving');

    expect(notifyLeaveSpy).toHaveBeenCalledWith('user-leaving');
  });

  it('waits for an in-flight join and notifies the SFU when it resolves within the grace period', async () => {
    const sfuClient = buildSfuClient();
    const notifyLeaveSpy = vi
      .spyOn(
        sfuClient as unknown as {
          notifyLeave: (reason: string) => Promise<void>;
        },
        'notifyLeave',
      )
      .mockResolvedValue(undefined);

    vi.useFakeTimers();
    const leavePromise = sfuClient.leaveAndClose('user-leaving');

    // simulate the SFU sending JoinResponse 50 ms in (well within the grace window)
    await vi.advanceTimersByTimeAsync(50);
    (sfuClient as unknown as JoinResponseTaskHandle).joinResponseTask.resolve(
      {},
    );
    // flush remaining timers (the losing race branch and any microtasks)
    await vi.runAllTimersAsync();
    await leavePromise;

    expect(notifyLeaveSpy).toHaveBeenCalledWith('user-leaving');
  });

  it('skips notifyLeave when the join does not complete within the grace period', async () => {
    const sfuClient = buildSfuClient();
    const notifyLeaveSpy = vi
      .spyOn(
        sfuClient as unknown as {
          notifyLeave: (reason: string) => Promise<void>;
        },
        'notifyLeave',
      )
      .mockResolvedValue(undefined);

    vi.useFakeTimers();
    const leavePromise = sfuClient.leaveAndClose('silent-sfu');
    // run past the grace window — the task is never resolved
    await vi.advanceTimersByTimeAsync(
      StreamSfuClient.LEAVE_NOTIFY_GRACE_MS + 50,
    );
    await leavePromise;

    expect(notifyLeaveSpy).not.toHaveBeenCalled();
  });

  it('skips notifyLeave when joinResponseTask rejects within the grace period', async () => {
    const sfuClient = buildSfuClient();
    const notifyLeaveSpy = vi
      .spyOn(
        sfuClient as unknown as {
          notifyLeave: (reason: string) => Promise<void>;
        },
        'notifyLeave',
      )
      .mockResolvedValue(undefined);

    vi.useFakeTimers();
    const leavePromise = sfuClient.leaveAndClose('rejected');
    await vi.advanceTimersByTimeAsync(20);
    (sfuClient as unknown as JoinResponseTaskHandle).joinResponseTask.reject(
      new Error('SFU went away'),
    );
    await vi.runAllTimersAsync();
    await leavePromise;

    expect(notifyLeaveSpy).not.toHaveBeenCalled();
  });
});
