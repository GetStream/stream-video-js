import { describe, expect, it, vi } from 'vitest';
import { Call } from '../Call';
import { StreamClient } from '../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../store';

describe('Call.join/leave flow', () => {
  it('stops join retries when leave is called while retry loop is running', async () => {
    vi.useFakeTimers();

    const call = createCall();
    const recoverableError = new Error('temporary connectivity issue');

    const doJoinRequestMock = vi
      .spyOn(call, 'doJoinRequest')
      .mockRejectedValue(recoverableError);

    const joinPromise = call.join({ maxJoinRetries: 10 });
    const joinResultPromise = joinPromise.then(
      () => ({ ok: true as const }),
      (error) => ({ ok: false as const, error }),
    );
    for (let i = 0; i < 10 && doJoinRequestMock.mock.calls.length === 0; i++) {
      await Promise.resolve();
    }
    expect(doJoinRequestMock).toHaveBeenCalledTimes(1);

    await call.leave();
    expect(call.state.callingState).toBe(CallingState.LEFT);

    await vi.runAllTimersAsync();
    const joinResult = await joinResultPromise;
    expect(joinResult.ok).toBe(false);

    // Expected behavior: once left, no more join retries should execute.
    expect(doJoinRequestMock).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('cancels queued join requests that started before leave', async () => {
    const call = createCall();
    const waitForFirstJoin = promiseWithResolvers<void>();

    const doJoinMock = vi
      .spyOn(
        call as unknown as { doJoin: (data?: unknown) => Promise<void> },
        'doJoin',
      )
      .mockImplementationOnce(async () => {
        await waitForFirstJoin.promise;
      })
      .mockResolvedValue(undefined);

    const join1 = call.join({ maxJoinRetries: 1 }).then(
      () => ({ ok: true as const }),
      (error) => ({ ok: false as const, error }),
    );
    const join2 = call.join({ maxJoinRetries: 1 }).then(
      () => ({ ok: true as const }),
      (error) => ({ ok: false as const, error }),
    );

    for (let i = 0; i < 20 && doJoinMock.mock.calls.length === 0; i++) {
      await Promise.resolve();
    }
    expect(doJoinMock).toHaveBeenCalledTimes(1);

    const leavePromise = call.leave();
    waitForFirstJoin.resolve();

    await leavePromise;

    const join1Result = await join1;
    const join2Result = await join2;
    expect(join1Result.ok).toBe(false);
    expect(join2Result.ok).toBe(false);
    expect(doJoinMock).toHaveBeenCalledTimes(1);
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  it('cancels join if leave is requested while join is still in setup', async () => {
    const call = createCall();
    const setupGate = promiseWithResolvers<void>();

    vi.spyOn(call, 'setup').mockImplementation(async () => {
      await setupGate.promise;
    });
    const doJoinMock = vi
      .spyOn(
        call as unknown as { doJoin: (data?: unknown) => Promise<void> },
        'doJoin',
      )
      .mockResolvedValue(undefined);

    const joinResult = call.join({ maxJoinRetries: 1 }).then(
      () => ({ ok: true as const }),
      (error) => ({ ok: false as const, error }),
    );

    await Promise.resolve();
    const leavePromise = call.leave();

    setupGate.resolve();
    await leavePromise;

    const result = await joinResult;
    expect(result.ok).toBe(false);
    expect(doJoinMock).not.toHaveBeenCalled();
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });
});

const createCall = () => {
  const store = new StreamVideoWriteableStateStore();
  store.setConnectedUser({
    id: 'test-user-id',
    created_at: '',
    updated_at: '',
    role: '',
    custom: {},
    teams: [],
    devices: [],
    language: '',
  });

  return new Call({
    type: 'default',
    id: 'test-call-id',
    clientStore: store,
    streamClient: new StreamClient('test-api-key'),
  });
};

const promiseWithResolvers = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
