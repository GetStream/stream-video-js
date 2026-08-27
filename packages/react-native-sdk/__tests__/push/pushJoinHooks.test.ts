import { BehaviorSubject } from 'rxjs';
import { CallingState } from '@stream-io/video-client';
import { processCallFromPushInBackground } from '../../src/utils/push/internal/utils';
import { pushUnsubscriptionCallbacks } from '../../src/utils/push/internal/constants';

/**
 * Covers the two `setPushConfig` lifecycle hooks on the push-accept path.
 *
 * This path is the reason they exist: the call is created and joined inside the SDK
 * from the push payload, so an app that needs per-call setup before the join - an
 * E2EE manager above all - has no other window. The tests therefore care about
 * ordering (setup strictly before join) and about the fail-closed contract, not just
 * that the callbacks fire.
 */

const CALL_CID = 'default:push-hook-test';

type FakeCall = {
  cid: string;
  state: {
    callingState: CallingState;
    callingState$: BehaviorSubject<CallingState>;
    session: undefined;
    endedAt: undefined;
    members: never[];
  };
  currentUserId: string;
  join: jest.Mock;
  leave: jest.Mock;
  updatePublishOptions: jest.Mock;
};

const createFakeCall = (): FakeCall => {
  const callingState$ = new BehaviorSubject<CallingState>(CallingState.RINGING);
  return {
    cid: CALL_CID,
    state: {
      callingState: CallingState.RINGING,
      callingState$,
      session: undefined,
      endedAt: undefined,
      members: [],
    },
    currentUserId: 'me',
    join: jest.fn().mockResolvedValue(undefined),
    leave: jest.fn().mockResolvedValue(undefined),
    updatePublishOptions: jest.fn(),
  };
};

const createPushConfig = (call: FakeCall, overrides: object = {}) =>
  ({
    createStreamVideoClient: jest
      .fn()
      .mockResolvedValue({ onRingingCall: jest.fn().mockResolvedValue(call) }),
    ...overrides,
  }) as any;

const accept = (pushConfig: any) =>
  processCallFromPushInBackground(
    pushConfig,
    CALL_CID,
    'accept',
    () => undefined,
  );

