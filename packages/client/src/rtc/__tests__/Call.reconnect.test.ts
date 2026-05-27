import './mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { StreamVideoWriteableStateStore } from '../../store';
import { CallingState } from '../../store';
import { NegotiationError } from '../NegotiationError';
import { ReconnectReason } from '../types';
import {
  PeerType,
  WebsocketReconnectStrategy,
  ErrorCode,
} from '../../gen/video/sfu/models/models';
import * as connectionUtils from '../../coordinator/connection/utils';
import { Publisher } from '../Publisher';
import { Subscriber } from '../Subscriber';
import { Dispatcher } from '../Dispatcher';
import { StreamSfuClient } from '../../StreamSfuClient';
import { IceTrickleBuffer } from '../IceTrickleBuffer';

vi.mock('../../StreamSfuClient', () => ({
  StreamSfuClient: vi.fn(),
}));

const makeCall = () => {
  const streamClient = new StreamClient('test-key');
  const clientStore = new StreamVideoWriteableStateStore();
  return new Call({
    type: 'default',
    id: 'test-call',
    streamClient,
    clientStore,
    ringing: false,
    watching: false,
  });
};

/**
 * Primes the call so the reconnect loop will actually enter the
 * strategy branch (loop guards on callingState != JOINED/LEFT/RECONNECTING_FAILED)
 * and behaves deterministically.
 */
const primeForReconnect = (call: Call) => {
  // put the call in a non-terminal, non-JOINED state so the do-while iterates
  call.state.setCallingState(CallingState.IDLE);
  // force the strategy-decider in the catch block to always pick REJOIN,
  // so tests that care about the rejoin rate limiter don't bounce to FAST
  // based on wall-clock timing. Individual tests that want to exercise the
  // FAST branch reset this to a high value.
  (
    call as unknown as { fastReconnectDeadlineSeconds: number }
  ).fastReconnectDeadlineSeconds = -1;
};

