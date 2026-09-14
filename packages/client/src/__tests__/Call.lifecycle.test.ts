/**
 * @vitest-environment happy-dom
 */

import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../Call';
import { StreamClient } from '../coordinator/connection/client';
import { ClientEventReporter } from '../reporting';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { CallingState, ClientState } from '../store';
import { promiseWithResolvers } from '../helpers/promise';

// A controlled stand-in for the retry backoff. Unless a test installs a hook,
// the real `sleep` is used, so the rest of the suite is unaffected.
const sleepControl: { onSleep?: (ms: number) => Promise<unknown> } = {};
vi.mock('../coordinator/connection/utils', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../coordinator/connection/utils')>();
  return {
    ...actual,
    sleep: (ms: number) =>
      sleepControl.onSleep ? sleepControl.onSleep(ms) : actual.sleep(ms),
  };
});

type CallingXStub = {
  joinCall: ReturnType<typeof vi.fn>;
  endCall: ReturnType<typeof vi.fn>;
  wireAudioEngineSubscription: ReturnType<typeof vi.fn>;
};

// the React Native globals that `join()`/`leave()` reach for when the SDK runs
// on a device. Installed only by the tests that assert on callingX behavior.
const installCallingX = (
  joinCall: CallingXStub['joinCall'] = vi.fn().mockResolvedValue(undefined),
): CallingXStub => {
  const callingX: CallingXStub = {
    joinCall,
    endCall: vi.fn(),
    wireAudioEngineSubscription: vi.fn(),
  };
  (globalThis as Record<string, any>).streamRNVideoSDK = {
    callingX,
    callManager: { stop: vi.fn() },
  };
  return callingX;
};

