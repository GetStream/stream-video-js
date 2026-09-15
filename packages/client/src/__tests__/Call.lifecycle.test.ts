/**
 * @vitest-environment happy-dom
 */

import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { Call } from '../Call';
import * as sfu from '../StreamSfuClient';
import * as rtc from '../rtc';
import { StreamClient } from '../coordinator/connection/client';
import { ErrorFromResponse } from '../coordinator/connection/types';
import { ClientEventReporter } from '../reporting';
import type { GetCallResponse, JoinCallResponse } from '../gen/coordinator';
import { WebsocketReconnectStrategy } from '../gen/video/sfu/models/models';
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

// the React Native globals that `join()`/`leave()` reach for when the SDK runs
// on a device. Installed only by the tests that assert on callingX behavior.
const installCallingX = () => {
  const callingX = {
    joinCall: vi.fn().mockResolvedValue(undefined),
    endCall: vi.fn(),
    wireAudioEngineSubscription: vi.fn(),
  };
  (globalThis as Record<string, any>).streamRNVideoSDK = {
    callingX,
    callManager: { stop: vi.fn() },
  };
  return callingX;
};

const makePeer = () => ({
  detachEventHandlers: vi.fn(),
  dispose: vi.fn().mockResolvedValue(undefined),
});

describe('Call lifecycle wiring', () => {
  let call: Call;
  let internalCall: {
    doJoin: Call['join'];
    reconnectFast: () => Promise<void>;
    restorePublishedTracks: () => Promise<void>;
    restoreSubscribedTracks: () => void;
    applyDeviceConfig: () => Promise<void>;
  };

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
    internalCall = call as unknown as typeof internalCall;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete sleepControl.onSleep;
    delete (globalThis as Record<string, any>).streamRNVideoSDK;
  });

  const mockJoin = () => {
    vi.spyOn(call, 'setup').mockResolvedValue(undefined);
    return vi.spyOn(internalCall, 'doJoin').mockResolvedValue(undefined);
  };

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
    const doJoin = mockJoin();
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
    const doJoin = mockJoin().mockReturnValue(joinTask.promise);

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

  // Cover both a retryable attempt and the last allowed attempt.
  it.each([3, 1])(
    'leave() cancels an in-flight join with maxJoinRetries=%s',
    async (maxJoinRetries) => {
      const callingX = installCallingX();
      const pending = promiseWithResolvers<void>();
      const doJoin = mockJoin().mockImplementationOnce(async () => {
        await pending.promise;
        throw new Error('join response timeout');
      });

      const task = call.join({ maxJoinRetries });
      await vi.waitFor(() => expect(doJoin).toHaveBeenCalledTimes(1));
      await call.leave();
      expect(call.state.callingState).toBe(CallingState.LEFT);
      pending.resolve();

      await expect(task).resolves.toBeUndefined();
      expect(doJoin).toHaveBeenCalledTimes(1);
      expect(call.state.callingState).toBe(CallingState.LEFT);
      expect(callingX.endCall).not.toHaveBeenCalledWith(call, 'error');
    },
  );

  it('call.join() stops retrying when leave() lands during the backoff', async () => {
    const backoff = promiseWithResolvers<void>();
    sleepControl.onSleep = () => backoff.promise;
    const doJoin = mockJoin().mockRejectedValue(new Error('transient failure'));

    const joinTask = call.join({ maxJoinRetries: 3 });
    await vi.waitFor(() => expect(doJoin).toHaveBeenCalledTimes(1));

    // the user leaves while the retry loop waits out its backoff
    await call.leave();
    backoff.resolve();

    await expect(joinTask).resolves.toBeUndefined();
    expect(doJoin).toHaveBeenCalledTimes(1);
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  it.each(['callingX.joinCall', 'setup'] as const)(
    'call.join() stops before registration when leave() lands during %s',
    async (phase) => {
      const pending = promiseWithResolvers<void>();
      const callingX = installCallingX();
      // Keep real setup for the native-join case to detect reinitialization.
      const setup = vi.spyOn(call, 'setup');
      const paused = phase === 'setup' ? setup : callingX.joinCall;
      paused.mockReturnValue(pending.promise);
      const registerCall = vi.spyOn(call.clientEventReporter, 'registerCall');
      const doJoin = vi
        .spyOn(internalCall, 'doJoin')
        .mockResolvedValue(undefined);

      const task = call.join();
      await vi.waitFor(() => expect(paused).toHaveBeenCalled());
      await call.leave();
      expect(call.state.callingState).toBe(CallingState.LEFT);
      pending.resolve();

      await expect(task).resolves.toBeUndefined();
      if (phase === 'callingX.joinCall') expect(setup).not.toHaveBeenCalled();
      expect(registerCall).not.toHaveBeenCalled();
      expect(doJoin).not.toHaveBeenCalled();
      expect(call.state.callingState).toBe(CallingState.LEFT);
      expect(callingX.endCall).not.toHaveBeenCalledWith(call, 'error');
    },
  );

  it.each([
    'media factory',
    'location hint',
    'coordinator request',
    'coordinator rejection',
    'acceptance',
    'generic SDP',
    'SFU join',
    'SFU rejection',
  ] as const)('call.join() stops after leave() during %s', async (phase) => {
    const pending = promiseWithResolvers<void>();
    const stage =
      phase === 'coordinator rejection'
        ? 'coordinator request'
        : phase === 'SFU rejection'
          ? 'SFU join'
          : phase;
    const responseAt = async <T>(step: typeof stage, response: T) => {
      if (stage === step) {
        await pending.promise;
        if (phase.endsWith('rejection')) throw new Error('Join failed');
      }
      return response;
    };
    vi.spyOn(call, 'setup').mockResolvedValue(undefined);
    const mediaFactory = vi.spyOn(call, 'ensureMediaFactory');
    const callingX =
      phase === 'media factory' || phase === 'SFU rejection'
        ? installCallingX()
        : undefined;
    if (phase === 'media factory') {
      mediaFactory.mockImplementation(() =>
        responseAt('media factory', fromPartial<rtc.CallMediaEngine>({})),
      );
    }
    const locationHint = vi
      .spyOn(call.streamClient, 'getLocationHint')
      .mockImplementation(() => responseAt('location hint', 'AMS'));
    vi.spyOn(call.streamClient, '_hasConnectionID').mockReturnValue(true);
    const updateState = vi.spyOn(call.state, 'updateFromCallResponse');
    const accept = vi
      .spyOn(call, 'accept')
      .mockImplementation(() => responseAt('acceptance', { duration: '0ms' }));
    const registerCall = vi.spyOn(call.clientState, 'registerOrUpdateCall');
    const request = vi.spyOn(call.streamClient, 'post').mockImplementation(() =>
      responseAt(
        'coordinator request',
        fromPartial<JoinCallResponse>({
          call: { egress: {}, custom: {}, created_by: { id: 'other-user' } },
          members: [],
          own_capabilities: [],
          stats_options: { enable_rtc_stats: false },
        }),
      ),
    );
    const genericSdp = vi
      .spyOn(rtc, 'getGenericSdp')
      .mockImplementation(() => responseAt('generic SDP', 'sdp'));
    const updateSfuState = vi
      .spyOn(call.state, 'updateFromSfuCallState')
      .mockImplementation(() => {});
    const joinSfu = vi.fn(() =>
      responseAt('SFU join', {
        callState: {},
        publishOptions: [],
        fastReconnectDeadlineSeconds: 123,
      }),
    );
    const closeSfu = vi.fn();
    const createSfu = vi
      .spyOn(sfu, 'StreamSfuClient')
      .mockImplementation(function () {
        return fromPartial<sfu.StreamSfuClient>({
          sessionId: 'test-session',
          join: joinSfu,
          close: closeSfu,
          leaveAndClose: vi.fn().mockResolvedValue(undefined),
        });
      });

    const joinTask = call.join({ ring: true, maxJoinRetries: 1 });
    const pausedOperation = {
      'media factory': mediaFactory,
      'location hint': locationHint,
      'coordinator request': request,
      acceptance: accept,
      'generic SDP': genericSdp,
      'SFU join': joinSfu,
    }[stage];
    await vi.waitFor(() => expect(pausedOperation).toHaveBeenCalled());
    expect(call.state.callingState).toBe(CallingState.JOINING);
    await call.leave();
    const publishOptions = call['currentPublishOptions'];
    const reconnectDeadline = call['fastReconnectDeadlineSeconds'];
    pending.resolve();

    await expect(joinTask).resolves.toBeUndefined();
    if (phase === 'media factory') {
      expect(callingX!.wireAudioEngineSubscription).not.toHaveBeenCalled();
    }
    if (phase === 'media factory' || phase === 'location hint') {
      expect(request).not.toHaveBeenCalled();
    }
    if (
      phase === 'coordinator request' ||
      phase === 'media factory' ||
      phase === 'location hint'
    ) {
      expect(createSfu).not.toHaveBeenCalled();
      expect(updateState).not.toHaveBeenCalled();
      expect(accept).not.toHaveBeenCalled();
      expect(registerCall).not.toHaveBeenCalled();
    }
    if (phase === 'acceptance') expect(registerCall).not.toHaveBeenCalled();
    expect(joinSfu).toHaveBeenCalledTimes(
      phase === 'SFU join' || phase === 'SFU rejection' ? 1 : 0,
    );
    expect(updateSfuState).not.toHaveBeenCalled();
    expect(call['currentPublishOptions']).toBe(publishOptions);
    expect(call['fastReconnectDeadlineSeconds']).toBe(reconnectDeadline);
    expect(call['sfuClient']).toBeUndefined();
    expect(call.clientState.calls).not.toContain(call);
    expect(call.ringing).toBe(false);
    expect(call.state.callingState).toBe(CallingState.LEFT);
    if (phase === 'SFU rejection') {
      expect(closeSfu).not.toHaveBeenCalled();
      expect(callingX!.endCall).not.toHaveBeenCalledWith(call, 'error');
    }
  });

  it.each([
    ['FAST', 'join'],
    ['REJOIN', 'join'],
    ['MIGRATE', 'join'],
    ['MIGRATE', 'migration'],
  ] as const)(
    'stops %s reconnect after leave during %s',
    async (strategy, phase) => {
      const pending = promiseWithResolvers<void>();
      const doJoin = vi
        .spyOn(internalCall, 'doJoin')
        .mockImplementation(async () => {
          if (phase === 'join') await pending.promise;
        });
      const get = vi.spyOn(call, 'get').mockResolvedValue(fromPartial({}));
      const restorePublished = vi
        .spyOn(internalCall, 'restorePublishedTracks')
        .mockResolvedValue(undefined);
      const restoreSubscribed = vi
        .spyOn(internalCall, 'restoreSubscribedTracks')
        .mockImplementation(() => {});
      const oldSfu = fromPartial<sfu.StreamSfuClient>({
        enterMigration: vi.fn().mockReturnValue(pending.promise),
        leaveAndClose: vi.fn().mockResolvedValue(undefined),
        close: vi.fn(),
      });
      const oldSubscriber = fromPartial<rtc.Subscriber>(makePeer());
      const oldPublisher = fromPartial<rtc.Publisher>(makePeer());
      call['sfuClient'] = oldSfu;
      call['subscriber'] = oldSubscriber;
      call['publisher'] = oldPublisher;
      call.clientState.registerOrUpdateCall(call);
      const task = call['reconnect'](
        WebsocketReconnectStrategy[strategy],
        'test',
      );
      await vi.waitFor(() =>
        expect(
          phase === 'join' ? doJoin : restoreSubscribed,
        ).toHaveBeenCalled(),
      );
      await call.leave();
      vi.mocked(oldSubscriber.dispose).mockClear();
      vi.mocked(oldPublisher.dispose).mockClear();
      restoreSubscribed.mockClear();
      pending.resolve();
      await task;

      expect(call.state.callingState).toBe(CallingState.LEFT);
      expect(call.clientState.calls).not.toContain(call);
      expect(get).not.toHaveBeenCalled();
      expect(restoreSubscribed).not.toHaveBeenCalled();
      if (phase === 'join') expect(restorePublished).not.toHaveBeenCalled();
      if (strategy === 'MIGRATE') {
        expect(oldSubscriber.dispose).toHaveBeenCalledOnce();
        expect(oldPublisher.dispose).toHaveBeenCalledOnce();
        expect(oldSfu.close).toHaveBeenCalledOnce();
      }
    },
  );

  it.each(['reconnect failure', 'failure refresh', 'backoff'] as const)(
    'preserves LEFT when leave happens during %s',
    async (phase) => {
      const pending = promiseWithResolvers<void>();
      const backoff = vi.fn(() => pending.promise);
      if (phase === 'backoff') sleepControl.onSleep = backoff;
      const reconnect = vi
        .spyOn(internalCall, 'reconnectFast')
        .mockImplementation(async () => {
          if (phase === 'reconnect failure') await pending.promise;
          throw new ErrorFromResponse(
            fromPartial({ unrecoverable: phase !== 'backoff' }),
          );
        });
      const get = vi.spyOn(call, 'get').mockImplementation(async () => {
        await pending.promise;
        return fromPartial<GetCallResponse>({});
      });
      const task = call['reconnect'](WebsocketReconnectStrategy.FAST, 'test');
      const paused = {
        'reconnect failure': reconnect,
        'failure refresh': get,
        backoff,
      }[phase];
      await vi.waitFor(() => expect(paused).toHaveBeenCalled());
      await call.leave();
      pending.resolve();
      await task;

      expect(call.state.callingState).toBe(CallingState.LEFT);
      expect(call.clientState.calls).not.toContain(call);
      expect(get).toHaveBeenCalledTimes(phase === 'failure refresh' ? 1 : 0);
      expect(reconnect).toHaveBeenCalledOnce();
      expect(call['reconnectStrategy']).toBe(
        WebsocketReconnectStrategy.UNSPECIFIED,
      );
    },
  );

  it.each([false, true])(
    'get() respects leave during fetch: %s',
    async (leaveDuringFetch) => {
      const pending = promiseWithResolvers<GetCallResponse>();
      const response = fromPartial<GetCallResponse>({ call: { settings: {} } });
      const request = vi
        .spyOn(call.streamClient, 'get')
        .mockReturnValue(pending.promise);
      vi.spyOn(call.streamClient, '_hasConnectionID').mockReturnValue(true);
      const update = vi
        .spyOn(call, 'updateFromCallStateResponse')
        .mockImplementation(() => {});
      const configure = vi
        .spyOn(internalCall, 'applyDeviceConfig')
        .mockResolvedValue(undefined);
      await call.leave();
      const task = call.get(); // deliberate reuse must still work
      await vi.waitFor(() => expect(request).toHaveBeenCalled());
      if (leaveDuringFetch) await call.leave();
      pending.resolve(response);
      await expect(task).resolves.toBe(response);

      expect(call.clientState.calls.includes(call)).toBe(!leaveDuringFetch);
      expect(update).toHaveBeenCalledTimes(leaveDuringFetch ? 0 : 1);
      expect(configure).toHaveBeenCalledTimes(leaveDuringFetch ? 0 : 1);
      expect(call.state.callingState).toBe(
        leaveDuringFetch ? CallingState.LEFT : CallingState.IDLE,
      );
      if (!leaveDuringFetch) await call.leave();
    },
  );

  it.each([
    'stats flush',
    'subscriber disposal',
    'publisher disposal',
  ] as const)(
    'call.join() does not recreate peers after leave() during %s',
    async (phase) => {
      const pending = promiseWithResolvers<void>();
      vi.spyOn(call, 'setup').mockResolvedValue(undefined);
      call['credentials'] = fromPartial({ ice_servers: [] });
      call['lastStatsOptions'] = fromPartial({ reporting_interval_ms: 0 });
      call['sfuClient'] = fromPartial({
        isHealthy: true,
        sessionId: 'test-session',
        leaveAndClose: vi.fn().mockResolvedValue(undefined),
      });
      const flush = vi.fn().mockResolvedValue(undefined);
      const disposeSubscriber = vi.fn().mockResolvedValue(undefined);
      const disposePublisher = vi.fn().mockResolvedValue(undefined);
      call['sfuStatsReporter'] = fromPartial({ flush, stop: vi.fn() });
      call['subscriber'] = fromPartial({ dispose: disposeSubscriber });
      call['publisher'] = fromPartial({ dispose: disposePublisher });
      const pause = {
        'stats flush': flush,
        'subscriber disposal': disposeSubscriber,
        'publisher disposal': disposePublisher,
      }[phase];
      // Only pause initialization; leave's own cleanup must remain able to finish.
      pause.mockReturnValueOnce(pending.promise);
      const createSubscriber = vi
        .spyOn(rtc, 'Subscriber')
        .mockImplementation(function () {
          return fromPartial<rtc.Subscriber>(makePeer());
        });
      const createPublisher = vi
        .spyOn(rtc, 'Publisher')
        .mockImplementation(function () {
          return fromPartial<rtc.Publisher>(makePeer());
        });
      const logInfo = vi.spyOn(call['logger'], 'info');

      const joinTask = call.join();
      await vi.waitFor(() => expect(pause).toHaveBeenCalledTimes(1));
      const subscriberCount = createSubscriber.mock.calls.length;
      const publisherCount = createPublisher.mock.calls.length;
      await call.leave();
      pending.resolve();

      await expect(joinTask).resolves.toBeUndefined();
      expect(createSubscriber).toHaveBeenCalledTimes(subscriberCount);
      expect(createPublisher).toHaveBeenCalledTimes(publisherCount);
      expect(call['subscriber']).toBeUndefined();
      expect(call['publisher']).toBeUndefined();
      expect(call['sfuStatsReporter']).toBeUndefined();
      expect(call.state.callingState).toBe(CallingState.LEFT);
      expect(logInfo).not.toHaveBeenCalledWith(`Joined call ${call.cid}`);
    },
  );

  // Controls: without a leave, the retry loop must behave exactly as before.
  it('call.join() still retries a recoverable failure', async () => {
    sleepControl.onSleep = () => Promise.resolve();
    const doJoin = mockJoin()
      .mockRejectedValueOnce(new Error('transient failure'))
      .mockResolvedValue(undefined);

    await expect(call.join({ maxJoinRetries: 3 })).resolves.toBeUndefined();
    expect(doJoin).toHaveBeenCalledTimes(2);
  });

  it('call.join() rejects and ends the call once retries are exhausted', async () => {
    const callingX = installCallingX();
    sleepControl.onSleep = () => Promise.resolve();
    const doJoin = mockJoin().mockRejectedValue(new Error('transient failure'));

    await expect(call.join({ maxJoinRetries: 2 })).rejects.toThrow(
      'transient failure',
    );
    expect(doJoin).toHaveBeenCalledTimes(2);
    expect(callingX.endCall).toHaveBeenCalledWith(call, 'error');
  });

  it('call.join() is still allowed after a completed leave()', async () => {
    const doJoin = mockJoin();

    await call.leave();
    await expect(call.join()).resolves.toBeUndefined();
    expect(doJoin).toHaveBeenCalledTimes(1);
  });
});