describe('push accept lifecycle hooks', () => {
  afterEach(() => {
    pushUnsubscriptionCallbacks.delete(CALL_CID);
    jest.restoreAllMocks();
  });

  describe('onBeforeCallJoin', () => {
    it('is awaited before the call joins', async () => {
      const call = createFakeCall();
      const order: string[] = [];
      call.join.mockImplementation(async () => {
        order.push('join');
      });
      const onBeforeCallJoin = jest.fn(async () => {
        // resolves on a later tick, so a non-awaiting implementation would
        // record 'join' first and fail this
        await new Promise((resolve) => setTimeout(resolve, 10));
        order.push('hook');
      });

      await accept(createPushConfig(call, { onBeforeCallJoin }));

      expect(order).toEqual(['hook', 'join']);
      expect(onBeforeCallJoin).toHaveBeenCalledWith(call);
    });

    it('aborts the join when it throws', async () => {
      const call = createFakeCall();
      const onBeforeCallJoin = jest
        .fn()
        .mockRejectedValue(new Error('no key available'));

      await accept(createPushConfig(call, { onBeforeCallJoin }));

      // fail closed: joining anyway would publish unencrypted media on a call
      // the user believes is private, with no UI on this path to reveal it
      expect(call.join).not.toHaveBeenCalled();
    });

    it('reports the failure to iOS so CallKit does not hang', async () => {
      const call = createFakeCall();
      const onIOSActionCanBeFulfilled = jest.fn();

      await processCallFromPushInBackground(
        createPushConfig(call, {
          onBeforeCallJoin: jest.fn().mockRejectedValue(new Error('boom')),
        }),
        CALL_CID,
        'accept',
        onIOSActionCanBeFulfilled,
      );

      expect(onIOSActionCanBeFulfilled).toHaveBeenCalledWith(true);
    });

    it('aborts the join when it outruns the timeout', async () => {
      jest.useFakeTimers();
      try {
        const call = createFakeCall();
        const pending = accept(
          createPushConfig(call, {
            onBeforeCallJoin: jest.fn(() => new Promise<void>(() => {})),
          }),
        );
        // let createStreamVideoClient/onRingingCall settle, then burn the budget
        await Promise.resolve();
        await Promise.resolve();
        await jest.advanceTimersByTimeAsync(5_000);
        await pending;

        expect(call.join).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it('joins normally when absent', async () => {
      const call = createFakeCall();

      await accept(createPushConfig(call));

      expect(call.join).toHaveBeenCalledTimes(1);
    });
  });

  describe('onAfterCallLeave', () => {
    it('fires exactly once when the call leaves', async () => {
      const call = createFakeCall();
      const onAfterCallLeave = jest.fn();

      await accept(
        createPushConfig(call, {
          onBeforeCallJoin: jest.fn().mockResolvedValue(undefined),
          onAfterCallLeave,
        }),
      );
      expect(onAfterCallLeave).not.toHaveBeenCalled();

      call.state.callingState$.next(CallingState.JOINED);
      expect(onAfterCallLeave).not.toHaveBeenCalled();

      call.state.callingState$.next(CallingState.LEFT);
      // a second LEFT must not double-release a manager that is already disposed
      call.state.callingState$.next(CallingState.LEFT);

      expect(onAfterCallLeave).toHaveBeenCalledTimes(1);
      expect(onAfterCallLeave).toHaveBeenCalledWith(call);
    });

    it('fires when the join fails after the pre-join hook already ran', async () => {
      const call = createFakeCall();
      call.join.mockRejectedValue(new Error('sfu unreachable'));
      const onAfterCallLeave = jest.fn();

      await accept(
        createPushConfig(call, {
          onBeforeCallJoin: jest.fn().mockResolvedValue(undefined),
          onAfterCallLeave,
        }),
      );

      // the call never joins and may never reach LEFT, so whatever the pre-join
      // hook installed would otherwise be stranded for the process lifetime
      expect(onAfterCallLeave).toHaveBeenCalledTimes(1);
    });

    it('does not fire when the pre-join hook aborted the join', async () => {
      const call = createFakeCall();
      const onAfterCallLeave = jest.fn();

      await accept(
        createPushConfig(call, {
          onBeforeCallJoin: jest.fn().mockRejectedValue(new Error('boom')),
          onAfterCallLeave,
        }),
      );
      call.state.callingState$.next(CallingState.LEFT);

      // nothing was set up, so there is nothing to release
      expect(onAfterCallLeave).not.toHaveBeenCalled();
    });

    it('swallows a rejection rather than leaking an unhandled one', async () => {
      const call = createFakeCall();
      const unhandled = jest.fn();
      process.on('unhandledRejection', unhandled);
      try {
        await accept(
          createPushConfig(call, {
            onAfterCallLeave: jest
              .fn()
              .mockRejectedValue(new Error('cleanup failed')),
          }),
        );
        call.state.callingState$.next(CallingState.LEFT);
        await new Promise((resolve) => setImmediate(resolve));

        expect(unhandled).not.toHaveBeenCalled();
      } finally {
        process.off('unhandledRejection', unhandled);
      }
    });

    it('swallows a synchronous throw', async () => {
      const call = createFakeCall();
      const onAfterCallLeave = jest.fn(() => {
        throw new Error('cleanup exploded');
      });

      await accept(createPushConfig(call, { onAfterCallLeave }));

      expect(() =>
        call.state.callingState$.next(CallingState.LEFT),
      ).not.toThrow();
      expect(onAfterCallLeave).toHaveBeenCalledTimes(1);
    });

    it('registers an unsubscribe so foreground processing can clear it', async () => {
      const call = createFakeCall();

      await accept(createPushConfig(call, { onAfterCallLeave: jest.fn() }));

      expect(pushUnsubscriptionCallbacks.get(CALL_CID)?.length).toBeGreaterThan(
        0,
      );
    });

    it('registers nothing when absent', async () => {
      const call = createFakeCall();

      await accept(createPushConfig(call));

      expect(pushUnsubscriptionCallbacks.get(CALL_CID)).toBeUndefined();
    });
  });
});