describe('Call lifecycle wiring', () => {
  let call: Call;

  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      headers: { get: () => 'AMS1-P2' },
    } as Response);
    const streamClient = new StreamClient('abc');
    call = new Call({
      type: 'test',
      id: generateUUIDv4(),
      streamClient,
      clientEventReporter: new ClientEventReporter({
        streamClient,
        enabled: false,
      }),
      clientState: new ClientState(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete sleepControl.onSleep;
    delete (globalThis as Record<string, any>).streamRNVideoSDK;
  });

  // Regression guard for the Call-owned helper teardown chain. Each of
  // these helpers holds a resource (timer, listener, AudioContext) that
  // leaks across calls if teardown is dropped during a refactor.
  // Covers trackSubscriptionManager, audioBindingsWatchdog, and
  // dynascaleManager. SFU-lifecycle disposables (publisher/subscriber/
  // sfuStatsReporter) require a real join and are out of scope.
  it('call.leave() tears down all Call-owned helpers exactly once', async () => {
    const trackSubDispose = vi.spyOn(call.trackSubscriptionManager, 'dispose');
    const audioBindingsDispose = vi.spyOn(
      call.audioBindingsWatchdog!,
      'dispose',
    );
    const dynascaleDispose = vi.spyOn(call.dynascaleManager!, 'dispose');

    await call.leave();

    expect(trackSubDispose).toHaveBeenCalledTimes(1);
    expect(audioBindingsDispose).toHaveBeenCalledTimes(1);
    expect(dynascaleDispose).toHaveBeenCalledTimes(1);
  });

  // Order matters: the SFU subscription pump must finish tearing down
  // before DynascaleManager closes its AudioContext, otherwise helpers
  // can run on a closed context (logged as warnings or thrown by
  // happy-dom). This is the contract the leave() teardown chain encodes.
  it('call.leave() tears down helpers in the documented order', async () => {
    const trackSubDispose = vi.spyOn(call.trackSubscriptionManager, 'dispose');
    const audioBindingsDispose = vi.spyOn(
      call.audioBindingsWatchdog!,
      'dispose',
    );
    const dynascaleDispose = vi.spyOn(call.dynascaleManager!, 'dispose');

    await call.leave();

    const trackSubOrder = trackSubDispose.mock.invocationCallOrder[0];
    const audioBindingsOrder = audioBindingsDispose.mock.invocationCallOrder[0];
    const dynascaleOrder = dynascaleDispose.mock.invocationCallOrder[0];

    expect(trackSubOrder).toBeLessThan(audioBindingsOrder);
    expect(audioBindingsOrder).toBeLessThan(dynascaleOrder);
  });

  // `joinSource` is reporting-only: it must reach the event reporter and never
  // the coordinator's join request.
  it('call.join() reports joinSource without putting it on the wire', async () => {
    vi.spyOn(call, 'setup').mockResolvedValue(undefined);
    const doJoin = vi
      .spyOn(call as unknown as { doJoin: Call['join'] }, 'doJoin')
      .mockResolvedValue(undefined);
    const withJoinLifecycle = vi.spyOn(
      call.clientEventReporter,
      'withJoinLifecycle',
    );

    await call.join({ joinSource: 'ring-poll-api', ring: true });

    expect(withJoinLifecycle).toHaveBeenCalledWith(
      call.cid,
      { joinReason: 'first-attempt', joinSource: 'ring-poll-api' },
      expect.any(Function),
    );
    expect(doJoin).toHaveBeenCalledTimes(1);
    expect('joinSource' in doJoin.mock.calls[0][0]!).toBe(false);
  });

  it('call.join() shares an in-flight join flow', async () => {
    const joinTask = promiseWithResolvers<void>();
    vi.spyOn(call, 'setup').mockResolvedValue(undefined);
    const doJoin = vi
      .spyOn(call as unknown as { doJoin: Call['join'] }, 'doJoin')
      .mockReturnValue(joinTask.promise);

    const firstJoin = call.join();
    const secondJoin = call.join();

    await Promise.resolve();
    expect(doJoin).toHaveBeenCalledTimes(1);

    joinTask.resolve();
    await expect(Promise.all([firstJoin, secondJoin])).resolves.toEqual([
      undefined,
      undefined,
    ]);
  });

  // Regression guard for the join-retry / leave race.
  //
  // `supersededByLeave` is snapshotted *inside* `doJoin` (Call.ts), so every
  // retry re-reads an already-incremented `leaveGeneration` and concludes that
  // no leave happened. A leave that lands while an attempt is in flight
  // therefore does not stop the retry loop, and the next attempt performs a
  // full join — coordinator request, SFU socket, peer connections — on a call
  // the user has already left, after `leaveCallHooks` tore down its event
  // wiring. The retry loop needs a generation check of its own, at `join()`
  // scope rather than per-attempt.
  it('call.join() stops retrying once leave() has superseded the join', async () => {
    const firstAttempt = promiseWithResolvers<void>();
    vi.spyOn(call, 'setup').mockResolvedValue(undefined);
    const doJoin = vi
      .spyOn(call as unknown as { doJoin: Call['join'] }, 'doJoin')
      .mockImplementationOnce(async () => {
        // first attempt hangs (e.g. awaiting a JoinResponse), then times out
        await firstAttempt.promise;
        throw new Error('join response timeout');
      })
      .mockResolvedValue(undefined);

    const joinTask = call.join({ maxJoinRetries: 3 });
    await vi.waitFor(() => expect(doJoin).toHaveBeenCalledTimes(1));

    // the user leaves while the first attempt is still in flight
    await call.leave();
    expect(call.state.callingState).toBe(CallingState.LEFT);

    // ...only now does the first attempt fail
    firstAttempt.resolve();
    await joinTask;

    expect(doJoin).toHaveBeenCalledTimes(1);
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  // maxJoinRetries: 1 means the failed attempt is also the last one, so the
  // failure would normally be rethrown and reported as an error-ended call.
  // A leave that superseded the join must not produce either.
  it('call.join() swallows a superseded final-attempt failure', async () => {
    const callingX = installCallingX();
    const attempt = promiseWithResolvers<void>();
    vi.spyOn(call, 'setup').mockResolvedValue(undefined);
    const doJoin = vi
      .spyOn(call as unknown as { doJoin: Call['join'] }, 'doJoin')
      .mockImplementation(async () => {
        await attempt.promise;
        throw new Error('join response timeout');
      });

    const joinTask = call.join({ maxJoinRetries: 1 });
    await vi.waitFor(() => expect(doJoin).toHaveBeenCalledTimes(1));

    await call.leave();
    attempt.resolve();

    await expect(joinTask).resolves.toBeUndefined();
    expect(doJoin).toHaveBeenCalledTimes(1);
    expect(call.state.callingState).toBe(CallingState.LEFT);
    expect(callingX.endCall).not.toHaveBeenCalledWith(call, 'error');
  });

  it('call.join() stops retrying when leave() lands during the backoff', async () => {
    const backoff = promiseWithResolvers<void>();
    sleepControl.onSleep = () => backoff.promise;
    vi.spyOn(call, 'setup').mockResolvedValue(undefined);
    const doJoin = vi
      .spyOn(call as unknown as { doJoin: Call['join'] }, 'doJoin')
      .mockRejectedValue(new Error('transient failure'));

    const joinTask = call.join({ maxJoinRetries: 3 });
    await vi.waitFor(() => expect(doJoin).toHaveBeenCalledTimes(1));

    // the user leaves while the retry loop waits out its backoff
    await call.leave();
    backoff.resolve();

    await expect(joinTask).resolves.toBeUndefined();
    expect(doJoin).toHaveBeenCalledTimes(1);
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  // `setup()` is deliberately left unmocked here: it re-registers effects and
  // device managers and resets the calling state to IDLE, so a superseded join
  // that resumes into it would silently resurrect a call the user has left.
  it('call.join() never attempts or sets up when leave() lands during callingX.joinCall', async () => {
    const joinCall = promiseWithResolvers<void>();
    const callingX = installCallingX(vi.fn().mockReturnValue(joinCall.promise));
    const setup = vi.spyOn(call, 'setup');
    const doJoin = vi
      .spyOn(call as unknown as { doJoin: Call['join'] }, 'doJoin')
      .mockResolvedValue(undefined);

    const joinTask = call.join();
    await call.leave();
    expect(call.state.callingState).toBe(CallingState.LEFT);
    joinCall.resolve();

    await expect(joinTask).resolves.toBeUndefined();
    expect(setup).not.toHaveBeenCalled();
    expect(doJoin).not.toHaveBeenCalled();
    expect(call.state.callingState).toBe(CallingState.LEFT);
    expect(callingX.endCall).not.toHaveBeenCalledWith(call, 'error');
  });

  it('call.join() never attempts when leave() lands during setup()', async () => {
    const setupTask = promiseWithResolvers<void>();
    vi.spyOn(call, 'setup').mockReturnValue(setupTask.promise);
    const registerCall = vi.spyOn(call.clientEventReporter, 'registerCall');
    const doJoin = vi
      .spyOn(call as unknown as { doJoin: Call['join'] }, 'doJoin')
      .mockResolvedValue(undefined);

    const joinTask = call.join();
    await call.leave();
    setupTask.resolve();

    await expect(joinTask).resolves.toBeUndefined();
    expect(registerCall).not.toHaveBeenCalled();
    expect(doJoin).not.toHaveBeenCalled();
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  // Controls: without a leave, the retry loop must behave exactly as before.
  it('call.join() still retries a recoverable failure', async () => {
    sleepControl.onSleep = () => Promise.resolve();
    vi.spyOn(call, 'setup').mockResolvedValue(undefined);
    const doJoin = vi
      .spyOn(call as unknown as { doJoin: Call['join'] }, 'doJoin')
      .mockRejectedValueOnce(new Error('transient failure'))
      .mockResolvedValue(undefined);

    await expect(call.join({ maxJoinRetries: 3 })).resolves.toBeUndefined();
    expect(doJoin).toHaveBeenCalledTimes(2);
  });

  it('call.join() rejects and ends the call once retries are exhausted', async () => {
    const callingX = installCallingX();
    sleepControl.onSleep = () => Promise.resolve();
    vi.spyOn(call, 'setup').mockResolvedValue(undefined);
    const doJoin = vi
      .spyOn(call as unknown as { doJoin: Call['join'] }, 'doJoin')
      .mockRejectedValue(new Error('transient failure'));

    await expect(call.join({ maxJoinRetries: 2 })).rejects.toThrow(
      'transient failure',
    );
    expect(doJoin).toHaveBeenCalledTimes(2);
    expect(callingX.endCall).toHaveBeenCalledWith(call, 'error');
  });

  it('call.join() is still allowed after a completed leave()', async () => {
    vi.spyOn(call, 'setup').mockResolvedValue(undefined);
    const doJoin = vi
      .spyOn(call as unknown as { doJoin: Call['join'] }, 'doJoin')
      .mockResolvedValue(undefined);

    await call.leave();
    await expect(call.join()).resolves.toBeUndefined();
    expect(doJoin).toHaveBeenCalledTimes(1);
  });
});