describe('Call reconnect stopping conditions', () => {
  let call: Call;

  beforeEach(() => {
    call = makeCall();
    // make sleep instant so the loop flushes quickly
    vi.spyOn(connectionUtils, 'sleep').mockResolvedValue(undefined);
    // stub leave so the terminal path doesn't attempt real teardown
    vi.spyOn(call, 'leave').mockResolvedValue(undefined);
    // avoid the `get()` call inside markAsReconnectingFailed hitting the network
    vi.spyOn(call, 'get').mockResolvedValue({} as never);
    // default-stub all three strategy implementations to reject. Individual
    // tests override these with mockResolvedValue / mockImplementation as
    // needed. This keeps the reconnect loop from reaching the real network.
    vi.spyOn(
      call as unknown as { reconnectFast: () => Promise<void> },
      'reconnectFast',
    ).mockRejectedValue(new Error('fast stub'));
    vi.spyOn(
      call as unknown as { reconnectRejoin: () => Promise<void> },
      'reconnectRejoin',
    ).mockRejectedValue(new Error('rejoin stub'));
    vi.spyOn(
      call as unknown as { reconnectMigrate: () => Promise<void> },
      'reconnectMigrate',
    ).mockRejectedValue(new Error('migrate stub'));
    primeForReconnect(call);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rejoin rate limit', () => {
    it('triggers leave with rejoin_attempt_limit_exceeded after the budget is exhausted', async () => {
      // tight cap for speed
      call.setRejoinAttemptLimit(3, 60);
      // every rejoin attempt fails so the loop stays in REJOIN
      const rejoinSpy = vi
        .spyOn(
          call as unknown as { reconnectRejoin: () => Promise<void> },
          'reconnectRejoin',
        )
        .mockRejectedValue(new Error('rejoin failed'));

      await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

      // budget = 3 → 3 registered attempts, 4th denied and triggers leave
      expect(rejoinSpy).toHaveBeenCalledTimes(3);
      expect(call.leave).toHaveBeenCalledWith({
        message: 'rejoin_attempt_limit_exceeded',
      });
    });

    it('does NOT trigger leave while under the rejoin budget', async () => {
      call.setRejoinAttemptLimit(10, 60);
      const rejoinSpy = vi
        .spyOn(
          call as unknown as { reconnectRejoin: () => Promise<void> },
          'reconnectRejoin',
        )
        .mockImplementationOnce(async () => {
          // first call succeeds — loop exits
          call.state.setCallingState(CallingState.JOINED);
        });

      await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

      expect(rejoinSpy).toHaveBeenCalledTimes(1);
      expect(call.leave).not.toHaveBeenCalled();
    });

    it('FAST strategy is NOT counted against the rejoin budget', async () => {
      call.setRejoinAttemptLimit(2, 60);
      // stub FAST so it "succeeds" each time (we re-enter by resetting state)
      vi.spyOn(
        call as unknown as { reconnectFast: () => Promise<void> },
        'reconnectFast',
      ).mockImplementation(async () => {
        call.state.setCallingState(CallingState.JOINED);
      });

      for (let i = 0; i < 5; i++) {
        call.state.setCallingState(CallingState.IDLE);
        await call['reconnect'](WebsocketReconnectStrategy.FAST, 'test');
      }

      // the rejoin rate limiter should have no recorded attempts —
      // FAST never registers an attempt, and because each FAST here
      // "succeeds" on the first iteration, no REJOIN fallback kicks in
      expect(call['rejoinRateLimiter']['timestamps']).toHaveLength(0);
      expect(call.leave).not.toHaveBeenCalled();
    });
  });

  describe('retryInterval backoff', () => {
    it('invokes retryInterval(attempt) between failed iterations, not a fixed delay', async () => {
      call.setRejoinAttemptLimit(3, 60);
      const retryIntervalSpy = vi
        .spyOn(connectionUtils, 'retryInterval')
        .mockReturnValue(0);
      vi.spyOn(
        call as unknown as { reconnectRejoin: () => Promise<void> },
        'reconnectRejoin',
      ).mockRejectedValue(new Error('rejoin failed'));

      await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

      // 3 iterations → at least 3 backoff calls with increasing attempt index
      const calls = retryIntervalSpy.mock.calls.map((c) => c[0]);
      expect(calls.length).toBeGreaterThanOrEqual(3);
      expect(calls[0]).toBe(0);
      expect(calls[1]).toBe(1);
      expect(calls[2]).toBe(2);
    });
  });

  describe('unsupported-network detector', () => {
    it('triggers leave with webrtc_unsupported_network after N ice_never_connected reasons', async () => {
      call.setMaxIceFailuresWithoutConnect(2);
      // reconnect no-ops (REJOIN not even attempted in this test because we
      // bail out at the threshold check before the loop)
      vi.spyOn(
        call as unknown as { reconnectRejoin: () => Promise<void> },
        'reconnectRejoin',
      ).mockImplementation(async () => {
        call.state.setCallingState(CallingState.JOINED);
      });

      // first ice_never_connected: counter = 1, still under threshold (2)
      await call['reconnect'](
        WebsocketReconnectStrategy.REJOIN,
        ReconnectReason.ICE_NEVER_CONNECTED,
      );
      expect(call.leave).not.toHaveBeenCalled();

      // After a successful SFU join (no ICE-connected event yet), the
      // counter must NOT be reset — the reset only happens once a peer
      // connection actually reaches `connected`/`completed` end-to-end.
      primeForReconnect(call);
      await call['reconnect'](
        WebsocketReconnectStrategy.REJOIN,
        ReconnectReason.ICE_NEVER_CONNECTED,
      );
      // counter now 2 → threshold met → leave
      expect(call.leave).toHaveBeenCalledWith({
        message: 'webrtc_unsupported_network',
      });
    });

    it('does NOT trigger leave when the reason is NOT ice_never_connected', async () => {
      call.setMaxIceFailuresWithoutConnect(1);
      vi.spyOn(
        call as unknown as { reconnectRejoin: () => Promise<void> },
        'reconnectRejoin',
      ).mockImplementation(async () => {
        call.state.setCallingState(CallingState.JOINED);
      });

      await call['reconnect'](
        WebsocketReconnectStrategy.REJOIN,
        'some_other_reason',
      );

      expect(call.leave).not.toHaveBeenCalled();
    });
  });

  describe('consecutive negotiation failures', () => {
    const makeNegotiationError = () =>
      new NegotiationError({
        code: ErrorCode.PARTICIPANT_NOT_FOUND,
        message: 'test',
        shouldRetry: true,
      } as never);

    it('triggers leave with repeated_negotiation_failures after the streak threshold', async () => {
      call.setMaxConsecutiveNegotiationFailures(3);
      call.setRejoinAttemptLimit(100, 60); // keep rejoin cap out of the way
      vi.spyOn(
        call as unknown as { reconnectRejoin: () => Promise<void> },
        'reconnectRejoin',
      ).mockRejectedValue(makeNegotiationError());

      await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

      expect(call.leave).toHaveBeenCalledWith({
        message: 'repeated_negotiation_failures',
      });
    });

    it('resets the streak counter on a successful iteration', async () => {
      call.setMaxConsecutiveNegotiationFailures(3);
      call.setRejoinAttemptLimit(100, 60);
      let calls = 0;
      vi.spyOn(
        call as unknown as { reconnectRejoin: () => Promise<void> },
        'reconnectRejoin',
      ).mockImplementation(async () => {
        calls++;
        if (calls <= 2) throw makeNegotiationError();
        if (calls === 3) {
          // success on the 3rd attempt — resets the streak
          call.state.setCallingState(CallingState.JOINED);
          return;
        }
      });

      await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

      expect(calls).toBe(3);
      expect(call.leave).not.toHaveBeenCalled();
      expect(call['consecutiveNegotiationFailures']).toBe(0);
    });
  });

  describe('counter reset semantics', () => {
    it('rejoinRateLimiter does NOT reset on a successful SFU reconnect — the rolling window persists', async () => {
      call.setRejoinAttemptLimit(3, 60);
      // Each REJOIN succeeds on the first iteration; without the bad reset,
      // the rolling window accumulates timestamps across successful cycles.
      vi.spyOn(
        call as unknown as { reconnectRejoin: () => Promise<void> },
        'reconnectRejoin',
      ).mockImplementation(async () => {
        call.state.setCallingState(CallingState.JOINED);
      });

      for (let i = 0; i < 3; i++) {
        primeForReconnect(call);
        await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');
      }
      expect(call['rejoinRateLimiter']['timestamps']).toHaveLength(3);

      // 4th attempt is over the budget and triggers leave
      primeForReconnect(call);
      await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');
      expect(call.leave).toHaveBeenCalledWith({
        message: 'rejoin_attempt_limit_exceeded',
      });
    });

    it('iceFailuresWithoutConnect does NOT reset on a successful SFU reconnect', async () => {
      call.setMaxIceFailuresWithoutConnect(3);
      // pre-load the counter as if a previous PC had failed before connecting
      call['iceFailuresWithoutConnect'] = 2;

      vi.spyOn(
        call as unknown as { reconnectRejoin: () => Promise<void> },
        'reconnectRejoin',
      ).mockImplementation(async () => {
        call.state.setCallingState(CallingState.JOINED);
      });
      await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

      // Successful SFU join — but ICE never connected; counter must persist.
      expect(call['iceFailuresWithoutConnect']).toBe(2);
      expect(call.leave).not.toHaveBeenCalled();
    });

    it('consecutiveNegotiationFailures DOES reset on a successful reconnect iteration', async () => {
      call['consecutiveNegotiationFailures'] = 2;
      vi.spyOn(
        call as unknown as { reconnectRejoin: () => Promise<void> },
        'reconnectRejoin',
      ).mockImplementation(async () => {
        call.state.setCallingState(CallingState.JOINED);
      });

      await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

      expect(call['consecutiveNegotiationFailures']).toBe(0);
    });
  });

  describe('tunability setters', () => {
    it('setRejoinAttemptLimit changes the budget in place', async () => {
      call.setRejoinAttemptLimit(1, 60);
      vi.spyOn(
        call as unknown as { reconnectRejoin: () => Promise<void> },
        'reconnectRejoin',
      ).mockRejectedValue(new Error('rejoin failed'));

      await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

      // budget=1 → one attempt, then leave
      expect(call.leave).toHaveBeenCalledWith({
        message: 'rejoin_attempt_limit_exceeded',
      });
    });

    it('setMaxIceFailuresWithoutConnect=1 trips on the first ice_never_connected', async () => {
      call.setMaxIceFailuresWithoutConnect(1);

      await call['reconnect'](
        WebsocketReconnectStrategy.REJOIN,
        ReconnectReason.ICE_NEVER_CONNECTED,
      );

      expect(call.leave).toHaveBeenCalledWith({
        message: 'webrtc_unsupported_network',
      });
    });

    it('setMaxConsecutiveNegotiationFailures=1 trips on the first NegotiationError', async () => {
      call.setMaxConsecutiveNegotiationFailures(1);
      call.setRejoinAttemptLimit(100, 60);
      const err = new NegotiationError({
        code: ErrorCode.PARTICIPANT_NOT_FOUND,
        message: 'x',
        shouldRetry: true,
      } as never);
      vi.spyOn(
        call as unknown as { reconnectRejoin: () => Promise<void> },
        'reconnectRejoin',
      ).mockRejectedValue(err);

      await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

      expect(call.leave).toHaveBeenCalledWith({
        message: 'repeated_negotiation_failures',
      });
    });

    it('clamps zero/negative inputs to a floor of 1', () => {
      // Without clamping, n=0 would trip immediately on the first event
      // (1 >= 0 is true), turning the setter into an instant kill switch.
      call.setMaxIceFailuresWithoutConnect(0);
      expect(
        (call as unknown as { maxIceFailuresWithoutConnect: number })
          .maxIceFailuresWithoutConnect,
      ).toBe(1);

      call.setMaxConsecutiveNegotiationFailures(-5);
      expect(
        (call as unknown as { maxConsecutiveNegotiationFailures: number })
          .maxConsecutiveNegotiationFailures,
      ).toBe(1);

      call.setRejoinAttemptLimit(0, 0);
      const limiter = (
        call as unknown as {
          rejoinRateLimiter: { maxAttempts: number; windowMs: number };
        }
      ).rejoinRateLimiter;
      expect(limiter.maxAttempts).toBe(1);
      expect(limiter.windowMs).toBe(1000);
    });
  });
});

