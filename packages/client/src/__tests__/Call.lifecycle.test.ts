/**
 * @vitest-environment happy-dom
 */

import '../rtc/__tests__/mocks/webrtc.mocks';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../Call';
import { StreamClient } from '../coordinator/connection/client';
import { ClientEventReporter } from '../reporting';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { CallingState, StreamVideoWriteableStateStore } from '../store';
import { WebsocketReconnectStrategy } from '../gen/video/sfu/models/models';

const deferred = () => {
  let resolve = () => {};
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

/** Blocks the first call until `gate` resolves; later calls pass through, so a
 *  concurrent `leave()` making the same call can still complete. */
const blockFirstCall = (gate: Promise<void>, onReached: () => void) => {
  let calls = 0;
  return async () => {
    if (++calls === 1) {
      onReached();
      await gate;
    }
  };
};

const fakeSfuClient = (overrides: Record<string, unknown> = {}) => ({
  tag: '1',
  edgeName: 'sfu-a',
  sessionId: 'session-a',
  isHealthy: false,
  enterMigration: () => Promise.resolve(),
  leaveAndClose: async () => {},
  close: () => {},
  getTrace: () => undefined,
  ...overrides,
});

describe('Call lifecycle wiring', () => {
  let call: Call;
  let streamClient: StreamClient;
  let clientEventReporter: ClientEventReporter;
  let clientStore: StreamVideoWriteableStateStore;

  beforeEach(() => {
    delete globalThis.streamRNVideoSDK;
    streamClient = new StreamClient('abc');
    clientEventReporter = new ClientEventReporter({ streamClient });
    clientStore = new StreamVideoWriteableStateStore();
    call = new Call({
      type: 'test',
      id: generateUUIDv4(),
      streamClient,
      clientEventReporter,
      clientStore,
    });
    // pass-through: the join lifecycle reporting is not under test here
    vi.spyOn(clientEventReporter, 'withJoinLifecycle').mockImplementation(
      (_cid, _reason, op) => op(),
    );
  });

  /** Stubs everything a coordinator response would otherwise apply. */
  const stubResponseHandling = () => {
    vi.spyOn(streamClient, '_hasConnectionID').mockReturnValue(true);
    vi.spyOn(call.state, 'setMembers').mockImplementation(() => {});
    vi.spyOn(call.state, 'setOwnCapabilities').mockImplementation(() => {});
    return vi
      .spyOn(call.state, 'updateFromCallResponse')
      .mockImplementation(() => {});
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

  // With a blocked SFU every attempt burns the WS-open timeout, so the retry
  // loop is still running when the user hits hang up. A later attempt would put
  // the calling state back to JOINING/JOINED and the call screen would reappear,
  // which is what makes hang up look like it did nothing. On the final attempt
  // the failure is rethrown, which used to reject `join()` (and end the call by
  // cid with an `error` reason) for what the user asked for.
  describe.each([3, 1])('with maxJoinRetries: %i', (maxJoinRetries) => {
    it('resolves without reviving the call when a leave lands mid-attempt', async () => {
      const doJoin = vi.fn(async () => {
        await call.leave();
        throw new Error('SFU WS connection failed to open after 5000ms');
      });
      // @ts-expect-error stubbing a private member for the test
      call.doJoin = doJoin;

      await expect(call.join({ maxJoinRetries })).resolves.toBeUndefined();

      expect(doJoin).toHaveBeenCalledTimes(1);
      expect(call.state.callingState).toBe(CallingState.LEFT);
    });
  });

  // The same, for a hangup during the backoff between two attempts: the next
  // attempt snapshots the already-bumped leave generation as its own baseline,
  // so only the loop can stop it.
  it('starts no further attempt when a leave lands during the retry backoff', async () => {
    const doJoin = vi
      .fn()
      .mockRejectedValueOnce(new Error('SFU WS connection failed'))
      .mockResolvedValue('joined');
    // @ts-expect-error stubbing a private member for the test
    call.doJoin = doJoin;

    const joining = call.join({ maxJoinRetries: 3 });
    // the first attempt fails, then the user hangs up while the loop sleeps
    await vi.waitFor(() => expect(doJoin).toHaveBeenCalled());
    await call.leave();
    await joining;

    expect(doJoin).toHaveBeenCalledTimes(1);
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  // On React Native `join()` awaits CallKit/Telecom registration before anything
  // else, which is long enough for a native `endCall` to complete a full
  // `leave()`. The join must not carry on, and `setup()` must not revive LEFT.
  it('abandons the join when the user leaves during native registration', async () => {
    const nativeRegistration = deferred();
    // @ts-expect-error partial RN SDK bridge, only the join/leave path is used
    globalThis.streamRNVideoSDK = {
      callingX: {
        joinCall: vi.fn(() => nativeRegistration.promise),
        endCall: vi.fn(),
        unwireAudioEngineSubscription: vi.fn(),
      },
      callManager: { stop: vi.fn() },
    };
    const doJoin = vi.fn();
    // @ts-expect-error stubbing a private member for the test
    call.doJoin = doJoin;

    const joining = call.join();
    await call.leave();
    expect(call.state.callingState).toBe(CallingState.LEFT);

    nativeRegistration.resolve();
    await joining;

    expect(doJoin).not.toHaveBeenCalled();
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  // A `leave()` can also complete while the coordinator join request is in
  // flight. Applying the response would repopulate a left call, re-register it
  // in the client store, and tell the caller we accepted a call the user just
  // hung up. Caching its credentials would make the next `join()` skip the
  // coordinator block -- and with it the store registration.
  it('discards the coordinator join response when the user already left', async () => {
    const updateFromCallResponse = stubResponseHandling();
    vi.spyOn(streamClient, 'getLocationHint').mockResolvedValue('hint');
    const accept = vi.spyOn(call, 'accept').mockResolvedValue({} as never);
    const registerOrUpdateCall = vi.spyOn(clientStore, 'registerOrUpdateCall');
    const coordinatorJoin = deferred();
    const post = vi
      .spyOn(streamClient, 'post')
      .mockReturnValue(coordinatorJoin.promise as Promise<never>);

    const joining = call.join();
    await vi.waitFor(() => expect(post).toHaveBeenCalled());
    await call.leave();
    expect(call.state.callingState).toBe(CallingState.LEFT);

    coordinatorJoin.resolve({
      call: {},
      members: [],
      own_capabilities: [],
      credentials: {
        token: 'token',
        server: {
          url: 'https://sfu.example.com/twirp',
          ws_endpoint: 'wss://sfu.example.com/ws',
          edge_name: 'test-sfu',
        },
      },
      stats_options: { reporting_interval_ms: 0, enable_rtc_stats: false },
    } as never);
    await joining;

    expect(call.state.callingState).toBe(CallingState.LEFT);
    expect(clientStore.calls).not.toContain(call);
    expect(call.watching).toBe(false);
    expect(updateFromCallResponse).not.toHaveBeenCalled();
    expect(accept).not.toHaveBeenCalled();
    expect(registerOrUpdateCall).not.toHaveBeenCalled();
    // @ts-expect-error reading a private member for the test
    expect(call.sfuClient).toBeUndefined();
    // @ts-expect-error reading a private member for the test
    expect(call.credentials).toBeUndefined();
    // @ts-expect-error reading a private member for the test
    expect(call.lastStatsOptions).toBeUndefined();
  });

  // Reconnection runs on its own concurrency tag, so a hangup can land in the
  // middle of it. `doJoin` cancels itself, but its callers used to carry on with
  // post-join work regardless: FAST calls `get()` (whose `setup()` revives LEFT
  // to IDLE and re-registers the call), and MIGRATE sets JOINED unconditionally
  // once the migration task settles. MIGRATE also owns the release of the
  // pre-migration instances, which `leave()` no longer holds by then.
  describe.each([
    { strategy: 'reconnectFast' as const, releasesPreMigration: false },
    { strategy: 'reconnectMigrate' as const, releasesPreMigration: true },
  ])(
    '$strategy after a cancelled join',
    ({ strategy, releasesPreMigration }) => {
      it('performs no post-join work', async () => {
        stubResponseHandling();
        vi.spyOn(streamClient, 'get').mockResolvedValue({
          call: { settings: {} },
          members: [],
          own_capabilities: [],
        } as never);
        // @ts-expect-error stubbing private members for the test
        vi.spyOn(call, 'applyDeviceConfig').mockResolvedValue(undefined);
        // @ts-expect-error stubbing private members for the test
        vi.spyOn(call, 'restorePublishedTracks').mockResolvedValue(undefined);
        // @ts-expect-error stubbing private members for the test
        vi.spyOn(call, 'restoreSubscribedTracks').mockImplementation(() => {});
        const close = vi.fn();
        // @ts-expect-error a minimal SFU client for the reconnect paths
        call.sfuClient = fakeSfuClient({ close });

        const join = deferred();
        const joinInFlight = deferred();
        // @ts-expect-error stubbing a private member for the test
        call.doJoin = vi.fn(async () => {
          joinInFlight.resolve();
          await join.promise;
          // what `doJoin` reports once a `leave()` has superseded it
          return 'superseded' as const;
        });

        // @ts-expect-error invoking a private member for the test
        const reconnect = call[strategy]();
        await joinInFlight.promise;
        await call.leave();
        expect(call.state.callingState).toBe(CallingState.LEFT);

        join.resolve();
        await reconnect;

        expect(call.state.callingState).toBe(CallingState.LEFT);
        expect(clientStore.calls).not.toContain(call);
        expect(close).toHaveBeenCalledTimes(releasesPreMigration ? 1 : 0);
      });
    },
  );

  // `initPublisherAndSubscriber` awaits twice before it is done creating the new
  // instances: the previous reporter's final sample, and the old publisher's
  // disposal. A `leave()` completing in either window would leave peer
  // connections and reporters behind that its teardown never sees -- they keep
  // reporting stats and can trigger a reconnect via `onReconnectionNeeded`.
  describe.each([
    { window: 'the final stats sample', blockFlush: true },
    { window: 'the publisher disposal', blockFlush: false },
  ])('a leave during $window', ({ blockFlush }) => {
    it('leaves no peer connections behind', async () => {
      const gate = deferred();
      const inWindow = deferred();
      const block = blockFirstCall(gate.promise, inWindow.resolve);
      // @ts-expect-error stubbing a private member for the test
      call.sfuStatsReporter = {
        flush: blockFlush ? block : async () => {},
        stop: () => {},
      };
      if (!blockFlush) {
        // the previous publisher, disposed after the first staleness check and
        // before the new publisher and the reporters are created
        // @ts-expect-error stubbing a private member for the test
        call.publisher = { dispose: block };
      }
      const sfuClient = fakeSfuClient({ isHealthy: true });
      // @ts-expect-error a minimal SFU client for the peer-connection setup
      call.sfuClient = sfuClient;
      // @ts-expect-error reading a private member for the test
      const generation = call.leaveGeneration;

      // @ts-expect-error invoking a private member for the test
      const setupPeerConnections = call.initPublisherAndSubscriber({
        sfuClient,
        connectionConfig: {},
        clientDetails: {},
        statsOptions: { enable_rtc_stats: false, reporting_interval_ms: 2000 },
        publishOptions: [],
        closePreviousInstances: true,
        unifiedSessionId: 'unified-1',
        // the predicate `doJoin` passes: the same leave-generation comparison
        // @ts-expect-error reading a private member for the test
        isStale: () => call.leaveGeneration !== generation,
      });
      await inWindow.promise;

      await call.leave();
      expect(call.state.callingState).toBe(CallingState.LEFT);

      gate.resolve();
      await setupPeerConnections;

      // @ts-expect-error reading private members for the test
      expect(call.subscriber).toBeUndefined();
      // @ts-expect-error reading private members for the test
      expect(call.publisher).toBeUndefined();
      // @ts-expect-error reading private members for the test
      expect(call.statsReporter).toBeUndefined();
      // @ts-expect-error reading private members for the test
      expect(call.sfuStatsReporter).toBeUndefined();
    });
  });

  // Defense in depth for the same class of escape: whatever manages to call
  // `reconnect()` after teardown (a peer connection that outlived it, a late SFU
  // socket close) must not re-join the call behind the user's back.
  it('does not reconnect a call that has been left', async () => {
    const doJoin = vi.fn();
    // @ts-expect-error stubbing a private member for the test
    call.doJoin = doJoin;

    await call.leave();
    // @ts-expect-error invoking a private member for the test
    await call.reconnect(WebsocketReconnectStrategy.REJOIN, 'test');

    expect(doJoin).not.toHaveBeenCalled();
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });
});
