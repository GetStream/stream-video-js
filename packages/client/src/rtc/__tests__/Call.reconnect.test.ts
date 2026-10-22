import './mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { ClientEventReporter } from '../../reporting';
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
import { SfuJoinError } from '../../errors';
import { FastReconnectRejectedError } from '../../errors/FastReconnectRejectedError';
import { settled } from '../../helpers/concurrency';
import { promiseWithResolvers } from '../../helpers/promise';

vi.mock('../../StreamSfuClient', () => ({
  StreamSfuClient: vi.fn(),
}));

const makeCall = ({ reportingEnabled = false } = {}) => {
  const streamClient = new StreamClient('test-key');
  const clientStore = new StreamVideoWriteableStateStore();
  return new Call({
    type: 'default',
    id: 'test-call',
    streamClient,
    clientEventReporter: new ClientEventReporter({
      streamClient,
      enabled: reportingEnabled,
    }),
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

    describe('long-window backstop', () => {
      /** Spaces consecutive `Date.now()` reads so the short window never trips. */
      const advanceClockOnEveryRead = () => {
        let now = 0;
        vi.spyOn(Date, 'now').mockImplementation(() => (now += 7000));
      };

      afterEach(() => {
        vi.mocked(Date.now).mockRestore();
      });

      it('caps slow REJOIN loops that stay under the short window', async () => {
        advanceClockOnEveryRead();
        const rejoinSpy = vi
          .spyOn(
            call as unknown as { reconnectRejoin: () => Promise<void> },
            'reconnectRejoin',
          )
          .mockRejectedValue(new Error('rejoin failed'));

        await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

        expect(rejoinSpy).toHaveBeenCalledTimes(20);
        expect(call.leave).toHaveBeenCalledWith({
          message: 'rejoin_attempt_limit_exceeded',
        });
      });

      it('is disabled once setRejoinAttemptLimit is called', async () => {
        advanceClockOnEveryRead();
        call.setRejoinAttemptLimit(10, 120);
        let attempts = 0;
        vi.spyOn(
          call as unknown as { reconnectRejoin: () => Promise<void> },
          'reconnectRejoin',
        ).mockImplementation(async () => {
          if (++attempts <= 25) throw new Error('rejoin failed');
          call.state.setCallingState(CallingState.JOINED);
        });

        await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

        expect(attempts).toBe(26);
        expect(call.leave).not.toHaveBeenCalled();
      });

      it('does not count MIGRATE attempts', async () => {
        advanceClockOnEveryRead();
        vi.spyOn(
          call as unknown as { reconnectMigrate: () => Promise<void> },
          'reconnectMigrate',
        ).mockImplementation(async () => {
          call.state.setCallingState(CallingState.JOINED);
        });

        for (let i = 0; i < 25; i++) {
          await call['reconnect'](WebsocketReconnectStrategy.MIGRATE, 'test');
        }

        expect(call.leave).not.toHaveBeenCalled();
      });
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

describe('Call reconnect rejoin SFU migration hints', () => {
  let call: Call;
  const credentials = {
    server: {
      url: 'https://getstream.io/',
      ws_endpoint: 'https://getstream.io/ws',
      edge_name: 'sfu-1',
    },
    token: 'token',
    ice_servers: [],
  };

  beforeEach(() => {
    call = makeCall();
    call['credentials'] = credentials;
    call['joinCallData'] = { create: true };
    primeForReconnect(call);
    call.setRejoinAttemptLimit(3, 60);
    vi.spyOn(connectionUtils, 'sleep').mockResolvedValue(undefined);
    vi.spyOn(call, 'leave').mockResolvedValue(undefined);
    vi.spyOn(call, 'get').mockResolvedValue({} as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('asks the coordinator to avoid an SFU after repeated rejoin failures without leaking migration hints', async () => {
    const doJoinRequestArgs: unknown[] = [];
    const doJoinRequest = vi
      .spyOn(
        call as unknown as {
          doJoinRequest: (data?: unknown) => Promise<unknown>;
        },
        'doJoinRequest',
      )
      .mockImplementation(async (data?: unknown) => {
        doJoinRequestArgs.push(JSON.parse(JSON.stringify(data)));
        throw new Error('rejoin failed');
      });

    await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

    expect(doJoinRequest).toHaveBeenCalledTimes(3);
    expect(doJoinRequestArgs[0]).toEqual({ create: true });
    expect(doJoinRequestArgs[1]).toEqual({ create: true });
    expect(doJoinRequestArgs[2]).toEqual({
      create: true,
      migrating_from: 'sfu-1',
      migrating_from_list: ['sfu-1'],
    });
    expect(call['joinCallData']).toEqual({ create: true });
  });

  it('asks the coordinator to avoid an SFU immediately after an SFU join error', async () => {
    call.setRejoinAttemptLimit(2, 60);
    const doJoinRequestArgs: unknown[] = [];
    const sfuFullError = new SfuJoinError({
      error: {
        code: ErrorCode.SFU_FULL,
        message: 'SFU is full',
      },
      reconnectStrategy: WebsocketReconnectStrategy.REJOIN,
    } as never);
    const doJoinRequest = vi
      .spyOn(
        call as unknown as {
          doJoinRequest: (data?: unknown) => Promise<unknown>;
        },
        'doJoinRequest',
      )
      .mockImplementationOnce(async (data?: unknown) => {
        doJoinRequestArgs.push(JSON.parse(JSON.stringify(data)));
        throw sfuFullError;
      })
      .mockImplementation(async (data?: unknown) => {
        doJoinRequestArgs.push(JSON.parse(JSON.stringify(data)));
        throw new Error('rejoin failed');
      });

    await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

    expect(doJoinRequest).toHaveBeenCalledTimes(2);
    expect(doJoinRequestArgs[0]).toEqual({ create: true });
    expect(doJoinRequestArgs[1]).toEqual({
      create: true,
      migrating_from: 'sfu-1',
      migrating_from_list: ['sfu-1'],
    });
    expect(call['joinCallData']).toEqual({ create: true });
  });

  it('gives every SFU two tries before excluding it (a once-failed SFU is re-served, not yet listed)', async () => {
    call.setRejoinAttemptLimit(5, 60);
    call['credentials'] = {
      ...credentials,
      server: { ...credentials.server, edge_name: 'sfu-a' },
    };

    const pool = ['sfu-a', 'sfu-b', 'sfu-c'];
    const sent: Array<{
      migrating_from?: string;
      migrating_from_list?: string[];
    }> = [];
    vi.spyOn(
      call as unknown as {
        doJoinRequest: (data?: unknown) => Promise<unknown>;
      },
      'doJoinRequest',
    ).mockImplementation(async (data?: unknown) => {
      const clone = JSON.parse(JSON.stringify(data ?? {}));
      sent.push(clone);
      const excluded = new Set<string>(clone.migrating_from_list ?? []);
      const assigned = pool.find((s) => !excluded.has(s)) ?? pool.at(-1)!;
      call['credentials'] = {
        ...credentials,
        server: { ...credentials.server, edge_name: assigned },
      };
      throw new Error('connect failed');
    });

    await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

    expect(sent).toHaveLength(5);
    expect(sent[0].migrating_from_list).toBeUndefined();
    expect(sent[1].migrating_from_list).toBeUndefined();
    expect(sent[2].migrating_from).toBe('sfu-a');
    expect(sent[2].migrating_from_list).toEqual(['sfu-a']);
    expect(sent[3].migrating_from).toBe('sfu-a');
    expect(sent[3].migrating_from_list).toEqual(['sfu-a']);
    expect(sent[3].migrating_from_list).not.toContain('sfu-b');
    expect(sent[4].migrating_from).toBe('sfu-b');
    expect(sent[4].migrating_from_list).toEqual(['sfu-a', 'sfu-b']);

    for (const req of sent) {
      if (req.migrating_from) {
        expect(req.migrating_from_list).toContain(req.migrating_from);
      }
    }
    expect(call['joinCallData']).toEqual({ create: true });
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
      clientEventReporter: new ClientEventReporter({ streamClient }),
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

    await call['restoreICE'](sfuClient, { includeSubscriber: false });

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

  describe('ICE gathering completed without local candidates', () => {
    const makePublisher = (onNoLocalCandidates = vi.fn()) =>
      new Publisher(
        {
          sfuClient,
          dispatcher,
          state: call.state,
          tag: 'test',
          enableTracing: false,
          onNoLocalCandidates,
        },
        [],
      );

    const gather = (publisher: Publisher, candidates: string[]) => {
      // @ts-expect-error private field
      publisher['pc'].iceGatheringState = 'gathering';
      publisher['onIceGatherChange']();
      for (const candidate of candidates) {
        publisher['onIceCandidate']({
          candidate: { candidate, sdpMid: '0', sdpMLineIndex: 0 },
        } as unknown as RTCPeerConnectionIceEvent);
      }
      // @ts-expect-error private field
      publisher['pc'].iceGatheringState = 'complete';
      publisher['onIceGatherChange']();
    };

    beforeEach(() => {
      sfuClient.iceTrickle = vi.fn().mockResolvedValue(undefined);
    });

    it('reports a gathering round without candidates', () => {
      const onNoLocalCandidates = vi.fn();
      const publisher = makePublisher(onNoLocalCandidates);

      gather(publisher, []);

      expect(onNoLocalCandidates).toHaveBeenCalledWith(
        PeerType.PUBLISHER_UNSPECIFIED,
      );
      expect(publisher.hasNoLocalCandidates()).toBe(true);
    });

    it('does not report a round that gathered a candidate', () => {
      const onNoLocalCandidates = vi.fn();
      const publisher = makePublisher(onNoLocalCandidates);

      gather(publisher, []);
      gather(publisher, [
        'candidate:1 1 udp 2122260223 10.0.0.1 50000 typ host',
      ]);

      expect(onNoLocalCandidates).toHaveBeenCalledTimes(1);
      expect(publisher.hasNoLocalCandidates()).toBe(false);
    });

    it('does not report once ICE has connected', () => {
      const onNoLocalCandidates = vi.fn();
      const publisher = makePublisher(onNoLocalCandidates);
      // @ts-expect-error private field
      publisher['pc'].iceConnectionState = 'connected';
      publisher['onIceConnectionStateChange']();

      gather(publisher, []);

      expect(onNoLocalCandidates).not.toHaveBeenCalled();
    });

    it('does not report after dispose', async () => {
      const onNoLocalCandidates = vi.fn();
      const publisher = makePublisher(onNoLocalCandidates);
      await publisher.dispose();

      gather(publisher, []);

      expect(onNoLocalCandidates).not.toHaveBeenCalled();
    });
  });

  it.each([
    ['reconnecting', CallingState.RECONNECTING, false],
    ['offline', CallingState.OFFLINE, false],
    ['restarting ICE', CallingState.JOINED, true],
  ])(
    'records an ICE connection established while %s',
    (_, callingState, isIceRestarting) => {
      const onIceConnected = vi.fn();
      call.state.setCallingState(callingState);
      const publisher = new Publisher(
        {
          sfuClient,
          dispatcher,
          state: call.state,
          tag: 'test',
          enableTracing: false,
          onIceConnected,
        },
        [],
      );
      publisher['isIceRestarting'] = isIceRestarting;

      // @ts-expect-error private field
      publisher['pc'].iceConnectionState = 'connected';
      publisher['onIceConnectionStateChange']();

      expect(publisher.hasIceEverConnected()).toBe(true);
      expect(onIceConnected).toHaveBeenCalledTimes(1);
    },
  );
});

/**
 * `handleSfuSignalClose` is the bridge from a dead signal WS to the reconnect
 * loop. A reconnect swaps in a fresh SFU client, but the old socket can still
 * fire a (delayed) `close` later. Such stragglers must be ignored: only the
 * currently-active client may drive a reconnect.
 */
describe('Call.handleSfuSignalClose superseded-client guard', () => {
  let call: Call;

  beforeEach(() => {
    call = makeCall();
    vi.spyOn(call, 'leave').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('ignores a signal close from a superseded SFU client', () => {
    call.state.setCallingState(CallingState.JOINED);
    const reconnectSpy = vi
      .spyOn(call as unknown as { reconnect: () => Promise<void> }, 'reconnect')
      .mockResolvedValue(undefined);

    const currentClient = { isLeaving: false, isClosingClean: false };
    const supersededClient = { isLeaving: false, isClosingClean: false };
    (call as unknown as { sfuClient: unknown }).sfuClient = currentClient;

    // a close from a client that is no longer active must not reconnect
    call['handleSfuSignalClose'](
      supersededClient as unknown as StreamSfuClient,
      '1006 ',
    );
    expect(reconnectSpy).not.toHaveBeenCalled();

    // the active client's close still drives a reconnect
    call['handleSfuSignalClose'](
      currentClient as unknown as StreamSfuClient,
      '1006 ',
    );
    expect(reconnectSpy).toHaveBeenCalledTimes(1);
  });
});

/**
 * The SFU closes its socket on `callEnded` while `leave()` is still tearing
 * down (state JOINED). That close must not start a reconnect that outlives the
 * leave and rejoins the ended call.
 */
describe('Call reconnect vs leave race', () => {
  let call: Call;
  let fast: ReturnType<typeof vi.spyOn>;
  let rejoin: ReturnType<typeof vi.spyOn>;
  let sfuClient: {
    isLeaving: boolean;
    isClosingClean: boolean;
    leaveAndClose: () => Promise<void>;
  };
  let disposing: ReturnType<typeof promiseWithResolvers<void>>;
  let publisherDisposed: ReturnType<typeof promiseWithResolvers<void>>;

  beforeEach(() => {
    call = makeCall();
    call.state.setCallingState(CallingState.JOINED);
    fast = vi
      .spyOn(
        call as unknown as { reconnectFast: () => Promise<void> },
        'reconnectFast',
      )
      .mockResolvedValue(undefined);
    rejoin = vi
      .spyOn(
        call as unknown as { reconnectRejoin: () => Promise<void> },
        'reconnectRejoin',
      )
      .mockResolvedValue(undefined);

    sfuClient = {
      isLeaving: false,
      isClosingClean: false,
      leaveAndClose: vi.fn().mockResolvedValue(undefined),
    };
    // leave() stalls on the publisher dispose, with the call still JOINED
    disposing = promiseWithResolvers<void>();
    publisherDisposed = promiseWithResolvers<void>();
    Object.assign(call as unknown as Record<string, unknown>, {
      sfuClient,
      subscriber: { isHealthy: () => true, dispose: vi.fn() },
      publisher: {
        isHealthy: () => true,
        dispose: () => {
          disposing.resolve();
          return publisherDisposed.promise;
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not reconnect when the SFU signal closes during leave()', async () => {
    const leave = call.leave();
    await disposing.promise;
    call['handleSfuSignalClose'](
      sfuClient as unknown as StreamSfuClient,
      '1006 ',
    );
    publisherDisposed.resolve();
    await leave;
    await settled(call['reconnectConcurrencyTag']);

    expect(fast).not.toHaveBeenCalled();
    expect(rejoin).not.toHaveBeenCalled();
    expect(call.state.callingState).toBe(CallingState.LEFT);
    expect(call['leavesInProgress']).toBe(0);
  });

  it('bails on any reconnect trigger while leave() is in progress', async () => {
    const leave = call.leave();
    await disposing.promise;

    await call['reconnect'](WebsocketReconnectStrategy.FAST, 'test');
    await call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

    expect(fast).not.toHaveBeenCalled();
    expect(rejoin).not.toHaveBeenCalled();
    publisherDisposed.resolve();
    await leave;
  });

  it('still reconnects while setup() holds the join/leave lock', async () => {
    call['initialized'] = true;
    // get(), getOrCreate() and ring events run setup() on a live call
    const setup = call.setup();

    await call['reconnect'](WebsocketReconnectStrategy.FAST, 'test');
    await setup;

    expect(fast).toHaveBeenCalledTimes(1);
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

/**
 * The SFU reports `PARTICIPANT_MEDIA_TRANSPORT_FAILURE` (205) when a peer
 * connection never establishes its transport, e.g. when the device gathers
 * no ICE candidates at all. That must count toward the unsupported-network
 * budget, otherwise the SFU-driven REJOIN loops forever.
 */
describe('Call SFU media transport failure', () => {
  let call: Call;

  const dispatchSfuError = (code: ErrorCode, tag = 'active') => {
    call['dispatcher'].dispatch(
      {
        eventPayload: {
          oneofKind: 'error',
          error: {
            error: {
              code,
              message: 'publisher PC negotiation failed',
              shouldRetry: false,
            },
            reconnectStrategy: WebsocketReconnectStrategy.REJOIN,
          },
        },
      },
      tag,
    );
  };

  const setPeerConnections = (connected: {
    publisher: boolean;
    subscriber: boolean;
  }) => {
    call['publisher'] = {
      hasIceEverConnected: () => connected.publisher,
    } as unknown as Publisher;
    call['subscriber'] = {
      hasIceEverConnected: () => connected.subscriber,
    } as unknown as Subscriber;
  };

  beforeEach(() => {
    call = makeCall();
    vi.spyOn(connectionUtils, 'sleep').mockResolvedValue(undefined);
    vi.spyOn(call, 'leave').mockResolvedValue(undefined);
    vi.spyOn(call, 'get').mockResolvedValue({} as never);
    vi.spyOn(
      call as unknown as { reconnectRejoin: () => Promise<void> },
      'reconnectRejoin',
    ).mockImplementation(async () => {
      call.state.setCallingState(CallingState.JOINED);
    });
    call['registerReconnectHandlers']();
    call['sfuClient'] = { tag: 'active' } as unknown as StreamSfuClient;
    call.state.setCallingState(CallingState.JOINED);
  });

  afterEach(() => {
    call['publisher'] = undefined;
    call['subscriber'] = undefined;
    call['sfuClient'] = undefined;
    vi.clearAllMocks();
  });

  it('leaves with webrtc_unsupported_network after two failures before connect', async () => {
    call.setMaxIceFailuresWithoutConnect(2);
    setPeerConnections({ publisher: false, subscriber: false });

    dispatchSfuError(ErrorCode.PARTICIPANT_MEDIA_TRANSPORT_FAILURE);
    await settled(call['reconnectConcurrencyTag']);
    expect(call['iceFailuresWithoutConnect']).toBe(1);
    expect(call.leave).not.toHaveBeenCalled();

    dispatchSfuError(ErrorCode.PARTICIPANT_MEDIA_TRANSPORT_FAILURE);
    await settled(call['reconnectConcurrencyTag']);
    expect(call.leave).toHaveBeenCalledWith({
      message: 'webrtc_unsupported_network',
    });
  });

  it('does not count the failure when a peer connection has connected', async () => {
    call.setMaxIceFailuresWithoutConnect(1);
    setPeerConnections({ publisher: false, subscriber: true });

    dispatchSfuError(ErrorCode.PARTICIPANT_MEDIA_TRANSPORT_FAILURE);
    await settled(call['reconnectConcurrencyTag']);

    expect(call['iceFailuresWithoutConnect']).toBe(0);
    expect(call.leave).not.toHaveBeenCalled();
    expect(call['reconnectRejoin']).toHaveBeenCalledTimes(1);
  });

  it('ignores errors from a superseded SFU client', async () => {
    call.setMaxIceFailuresWithoutConnect(1);
    setPeerConnections({ publisher: false, subscriber: false });
    call['sfuClient'] = { tag: '2' } as unknown as StreamSfuClient;

    dispatchSfuError(ErrorCode.PARTICIPANT_MEDIA_TRANSPORT_FAILURE, '1');
    await settled(call['reconnectConcurrencyTag']);
    expect(call['reconnectRejoin']).not.toHaveBeenCalled();

    dispatchSfuError(ErrorCode.PARTICIPANT_MEDIA_TRANSPORT_FAILURE, '2');
    await settled(call['reconnectConcurrencyTag']);
    expect(call.leave).toHaveBeenCalledWith({
      message: 'webrtc_unsupported_network',
    });
  });

  it('ignores errors while no SFU client is active', async () => {
    call.setMaxIceFailuresWithoutConnect(1);
    setPeerConnections({ publisher: false, subscriber: false });
    call['sfuClient'] = undefined;

    dispatchSfuError(ErrorCode.PARTICIPANT_MEDIA_TRANSPORT_FAILURE, '1');
    await settled(call['reconnectConcurrencyTag']);

    expect(call['reconnectRejoin']).not.toHaveBeenCalled();
    expect(call.leave).not.toHaveBeenCalled();
  });

  it('does not count other SFU errors before connect', async () => {
    call.setMaxIceFailuresWithoutConnect(1);
    setPeerConnections({ publisher: false, subscriber: false });

    dispatchSfuError(ErrorCode.PARTICIPANT_SIGNAL_LOST);
    await settled(call['reconnectConcurrencyTag']);

    expect(call['iceFailuresWithoutConnect']).toBe(0);
    expect(call.leave).not.toHaveBeenCalled();
  });
});

/**
 * A peer connection that gathered no local ICE candidates reports it to
 * `Call`, which escalates once no join or reconnect is in flight, so the
 * escalation is neither dropped by `reconnect` nor raced against a join.
 */
describe('Call no-local-candidates escalation', () => {
  let call: Call;

  const setPeerConnections = (pcs: {
    connected?: boolean;
    noLocalCandidates?: boolean;
  }) => {
    const fake = {
      hasIceEverConnected: () => pcs.connected ?? false,
      hasNoLocalCandidates: () => pcs.noLocalCandidates ?? true,
    };
    call['publisher'] = fake as unknown as Publisher;
    call['subscriber'] = {
      hasIceEverConnected: () => false,
      hasNoLocalCandidates: () => false,
    } as unknown as Subscriber;
  };

  const flush = async () => {
    await call['waitForJoinsAndReconnects']();
    await new Promise<void>((r) => setTimeout(r, 0));
    await settled(call['reconnectConcurrencyTag']);
  };

  beforeEach(() => {
    call = makeCall();
    vi.spyOn(connectionUtils, 'sleep').mockResolvedValue(undefined);
    vi.spyOn(call, 'leave').mockResolvedValue(undefined);
    vi.spyOn(call, 'get').mockResolvedValue({} as never);
    vi.spyOn(
      call as unknown as { reconnectRejoin: () => Promise<void> },
      'reconnectRejoin',
    ).mockImplementation(async () => {
      call.state.setCallingState(CallingState.JOINED);
    });
    call.state.setCallingState(CallingState.JOINED);
  });

  afterEach(() => {
    call['publisher'] = undefined;
    call['subscriber'] = undefined;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('escalates right away when the call is idle', async () => {
    setPeerConnections({});

    call['checkNoLocalCandidates']();
    await flush();

    expect(call['reconnectRejoin']).toHaveBeenCalledTimes(1);
    expect(call['iceFailuresWithoutConnect']).toBe(1);
  });

  it('defers the escalation until an in-flight reconnect settles', async () => {
    setPeerConnections({});
    const rejoin = promiseWithResolvers<void>();
    vi.mocked(call['reconnectRejoin']).mockImplementationOnce(async () => {
      await rejoin.promise;
      call.state.setCallingState(CallingState.JOINED);
    });
    call['reconnect'](WebsocketReconnectStrategy.REJOIN, 'test');

    call['checkNoLocalCandidates']();
    await new Promise<void>((r) => setTimeout(r, 0));
    expect(call['iceFailuresWithoutConnect']).toBe(0);

    rejoin.resolve();
    await flush();

    expect(call['reconnectRejoin']).toHaveBeenCalledTimes(2);
    expect(call['iceFailuresWithoutConnect']).toBe(1);
  });

  it('defers the escalation until an in-flight join settles', async () => {
    setPeerConnections({});
    const join = promiseWithResolvers<void>();
    vi.spyOn(
      call as unknown as { performJoin: () => Promise<void> },
      'performJoin',
    ).mockImplementation(async () => {
      await join.promise;
    });
    const joining = call['doJoin']();

    call['checkNoLocalCandidates']();
    await new Promise<void>((r) => setTimeout(r, 0));
    expect(call['reconnectRejoin']).not.toHaveBeenCalled();

    join.resolve();
    await joining;
    await flush();

    expect(call['reconnectRejoin']).toHaveBeenCalledTimes(1);
    expect(call['iceFailuresWithoutConnect']).toBe(1);
  });

  it('does not escalate when a peer connection has connected', async () => {
    setPeerConnections({ connected: true });

    call['checkNoLocalCandidates']();
    await flush();

    expect(call['reconnectRejoin']).not.toHaveBeenCalled();
  });

  it('does not escalate when the current peer connections gathered candidates', async () => {
    setPeerConnections({ noLocalCandidates: false });

    call['checkNoLocalCandidates']();
    await flush();

    expect(call['reconnectRejoin']).not.toHaveBeenCalled();
  });

  it('does not escalate while the browser is offline', async () => {
    setPeerConnections({});
    vi.stubGlobal('navigator', { onLine: false });

    call['checkNoLocalCandidates']();
    await flush();

    expect(call['reconnectRejoin']).not.toHaveBeenCalled();
  });

  it('drops a deferred escalation when the call is left meanwhile', async () => {
    setPeerConnections({});
    const join = promiseWithResolvers<void>();
    vi.spyOn(
      call as unknown as { performJoin: () => Promise<void> },
      'performJoin',
    ).mockImplementation(async () => {
      await join.promise;
    });
    const joining = call['doJoin']();
    call['checkNoLocalCandidates']();

    call['leaveGeneration']++;
    join.resolve();
    await joining;
    await flush();

    expect(call['reconnectRejoin']).not.toHaveBeenCalled();
  });

  it('leaves with webrtc_unsupported_network after two sessions without candidates', async () => {
    call.setMaxIceFailuresWithoutConnect(2);
    setPeerConnections({});

    call['checkNoLocalCandidates']();
    await flush();
    expect(call.leave).not.toHaveBeenCalled();

    call['checkNoLocalCandidates']();
    await flush();
    expect(call.leave).toHaveBeenCalledWith({
      message: 'webrtc_unsupported_network',
    });
  });
});

describe('Call reconnect: fast reconnect rejected by the SFU', () => {
  let call: Call;

  beforeEach(() => {
    call = makeCall();
    vi.spyOn(connectionUtils, 'sleep').mockResolvedValue(undefined);
    vi.spyOn(call, 'leave').mockResolvedValue(undefined);
    vi.spyOn(call, 'get').mockResolvedValue({} as never);
    vi.spyOn(
      call as unknown as { reconnectMigrate: () => Promise<void> },
      'reconnectMigrate',
    ).mockRejectedValue(new Error('migrate stub'));
    vi.spyOn(
      call as unknown as { reconnectRejoin: () => Promise<void> },
      'reconnectRejoin',
    ).mockImplementation(async () => {
      call.state.setCallingState(CallingState.JOINED);
    });
    primeForReconnect(call);
    // keep the deadline far away, so only the error class can force REJOIN
    (
      call as unknown as { fastReconnectDeadlineSeconds: number }
    ).fastReconnectDeadlineSeconds = 3600;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('switches to REJOIN right after a FastReconnectRejectedError', async () => {
    const reconnectFast = vi
      .spyOn(
        call as unknown as { reconnectFast: () => Promise<void> },
        'reconnectFast',
      )
      .mockRejectedValue(
        new FastReconnectRejectedError('SFU did not resume the session'),
      );

    await call['reconnect'](WebsocketReconnectStrategy.FAST, 'test');

    expect(reconnectFast).toHaveBeenCalledTimes(1);
    expect(call['reconnectRejoin']).toHaveBeenCalledTimes(1);
    expect(call.state.callingState).toBe(CallingState.JOINED);
  });

  it('keeps retrying FAST after an ordinary failure', async () => {
    const reconnectFast = vi
      .spyOn(
        call as unknown as { reconnectFast: () => Promise<void> },
        'reconnectFast',
      )
      .mockRejectedValueOnce(new Error('transient'))
      .mockImplementation(async () => {
        call.state.setCallingState(CallingState.JOINED);
      });

    await call['reconnect'](WebsocketReconnectStrategy.FAST, 'test');

    expect(reconnectFast).toHaveBeenCalledTimes(2);
    expect(call['reconnectRejoin']).not.toHaveBeenCalled();
  });

  describe('reconnectFast and the subscriber offer', () => {
    const stubDoJoin = (offerReceived: boolean) =>
      vi
        .spyOn(call as unknown as { doJoin: () => Promise<void> }, 'doJoin')
        .mockImplementation(async () => {
          call.state.setCallingState(CallingState.JOINED);
          (
            call as unknown as { fastReconnectOffer?: Promise<boolean> }
          ).fastReconnectOffer = Promise.resolve(offerReceived);
        });

    it('rejoins when the offer never arrives, leaving JOINED first', async () => {
      stubDoJoin(false);
      await expect(call['reconnectFast']()).rejects.toBeInstanceOf(
        FastReconnectRejectedError,
      );
      // the reconnect loop stops on JOINED, so the throw must not leave it there
      expect(call.state.callingState).toBe(CallingState.RECONNECTING);
    });

    it('checks the offer before refreshing the call state', async () => {
      stubDoJoin(false);
      vi.spyOn(call, 'get').mockRejectedValue(new Error('coordinator down'));
      await expect(call['reconnectFast']()).rejects.toBeInstanceOf(
        FastReconnectRejectedError,
      );
      expect(call.get).not.toHaveBeenCalled();
    });

    it('completes when the offer arrived', async () => {
      stubDoJoin(true);
      await expect(call['reconnectFast']()).resolves.toBeUndefined();
      expect(call.state.callingState).toBe(CallingState.JOINED);
    });
  });
});