/**
 * Entry-condition bails. `reconnect()` must drop new triggers when:
 * - A join/reconnect/migrate lifecycle is already in progress.
 * - A reconnect is already queued via `hasPending(reconnectConcurrencyTag)`.
 * - The terminal `RECONNECTING_FAILED` state has been reached.
 *
 * These are pure short-circuits — none of the strategy implementations
 * should be invoked.
 */
describe('Call reconnect entry-condition bails', () => {
  let call: Call;

  beforeEach(() => {
    call = makeCall();
    vi.spyOn(connectionUtils, 'sleep').mockResolvedValue(undefined);
    vi.spyOn(call, 'leave').mockResolvedValue(undefined);
    vi.spyOn(call, 'get').mockResolvedValue({} as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const stubAllStrategies = () => ({
    fast: vi
      .spyOn(
        call as unknown as { reconnectFast: () => Promise<void> },
        'reconnectFast',
      )
      .mockResolvedValue(undefined),
    rejoin: vi
      .spyOn(
        call as unknown as { reconnectRejoin: () => Promise<void> },
        'reconnectRejoin',
      )
      .mockResolvedValue(undefined),
    migrate: vi
      .spyOn(
        call as unknown as { reconnectMigrate: () => Promise<void> },
        'reconnectMigrate',
      )
      .mockResolvedValue(undefined),
  });

  it('bails immediately when state is JOINING — Call.join owns recovery during the initial join window', async () => {
    const strategies = stubAllStrategies();
    call.state.setCallingState(CallingState.JOINING);

    await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

    expect(strategies.fast).not.toHaveBeenCalled();
    expect(strategies.rejoin).not.toHaveBeenCalled();
    expect(strategies.migrate).not.toHaveBeenCalled();
  });

  it('bails immediately when state is RECONNECTING — another reconnect is already running', async () => {
    const strategies = stubAllStrategies();
    call.state.setCallingState(CallingState.RECONNECTING);

    await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

    expect(strategies.fast).not.toHaveBeenCalled();
    expect(strategies.rejoin).not.toHaveBeenCalled();
    expect(strategies.migrate).not.toHaveBeenCalled();
  });

  it('bails immediately when state is MIGRATING — reconnectMigrate is in flight', async () => {
    const strategies = stubAllStrategies();
    call.state.setCallingState(CallingState.MIGRATING);

    await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

    expect(strategies.fast).not.toHaveBeenCalled();
    expect(strategies.rejoin).not.toHaveBeenCalled();
    expect(strategies.migrate).not.toHaveBeenCalled();
  });

  it('bails immediately when state is RECONNECTING_FAILED — terminal, no further attempts', async () => {
    const strategies = stubAllStrategies();
    call.state.setCallingState(CallingState.RECONNECTING_FAILED);

    await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

    expect(strategies.fast).not.toHaveBeenCalled();
    expect(strategies.rejoin).not.toHaveBeenCalled();
    expect(strategies.migrate).not.toHaveBeenCalled();
  });

  it('drops duplicate reconnect calls while one is already pending', async () => {
    let resolveFirst: () => void = () => {};
    const firstStrategy = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });
    const rejoinSpy = vi
      .spyOn(
        call as unknown as { reconnectRejoin: () => Promise<void> },
        'reconnectRejoin',
      )
      .mockImplementationOnce(async () => {
        await firstStrategy;
        call.state.setCallingState(CallingState.JOINED);
      });

    primeForReconnect(call);

    const firstCall = call['reconnect'](
      WebsocketReconnectStrategy.REJOIN,
      'first',
    );
    await Promise.resolve();
    call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'second');

    expect(rejoinSpy).toHaveBeenCalledTimes(1);

    resolveFirst();
    await firstCall;
  });
});

