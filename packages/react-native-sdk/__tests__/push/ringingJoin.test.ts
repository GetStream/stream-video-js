import { BehaviorSubject } from 'rxjs';
import { CallingState } from '@stream-io/video-client';
import {
  onLeave,
  RingingJoinBusyError,
  runJoin,
  setRingingCallLifecycleHooks,
} from '../../src/utils/internal/ringingCallLifecycle';

/**
 * React Native owns a ringing call's join, because the SDK performs it rather
 * than the app: the accept button joins internally and an outgoing call joins
 * itself once the callee answers. These cover that ownership - the hook runs
 * before the join, a failure never joins, duplicates do not double-register, and
 * only one attempt is ever in flight for a call.
 */

const createFakeCall = (cid = 'default:ringing-test') =>
  ({
    cid,
    ringing: true,
    state: {
      callingState: CallingState.RINGING,
      callingState$: new BehaviorSubject<CallingState>(CallingState.RINGING),
    },
  }) as any;

const flush = async (times = 8) => {
  for (let i = 0; i < times; i++) await Promise.resolve();
};

afterEach(() => {
  setRingingCallLifecycleHooks({});
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('runJoin', () => {
  it('awaits the hook before the join proceeds', async () => {
    const order: string[] = [];
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn(async () => {
        order.push('hook');
      }),
    });

    await runJoin(createFakeCall(), async () => {
      order.push('join');
    });

    expect(order).toEqual(['hook', 'join']);
  });

  it('joins normally when no hooks are registered', async () => {
    const proceed = jest.fn().mockResolvedValue(undefined);
    await runJoin(createFakeCall(), proceed);
    expect(proceed).toHaveBeenCalledTimes(1);
  });

  it('does not join when the hook rejects, and releases what it installed', async () => {
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn().mockRejectedValue(new Error('no key')),
      onAfterCallLeave,
    });
    const proceed = jest.fn();
    const call = createFakeCall();

    await expect(runJoin(call, proceed)).rejects.toThrow('no key');
    await flush();

    expect(proceed).not.toHaveBeenCalled();
    expect(onAfterCallLeave).toHaveBeenCalledWith(call);
  });

  it('does not join when the hook throws synchronously', async () => {
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn(() => {
        throw new Error('sync boom');
      }),
    });
    const proceed = jest.fn();

    await expect(runJoin(createFakeCall(), proceed)).rejects.toThrow(
      'sync boom',
    );
    expect(proceed).not.toHaveBeenCalled();
  });

  it('coalesces a duplicate trigger onto the live attempt', async () => {
    let finishHook: () => void = () => {};
    const onBeforeCallJoin = jest.fn(
      () => new Promise<void>((resolve) => (finishHook = resolve)),
    );
    setRingingCallLifecycleHooks({ onBeforeCallJoin });
    const proceed = jest.fn().mockResolvedValue(undefined);
    const call = createFakeCall();

    // a push acceptance racing an in-app tap
    const first = runJoin(call, proceed);
    const second = runJoin(call, proceed);
    finishHook();
    await Promise.all([first, second]);

    expect(onBeforeCallJoin).toHaveBeenCalledTimes(1);
    expect(proceed).toHaveBeenCalledTimes(1);
  });

  it('refuses a retry while a cancelled attempt is still settling', async () => {
    let finishHook: () => void = () => {};
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn(
        () => new Promise<void>((resolve) => (finishHook = resolve)),
      ),
      onAfterCallLeave: jest.fn(),
    });
    const call = createFakeCall();

    const cancelled = runJoin(call, jest.fn());
    onLeave(call);

    await expect(runJoin(call, jest.fn())).rejects.toBeInstanceOf(
      RingingJoinBusyError,
    );

    finishHook();
    await cancelled.catch(() => {});
  });

  it('allows a retry once the cancelled attempt has settled', async () => {
    let finishHook: () => void = () => {};
    const onBeforeCallJoin = jest
      .fn()
      .mockImplementationOnce(
        () => new Promise<void>((resolve) => (finishHook = resolve)),
      )
      .mockResolvedValue(undefined);
    setRingingCallLifecycleHooks({
      onBeforeCallJoin,
      onAfterCallLeave: jest.fn(),
    });
    const call = createFakeCall();

    const cancelled = runJoin(call, jest.fn());
    onLeave(call);
    finishHook();
    await cancelled.catch(() => {});
    await flush();

    const proceed = jest.fn().mockResolvedValue(undefined);
    await runJoin(call, proceed);

    expect(onBeforeCallJoin).toHaveBeenCalledTimes(2);
    expect(proceed).toHaveBeenCalledTimes(1);
  });

  it('releases a hook that completes after its deadline', async () => {
    jest.useFakeTimers();
    let finishHook: () => void = () => {};
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn(
        () => new Promise<void>((resolve) => (finishHook = resolve)),
      ),
      onAfterCallLeave,
    });
    const call = createFakeCall();

    const timedOut = runJoin(call, jest.fn()).catch(() => 'timed-out');
    jest.advanceTimersByTime(5_000);
    await expect(timedOut).resolves.toBe('timed-out');

    // the hook is still running and may yet install something
    expect(onAfterCallLeave).not.toHaveBeenCalled();
    finishHook();
    await flush();

    expect(onAfterCallLeave).toHaveBeenCalledWith(call);
  });

  it('keeps retries unavailable while an unsettled hook is still running', async () => {
    jest.useFakeTimers();
    setRingingCallLifecycleHooks({
      // documented limitation: a hook that never settles cannot be cancelled, so
      // this lifecycle stays busy rather than allowing an overlapping takeover
      onBeforeCallJoin: jest.fn(() => new Promise<void>(() => {})),
      onAfterCallLeave: jest.fn(),
    });
    const call = createFakeCall();

    const stuck = runJoin(call, jest.fn()).catch(() => 'timed-out');
    jest.advanceTimersByTime(5_000);
    await stuck;
    onLeave(call);

    await expect(runJoin(call, jest.fn())).rejects.toBeInstanceOf(
      RingingJoinBusyError,
    );
  });
});

describe('onLeave', () => {
  it('releases a call that already finished joining', async () => {
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn().mockResolvedValue(undefined),
      onAfterCallLeave,
    });
    const call = createFakeCall();

    await runJoin(call, jest.fn().mockResolvedValue(undefined));
    await flush();
    onLeave(call);

    expect(onAfterCallLeave).toHaveBeenCalledWith(call);
  });

  it('swallows a synchronous throw from the release hook', () => {
    setRingingCallLifecycleHooks({
      onAfterCallLeave: jest.fn(() => {
        throw new Error('cleanup exploded');
      }),
    });

    expect(() => onLeave(createFakeCall())).not.toThrow();
  });
});
