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

  // Regression guard for the leave-during-join race. With a blocked SFU each
  // join attempt burns the WS-open timeout, so the retry loop can still be
  // running when the user hits hang up. A retry started after `leave()` puts
  // the calling state back to JOINING/JOINED and the call screen reappears,
  // which is what makes hang up look like it did nothing.
  it('stops join retries when the user leaves mid-join', async () => {
    vi.spyOn(clientEventReporter, 'withJoinLifecycle').mockImplementation(
      (_cid, _reason, fn) => fn(),
    );
    const doJoin = vi.fn(async () => {
      // the user hangs up while this attempt is in flight
      await call.leave();
      throw new Error('SFU WS connection failed to open after 5000ms');
    });
    // @ts-expect-error overriding a private member for the test
    call.doJoin = doJoin;

    await call.join({ maxJoinRetries: 3 });

    expect(doJoin).toHaveBeenCalledTimes(1);
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  // Same race, but through the React Native native-registration preflight:
  // `join()` awaits CallKit/Telecom registration before anything else, which is
  // long enough for a native `endCall` to complete a full `leave()`. The join
  // must not carry on (and `setup()` must not revive LEFT back to IDLE).
  it('abandons the join when the user leaves during native registration', async () => {
    let releaseNativeRegistration = () => {};
    const nativeRegistration = new Promise<void>((resolve) => {
      releaseNativeRegistration = resolve;
    });
    const streamRNVideoSDK = {
      callingX: {
        joinCall: vi.fn(() => nativeRegistration),
        endCall: vi.fn(),
        unwireAudioEngineSubscription: vi.fn(),
      },
      callManager: { stop: vi.fn() },
    };
    // @ts-expect-error partial RN SDK bridge, only the join/leave path is used
    globalThis.streamRNVideoSDK = streamRNVideoSDK;

    const doJoin = vi.fn();
    // @ts-expect-error overriding a private member for the test
    call.doJoin = doJoin;

    const joinPromise = call.join();
    // the user hangs up (e.g. the CallKit `endCall` event) while the native
    // registration is still pending
    await call.leave();
    expect(call.state.callingState).toBe(CallingState.LEFT);

    releaseNativeRegistration();
    await joinPromise;

    expect(doJoin).not.toHaveBeenCalled();
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  // A `leave()` can also complete while the coordinator join request is still
  // in flight. Its response must be discarded: `doJoinRequest` re-registers the
  // call in the client store (which `leave()` just undid), and the SFU client
  // created afterwards is invisible to the teardown that already ran, so its
  // socket and listeners would never be closed.
  it('discards the coordinator join response when the user already left', async () => {
    vi.spyOn(clientEventReporter, 'withJoinLifecycle').mockImplementation(
      (_cid, _reason, fn) => fn(),
    );
    vi.spyOn(streamClient, '_hasConnectionID').mockReturnValue(true);
    vi.spyOn(streamClient, 'getLocationHint').mockResolvedValue('hint');
    // mocked so the assertions below can't be satisfied by a throwing state
    // update -- each one must be provably never reached
    const updateFromCallResponse = vi
      .spyOn(call.state, 'updateFromCallResponse')
      .mockImplementation(() => {});
    const setMembers = vi
      .spyOn(call.state, 'setMembers')
      .mockImplementation(() => {});
    const setOwnCapabilities = vi
      .spyOn(call.state, 'setOwnCapabilities')
      .mockImplementation(() => {});
    const accept = vi.spyOn(call, 'accept').mockResolvedValue({} as never);
    const registerOrUpdateCall = vi.spyOn(clientStore, 'registerOrUpdateCall');
    const unregisterCall = vi.spyOn(clientStore, 'unregisterCall');

    let respondToCoordinator: (response: unknown) => void = () => {};
    const coordinatorJoin = new Promise((resolve) => {
      respondToCoordinator = resolve;
    });
    const post = vi
      .spyOn(streamClient, 'post')
      .mockReturnValue(coordinatorJoin as Promise<never>);

    const joinPromise = call.join();
    await vi.waitFor(() => expect(post).toHaveBeenCalled());

    // the user hangs up before the coordinator responds
    await call.leave();
    expect(call.state.callingState).toBe(CallingState.LEFT);
    // `leave()` unregisters the call itself; only later calls are of interest
    const unregisterCallsAfterLeave = unregisterCall.mock.calls.length;

    respondToCoordinator({
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
    });
    await joinPromise;

    expect(call.state.callingState).toBe(CallingState.LEFT);
    expect(clientStore.calls).not.toContain(call);
    // @ts-expect-error reading a private member for the test
    expect(call.sfuClient).toBeUndefined();
    // none of the response's side effects may be applied -- they are not
    // undoable, and `accept()` would tell the caller we picked up a call the
    // user just hung up
    expect(updateFromCallResponse).not.toHaveBeenCalled();
    expect(setMembers).not.toHaveBeenCalled();
    expect(setOwnCapabilities).not.toHaveBeenCalled();
    expect(accept).not.toHaveBeenCalled();
    expect(registerOrUpdateCall).not.toHaveBeenCalled();
    expect(call.watching).toBe(false);
    // compensating for a registration that never happened is not attempt-scoped:
    // with a reused `Call` instance it would evict a newer, live join
    expect(unregisterCall.mock.calls.length).toBe(unregisterCallsAfterLeave);
  });

  // Reconnection runs on its own concurrency tag, so a hangup can land in the
  // middle of it. `doJoin` cancels itself, but its callers used to carry on with
  // post-join work regardless: FAST calls `get()` (whose `setup()` revives LEFT
  // to IDLE and re-registers the call), and MIGRATE sets JOINED unconditionally
  // once the migration task settles.
  describe.each([
    // only MIGRATE keeps pre-migration instances that its own cleanup owns
    { strategy: 'reconnectFast' as const, releasesPreMigration: false },
    { strategy: 'reconnectMigrate' as const, releasesPreMigration: true },
  ])(
    '$strategy after a cancelled join',
    ({ strategy, releasesPreMigration }) => {
      it('performs no post-join work', async () => {
        vi.spyOn(streamClient, '_hasConnectionID').mockReturnValue(true);
        vi.spyOn(streamClient, 'get').mockResolvedValue({
          call: { settings: {} },
          members: [],
          own_capabilities: [],
        } as never);
        vi.spyOn(call.state, 'updateFromCallResponse').mockImplementation(
          () => {},
        );
        vi.spyOn(call.state, 'setMembers').mockImplementation(() => {});
        vi.spyOn(call.state, 'setOwnCapabilities').mockImplementation(() => {});
        // @ts-expect-error stubbing a private member for the test
        vi.spyOn(call, 'applyDeviceConfig').mockResolvedValue(undefined);
        // @ts-expect-error stubbing a private member for the test
        vi.spyOn(call, 'restorePublishedTracks').mockResolvedValue(undefined);
        // @ts-expect-error stubbing a private member for the test
        vi.spyOn(call, 'restoreSubscribedTracks').mockImplementation(() => {});
        const close = vi.fn();
        // @ts-expect-error a minimal SFU client, only the migration path uses it
        call.sfuClient = {
          edgeName: 'sfu-a',
          sessionId: 'session-a',
          isHealthy: false,
          enterMigration: () => Promise.resolve(),
          leaveAndClose: async () => {},
          close,
        };

        let joinStarted = () => {};
        const joinInFlight = new Promise<void>((resolve) => {
          joinStarted = resolve;
        });
        let finishJoin = () => {};
        const joinBlocked = new Promise<void>((resolve) => {
          finishJoin = resolve;
        });
        // what `doJoin` reports once a `leave()` has superseded it
        // @ts-expect-error stubbing a private member for the test
        call.doJoin = vi.fn(async () => {
          joinStarted();
          await joinBlocked;
          return 'superseded' as const;
        });

        // @ts-expect-error invoking a private member for the test
        const reconnect = call[strategy]();
        await joinInFlight;

        // the user hangs up mid-reconnect
        await call.leave();
        expect(call.state.callingState).toBe(CallingState.LEFT);

        finishJoin();
        await reconnect;

        expect(call.state.callingState).toBe(CallingState.LEFT);
        expect(clientStore.calls).not.toContain(call);
        // the pre-migration SFU client is only ever released by the migration
        // itself: `leave()` tears down what the `Call` holds, which by then is the
        // client the cancelled join swapped in
        expect(close).toHaveBeenCalledTimes(releasesPreMigration ? 1 : 0);
      });
    },
  );

  // `initPublisherAndSubscriber` awaits twice before it is done creating the new
  // instances: the previous reporter's final sample and the old peer connections'
  // disposal. A `leave()` can complete in either window, and anything created
  // afterwards is invisible to the teardown that already ran: leaked peer
  // connections keep reporting stats and can trigger a reconnect through
  // `onReconnectionNeeded`.
  describe.each(['the final stats sample', 'the publisher disposal'])(
    'a leave during %s',
    (window) => {
      it('leaves no peer connections behind', async () => {
        let release = () => {};
        const blocked = new Promise<void>((resolve) => {
          release = resolve;
        });
        let reachedWindow = () => {};
        const inWindow = new Promise<void>((resolve) => {
          reachedWindow = resolve;
        });
        // block only the call made by the setup below; `leave()` makes the same
        // calls and has to be able to complete
        let blockedCalls = 0;
        const blockOnce = async () => {
          blockedCalls++;
          if (blockedCalls === 1) {
            reachedWindow();
            await blocked;
          }
        };
        const blockingFinalSample = window === 'the final stats sample';
        // @ts-expect-error stubbing a private member for the test
        call.sfuStatsReporter = {
          flush: blockingFinalSample ? blockOnce : async () => {},
          stop: () => {},
        };
        if (!blockingFinalSample) {
          // the previous publisher, disposed after the first staleness check
          // and before the new publisher and reporters are created
          // @ts-expect-error stubbing a private member for the test
          call.publisher = { dispose: blockOnce };
        }
        const sfuClient = {
          tag: '1',
          edgeName: 'sfu-a',
          sessionId: 'session-a',
          isHealthy: true,
          leaveAndClose: async () => {},
          close: () => {},
          getTrace: () => undefined,
        };
        // @ts-expect-error a minimal SFU client for the peer-connection setup
        call.sfuClient = sfuClient;
        // @ts-expect-error reading a private member for the test
        const generation = call.leaveGeneration;

        // @ts-expect-error invoking a private member for the test
        const setupPeerConnections = call.initPublisherAndSubscriber({
          sfuClient,
          connectionConfig: {},
          clientDetails: {},
          statsOptions: {
            enable_rtc_stats: false,
            reporting_interval_ms: 2000,
          },
          publishOptions: [],
          closePreviousInstances: true,
          unifiedSessionId: 'unified-1',
          // the predicate `doJoin` passes: the same leave-generation comparison
          // @ts-expect-error reading a private member for the test
          isStale: () => call.leaveGeneration !== generation,
        });
        await inWindow;

        await call.leave();
        expect(call.state.callingState).toBe(CallingState.LEFT);

        release();
        await setupPeerConnections;

        // @ts-expect-error reading a private member for the test
        expect(call.subscriber).toBeUndefined();
        // @ts-expect-error reading a private member for the test
        expect(call.publisher).toBeUndefined();
        // @ts-expect-error reading a private member for the test
        expect(call.statsReporter).toBeUndefined();
        // @ts-expect-error reading a private member for the test
        expect(call.sfuStatsReporter).toBeUndefined();
      });
    },
  );

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