/**
 * End-to-end-ish wiring tests: simulate failures at the peer-connection layer
 * and verify they propagate through `onReconnectionNeeded` → `Call.reconnect` →
 * counters → `leave({ message })`. This covers the gap between the unit tests
 * above (which call `Call.reconnect` directly) and a true browser harness.
 */
describe('Call reconnect wiring (PC event → leave)', () => {
  let call: Call;
  let sfuClient: StreamSfuClient;
  let dispatcher: Dispatcher;

  /** Builds a Publisher wired to forward onReconnectionNeeded + onIceConnected to Call. */
  const makePublisherWiredToCall = () => {
    const publisher = new Publisher(
      {
        sfuClient,
        dispatcher,
        state: call.state,
        tag: 'test',
        enableTracing: false,
        onReconnectionNeeded: (kind, reason) => {
          // mirror Call.ts:1409 wiring
          call['reconnect'](kind, reason).catch(() => {});
        },
        onIceConnected: () => {
          // mirror Call.ts:1416 wiring
          call['iceFailuresWithoutConnect'] = 0;
        },
      },
      [],
    );
    return publisher;
  };

  beforeEach(() => {
    dispatcher = new Dispatcher();
    sfuClient = new StreamSfuClient({
      dispatcher,
      sessionId: 'session-id-test',
      streamClient: new StreamClient('abc'),
      cid: 'test:123',
      credentials: {
        server: {
          url: 'https://getstream.io/',
          ws_endpoint: 'https://getstream.io/ws',
          edge_name: 'sfu-1',
        },
        token: 'token',
        ice_servers: [],
      },
      tag: 'test',
      enableTracing: false,
    });
    // @ts-expect-error readonly field
    sfuClient.iceTrickleBuffer = new IceTrickleBuffer();

    const streamClient = new StreamClient('test-key');
    const clientStore = new StreamVideoWriteableStateStore();
    call = new Call({
      type: 'default',
      id: 'test-call',
      streamClient,
      clientStore,
      ringing: false,
      watching: false,
    });
    primeForReconnect(call);

    // make the Call.reconnect loop deterministic
    vi.spyOn(connectionUtils, 'sleep').mockResolvedValue(undefined);
    vi.spyOn(call, 'leave').mockResolvedValue(undefined);
    vi.spyOn(call, 'get').mockResolvedValue({} as never);
    vi.spyOn(
      call as unknown as { reconnectRejoin: () => Promise<void> },
      'reconnectRejoin',
    ).mockImplementation(async () => {
      // each REJOIN attempt "succeeds" so the loop exits without bouncing
      call.state.setCallingState(CallingState.JOINED);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Scenario 1 (manual smoke equivalent: 100% packet loss / blocked UDP):
   * a publisher whose ICE never reaches `connected`/`completed` and goes to
   * `failed` should make Call.reconnect count the reason. After
   * `maxIceFailuresWithoutConnect` such failures, the call must `leave`.
   */
  it('publisher ICE failed (never-connected) drives Call.reconnect → webrtc_unsupported_network', async () => {
    call.setMaxIceFailuresWithoutConnect(2);
    const publisher = makePublisherWiredToCall();

    const triggerIceFailedNeverConnected = async () => {
      // @ts-expect-error private field
      publisher['pc'].iceConnectionState = 'failed';
      publisher['onIceConnectionStateChange']();
      // flush the microtask queue so the async reconnect runs
      await new Promise<void>((r) => setTimeout(r, 0));
    };

    await triggerIceFailedNeverConnected();
    expect(call['iceFailuresWithoutConnect']).toBe(1);
    expect(call.leave).not.toHaveBeenCalled();

    // re-arm the loop guard for the second pass
    primeForReconnect(call);
    await triggerIceFailedNeverConnected();

    expect(call['iceFailuresWithoutConnect']).toBe(2);
    expect(call.leave).toHaveBeenCalledWith({
      message: 'webrtc_unsupported_network',
    });
  });

  /**
   * Once ICE has reached `connected`, a subsequent `failed` is a normal
   * recovery case — it should NOT count toward the unsupported-network
   * threshold and should NOT cause leave.
   */
  it('publisher ICE failed AFTER prior connected does NOT count toward unsupported_network', async () => {
    call.setMaxIceFailuresWithoutConnect(1);
    const publisher = makePublisherWiredToCall();
    // restartIce is invoked in the regular path; stub it
    vi.spyOn(publisher, 'restartIce').mockResolvedValue();

    // simulate prior healthy ICE
    // @ts-expect-error private field
    publisher['pc'].iceConnectionState = 'connected';
    publisher['onIceConnectionStateChange']();

    // now ICE drops to failed
    // @ts-expect-error private field
    publisher['pc'].iceConnectionState = 'failed';
    publisher['onIceConnectionStateChange']();
    await new Promise<void>((r) => setTimeout(r, 0));

    expect(call['iceFailuresWithoutConnect']).toBe(0);
    expect(call.leave).not.toHaveBeenCalled();
    // and a regular ICE restart was attempted
    expect(publisher.restartIce).toHaveBeenCalled();
  });

  /**
   * Scenario 4 (manual smoke equivalent: drop only the signal WS while the
   * publisher PC stays `connected`): the FAST path should NOT call
   * `publisher.restartIce()` because the PC is stable.
   */
  it('FAST path skips publisher.restartIce when publisher PC is stable', async () => {
    const publisher = makePublisherWiredToCall();
    // @ts-expect-error private field
    publisher['pc'].iceConnectionState = 'connected';
    publisher['onIceConnectionStateChange']();
    // @ts-expect-error private field
    publisher['pc'].connectionState = 'connected';

    // pretend the publisher has tracks so isPublishing() would return true
    vi.spyOn(publisher, 'isPublishing').mockReturnValue(true);
    const restartIceSpy = vi.spyOn(publisher, 'restartIce').mockResolvedValue();
    const setSfuSpy = vi.spyOn(publisher, 'setSfuClient');
    call['publisher'] = publisher;

    // mimic the FAST branch in doJoin: restoreICE is the gateway
    const publisherIsStable = call['publisher']?.isStable() ?? true;
    const includePublisher =
      !!call['publisher']?.isPublishing() && !publisherIsStable;
    await call['restoreICE'](sfuClient, {
      includeSubscriber: false,
      includePublisher,
    });

    expect(includePublisher).toBe(false);
    expect(setSfuSpy).toHaveBeenCalledWith(sfuClient); // wire still updated
    expect(restartIceSpy).not.toHaveBeenCalled(); // but NO ICE restart
  });

  /**
   * Counterpart to the above: when the publisher PC is NOT stable (e.g.,
   * `disconnected`), the FAST path SHOULD still issue an ICE restart.
   */
  it('FAST path DOES call publisher.restartIce when publisher PC is unstable', async () => {
    const publisher = makePublisherWiredToCall();
    // @ts-expect-error private field
    publisher['pc'].iceConnectionState = 'connected';
    publisher['onIceConnectionStateChange']();
    // @ts-expect-error private field
    publisher['pc'].iceConnectionState = 'disconnected';
    // @ts-expect-error private field
    publisher['pc'].connectionState = 'connected';

    vi.spyOn(publisher, 'isPublishing').mockReturnValue(true);
    const restartIceSpy = vi.spyOn(publisher, 'restartIce').mockResolvedValue();
    call['publisher'] = publisher;

    const publisherIsStable = call['publisher']?.isStable() ?? true;
    const includePublisher =
      !!call['publisher']?.isPublishing() && !publisherIsStable;
    await call['restoreICE'](sfuClient, {
      includeSubscriber: false,
      includePublisher,
    });

    expect(includePublisher).toBe(true);
    expect(restartIceSpy).toHaveBeenCalled();
  });

  /**
   * Counter reset semantics — the fix from the Codex adversarial review:
   * `iceFailuresWithoutConnect` must persist across SFU joins; only an
   * actual ICE-connected event clears it.
   */
  it('iceFailuresWithoutConnect resets when the publisher PC reaches connected', () => {
    call['iceFailuresWithoutConnect'] = 2;
    const publisher = makePublisherWiredToCall();

    // simulate ICE reaching `connected` end-to-end on the publisher
    // @ts-expect-error private field
    publisher['pc'].iceConnectionState = 'connected';
    publisher['onIceConnectionStateChange']();

    expect(call['iceFailuresWithoutConnect']).toBe(0);
  });

  it('onIceConnected fires exactly once per peer-connection lifetime', () => {
    let calls = 0;
    const publisher = new Publisher(
      {
        sfuClient,
        dispatcher,
        state: call.state,
        tag: 'test',
        enableTracing: false,
        onReconnectionNeeded: () => {},
        onIceConnected: () => {
          calls++;
        },
      },
      [],
    );

    // connected → counts
    // @ts-expect-error private field
    publisher['pc'].iceConnectionState = 'connected';
    publisher['onIceConnectionStateChange']();
    expect(calls).toBe(1);

    // disconnected → connected → does NOT fire again
    // @ts-expect-error private field
    publisher['pc'].iceConnectionState = 'disconnected';
    publisher['onIceConnectionStateChange']();
    // @ts-expect-error private field
    publisher['pc'].iceConnectionState = 'connected';
    publisher['onIceConnectionStateChange']();
    expect(calls).toBe(1);
  });

  /**
   * Cross-peer count: a publisher AND a subscriber both failing without ever
   * connecting should add up to the same `iceFailuresWithoutConnect` budget.
   */
  it('publisher + subscriber failures share the same unsupported_network budget', async () => {
    call.setMaxIceFailuresWithoutConnect(2);
    const publisher = makePublisherWiredToCall();
    const subscriber = new Subscriber({
      sfuClient,
      dispatcher,
      state: call.state,
      tag: 'test',
      enableTracing: false,
      onReconnectionNeeded: (kind, reason) => {
        call['reconnect'](kind, reason).catch(() => {});
      },
    });

    // first failure on the publisher
    // @ts-expect-error private field
    publisher['pc'].iceConnectionState = 'failed';
    publisher['onIceConnectionStateChange']();
    await new Promise<void>((r) => setTimeout(r, 0));
    expect(call['iceFailuresWithoutConnect']).toBe(1);
    expect(call.leave).not.toHaveBeenCalled();

    primeForReconnect(call);

    // second failure on the subscriber — same shared counter, trips the limit
    // @ts-expect-error private field
    subscriber['pc'].iceConnectionState = 'failed';
    subscriber['onIceConnectionStateChange']();
    await new Promise<void>((r) => setTimeout(r, 0));

    expect(call['iceFailuresWithoutConnect']).toBe(2);
    expect(call.leave).toHaveBeenCalledWith({
      message: 'webrtc_unsupported_network',
    });
  });

  /**
   * The peerType passed by Subscriber should be `SUBSCRIBER`. (Sanity check
   * of the wiring contract.)
   */
  it('subscriber emits onReconnectionNeeded with PeerType.SUBSCRIBER', () => {
    const onReconnectionNeeded = vi.fn();
    const subscriber = new Subscriber({
      sfuClient,
      dispatcher,
      state: call.state,
      tag: 'test',
      enableTracing: false,
      onReconnectionNeeded,
    });

    // @ts-expect-error private field
    subscriber['pc'].iceConnectionState = 'failed';
    subscriber['onIceConnectionStateChange']();

    expect(onReconnectionNeeded).toHaveBeenCalledWith(
      WebsocketReconnectStrategy.REJOIN,
      ReconnectReason.ICE_NEVER_CONNECTED,
      PeerType.SUBSCRIBER,
    );
  });
});

/**
 * `leave()` runs after both the success path (end of `joinFlow`) and the
 * giveUpAndLeave path. Only the success path resets `reconnectStrategy` /
 * `reconnectReason`. Without resetting them in `leave()` itself, a Call
 * instance reused after a failed-reconnect terminal leave would still see
 * `reconnectStrategy != UNSPECIFIED` on the next `join()` and would send
 * a stale `ReconnectDetails` to the SFU.
 */
describe('Call.leave() reconnect-state reset', () => {
  it('clears reconnectStrategy, reconnectReason, and reconnectAttempts', async () => {
    const call = makeCall();
    call.state.setCallingState(CallingState.JOINED);

    call['reconnectStrategy'] = WebsocketReconnectStrategy.REJOIN;
    call['reconnectReason'] = ReconnectReason.ICE_NEVER_CONNECTED;
    call['reconnectAttempts'] = 3;
    call['iceFailuresWithoutConnect'] = 2;
    call['consecutiveNegotiationFailures'] = 1;

    await call.leave();

    expect(call['reconnectStrategy']).toBe(
      WebsocketReconnectStrategy.UNSPECIFIED,
    );
    expect(call['reconnectReason']).toBe('');
    expect(call['reconnectAttempts']).toBe(0);
    expect(call['iceFailuresWithoutConnect']).toBe(0);
    expect(call['consecutiveNegotiationFailures']).toBe(0);
  });
});
