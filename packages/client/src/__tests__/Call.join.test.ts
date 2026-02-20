import { afterEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../Call';
import { StreamClient } from '../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../store';
import { promiseWithResolvers } from '../helpers/promise';

describe('Call.join/leave flow', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws when joining an already joined call', async () => {
    const call = createCall();
    call.state.setCallingState(CallingState.JOINED);

    await expect(call.join()).rejects.toThrow();
  });

  it('throws when joining while call state is joining', async () => {
    const call = createCall();
    call.state.setCallingState(CallingState.JOINING);

    await expect(call.join()).rejects.toThrow();
  });

  it('rejects parallel join calls while one join is in progress', async () => {
    const call = createCall();
    const firstJoinStarted = promiseWithResolvers<void>();
    const waitForFirstJoin = promiseWithResolvers<void>();

    const doJoinMock = vi
      .spyOn(
        call as unknown as { doJoin: (data?: unknown) => Promise<void> },
        'doJoin',
      )
      .mockImplementationOnce(async () => {
        firstJoinStarted.resolve();
        return await waitForFirstJoin.promise;
      });

    const join1 = call.join({ maxJoinRetries: 1 }).then(
      () => ({ ok: true as const }),
      (error) => ({ ok: false as const, error }),
    );

    await firstJoinStarted.promise;
    expect(doJoinMock).toHaveBeenCalledTimes(1);

    const join2Result = await call.join({ maxJoinRetries: 1 }).then(
      () => ({ ok: true as const }),
      (error) => ({ ok: false as const, error }),
    );
    expect(join2Result.ok).toBe(false);
    if (join2Result.ok === false) {
      expect(join2Result.error).toBeDefined();
    }
    expect(doJoinMock).toHaveBeenCalledTimes(1);

    waitForFirstJoin.resolve();
    const join1Result = await join1;
    expect(join1Result.ok).toBe(true);
  });

  it('retries recoverable join errors up to maxJoinRetries and then throws', async () => {
    vi.useFakeTimers();

    const call = createCall();
    const recoverableError = new Error('temporary connectivity issue');
    const doJoinRequestMock = vi
      .spyOn(call, 'doJoinRequest')
      .mockRejectedValue(recoverableError);

    const joinPromise = call.join({ maxJoinRetries: 3 });
    const joinResultPromise = joinPromise.then(
      () => ({ ok: true as const }),
      (error) => ({ ok: false as const, error }),
    );
    await vi.runAllTimersAsync();

    const joinResult = await joinResultPromise;
    expect(joinResult).toEqual({ ok: false, error: recoverableError });
    expect(doJoinRequestMock).toHaveBeenCalledTimes(3);
  });

  it('stops join retries when leave is called while retry loop is running', async () => {
    vi.useFakeTimers();

    const call = createCall();
    const recoverableError = new Error('temporary connectivity issue');
    const firstAttemptStarted = promiseWithResolvers<void>();

    const doJoinRequestMock = vi
      .spyOn(call, 'doJoinRequest')
      .mockImplementationOnce(async () => {
        firstAttemptStarted.resolve();
        throw recoverableError;
      })
      .mockRejectedValue(recoverableError);

    const joinPromise = call.join({ maxJoinRetries: 10 });
    const joinResultPromise = joinPromise.then(
      () => ({ ok: true as const }),
      (error) => ({ ok: false as const, error }),
    );
    await firstAttemptStarted.promise;
    expect(doJoinRequestMock).toHaveBeenCalledTimes(1);

    await call.leave();
    expect(call.state.callingState).toBe(CallingState.LEFT);

    await vi.runAllTimersAsync();
    const joinResult = await joinResultPromise;
    expect(joinResult.ok).toBe(false);

    // Expected behavior: once left, no more join retries should execute.
    expect(doJoinRequestMock).toHaveBeenCalledTimes(1);
  });

  it('leave cancels in-flight join while a parallel join is rejected', async () => {
    const call = createCall();
    const firstJoinStarted = promiseWithResolvers<void>();
    const waitForFirstJoin = promiseWithResolvers<void>();

    const doJoinMock = vi
      .spyOn(
        call as unknown as { doJoin: (data?: unknown) => Promise<void> },
        'doJoin',
      )
      .mockImplementationOnce(async () => {
        firstJoinStarted.resolve();
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

    await firstJoinStarted.promise;
    expect(doJoinMock).toHaveBeenCalledTimes(1);

    const leavePromise = call.leave();
    waitForFirstJoin.resolve();

    await leavePromise;

    const join1Result = await join1;
    const join2Result = await join2;
    expect(join1Result.ok).toBe(false);
    expect(join2Result.ok).toBe(false);
    if (join2Result.ok === false) {
      expect(join2Result.error).toBeDefined();
    }
    expect(doJoinMock).toHaveBeenCalledTimes(1);
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  it('cancels join if leave is requested while join is still in setup', async () => {
    const call = createCall();
    const setupStarted = promiseWithResolvers<void>();
    const setupGate = promiseWithResolvers<void>();

    vi.spyOn(call, 'setup').mockImplementation(async () => {
      setupStarted.resolve();
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

    await setupStarted.promise;
    const leavePromise = call.leave();

    setupGate.resolve();
    await leavePromise;

    const result = await joinResult;
    expect(result.ok).toBe(false);
    expect(doJoinMock).not.toHaveBeenCalled();
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  it('throws when leaving an already left call', async () => {
    const call = createCall();
    call.state.setCallingState(CallingState.LEFT);

    await expect(call.leave()).rejects.toThrow();
  });

  it('throws for queued leave call if a previous leave already left the call', async () => {
    const call = createCall();
    const disposeStarted = promiseWithResolvers<void>();
    const disposeGate = promiseWithResolvers<void>();
    const disposeSpy = vi
      .spyOn(call.dynascaleManager, 'dispose')
      .mockImplementationOnce(async () => {
        disposeStarted.resolve();
        await disposeGate.promise;
      });

    const firstLeave = call.leave();

    await disposeStarted.promise;
    expect(disposeSpy).toHaveBeenCalledTimes(1);

    const secondLeave = call.leave();
    disposeGate.resolve();

    await expect(firstLeave).resolves.toBeUndefined();
    await expect(secondLeave).rejects.toThrow();
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
