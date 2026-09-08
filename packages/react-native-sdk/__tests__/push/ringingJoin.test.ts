import { BehaviorSubject } from 'rxjs';
import { CallingState } from '@stream-io/video-client';
import {
  beforeJoin,
  onJoinFailed,
  onLeave,
  setRingingCallLifecycleHooks,
} from '../../src/utils/internal/ringingCallLifecycle';

/**
 * React Native prepares a ringing call's join, because the SDK performs that
 * join rather than the app: the accept button joins internally and an outgoing
 * call joins itself once the callee answers. These cover the preparation and the
 * release that pairs with it, in isolation from core.
 */

const createFakeCall = (state = CallingState.RINGING) =>
  ({
    cid: 'default:ringing-test',
    ringing: true,
    leave: jest.fn().mockResolvedValue(undefined),
    state: {
      callingState: state,
      callingState$: new BehaviorSubject<CallingState>(state),
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

describe('beforeJoin', () => {
  it('resolves immediately when no hook is registered', async () => {
    await expect(beforeJoin(createFakeCall())).resolves.toBeUndefined();
  });

  it('starts the hook synchronously and resolves once it finishes', async () => {
    const order: string[] = [];
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn(async () => {
        order.push('hook');
      }),
    });

    const pending = beforeJoin(createFakeCall());
    expect(order).toEqual(['hook']);
    await pending;
  });

  it('rejects when the hook rejects', async () => {
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn().mockRejectedValue(new Error('no key')),
    });

    await expect(beforeJoin(createFakeCall())).rejects.toThrow('no key');
  });

  it('rejects when the hook throws synchronously', async () => {
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn(() => {
        throw new Error('sync boom');
      }),
    });

    await expect(beforeJoin(createFakeCall())).rejects.toThrow('sync boom');
  });

  it('gives up on a hook that outruns its deadline', async () => {
    jest.useFakeTimers();
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn(() => new Promise<void>(() => {})),
    });

    const pending = beforeJoin(createFakeCall()).catch((e: Error) => e.message);
    jest.advanceTimersByTime(5_000);

    await expect(pending).resolves.toContain('did not settle within 5000ms');
  });
});

describe('release pairing', () => {
  it('releases on leave what the hook installed', async () => {
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn().mockResolvedValue(undefined),
      onAfterCallLeave,
    });
    const call = createFakeCall();

    await beforeJoin(call);
    onLeave(call);
    await flush();

    expect(onAfterCallLeave).toHaveBeenCalledWith(call);
  });

  it('releases even when the hook rejected, because it may have installed something', async () => {
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn().mockRejectedValue(new Error('half done')),
      onAfterCallLeave,
    });
    const call = createFakeCall();

    await beforeJoin(call).catch(() => {});
    onLeave(call);
    await flush();

    expect(onAfterCallLeave).toHaveBeenCalledTimes(1);
  });

  it('releases exactly once when a failure is followed by a leave', async () => {
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn().mockResolvedValue(undefined),
      onAfterCallLeave,
    });
    // already LEFT, so the failure handler does not leave again
    const call = createFakeCall(CallingState.LEFT);

    await beforeJoin(call);
    await onJoinFailed(call);
    await flush();
    expect(onAfterCallLeave).toHaveBeenCalledTimes(1);

    onLeave(call);
    await flush();
    expect(onAfterCallLeave).toHaveBeenCalledTimes(1);
  });

  it('waits for a timed-out hook to settle before releasing', async () => {
    jest.useFakeTimers();
    let finishHook: () => void = () => {};
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn(
        () => new Promise<void>((resolve) => (finishHook = resolve)),
      ),
      onAfterCallLeave,
    });
    const call = createFakeCall(CallingState.LEFT);

    const timedOut = beforeJoin(call).catch(() => 'timed-out');
    jest.advanceTimersByTime(5_000);
    await expect(timedOut).resolves.toBe('timed-out');

    // the failure handler must not wait on a promise it cannot cancel
    await onJoinFailed(call);
    expect(onAfterCallLeave).not.toHaveBeenCalled();

    // ...but whatever the hook installs late is still released
    finishHook();
    await flush();
    expect(onAfterCallLeave).toHaveBeenCalledWith(call);
  });

  it('releases nothing for a call whose setup never ran', () => {
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn().mockResolvedValue(undefined),
      onAfterCallLeave,
    });

    onLeave(createFakeCall());

    expect(onAfterCallLeave).not.toHaveBeenCalled();
  });

  it('keeps each call to its own resource', async () => {
    const released: string[] = [];
    let finishA: () => void = () => {};
    const onBeforeCallJoin = jest
      .fn()
      .mockImplementationOnce(
        () => new Promise<void>((resolve) => (finishA = resolve)),
      )
      .mockResolvedValue(undefined);
    setRingingCallLifecycleHooks({
      onBeforeCallJoin,
      onAfterCallLeave: (call) => {
        released.push(call.cid);
      },
    });
    const a = createFakeCall();
    a.cid = 'default:a';
    const b = createFakeCall();
    b.cid = 'default:b';

    // A is abandoned with its hook still running, then B joins and stays
    const abandoned = beforeJoin(a);
    onLeave(a);
    await beforeJoin(b);

    finishA();
    await abandoned;
    await flush();

    expect(released).toEqual(['default:a']);
  });

  it('swallows a synchronous throw from the release hook', async () => {
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn().mockResolvedValue(undefined),
      onAfterCallLeave: jest.fn(() => {
        throw new Error('cleanup exploded');
      }),
    });
    const call = createFakeCall();

    await beforeJoin(call);
    expect(() => onLeave(call)).not.toThrow();
    await flush();
  });
});

/**
 * An app may register only `onAfterCallLeave` - it has nothing to install before
 * a join, but still owns something per call that has to be freed. With no setup
 * hook to pair with, the release belongs to the call ending, so it must fire for
 * every ringing call that ends.
 */
describe('release-only registration', () => {
  it('releases a call that joined successfully', async () => {
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({ onAfterCallLeave });
    const call = createFakeCall();

    await beforeJoin(call);
    onLeave(call);

    expect(onAfterCallLeave).toHaveBeenCalledTimes(1);
    expect(onAfterCallLeave).toHaveBeenCalledWith(call);
  });

  it('releases a call that was declined without ever joining', () => {
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({ onAfterCallLeave });

    onLeave(createFakeCall());

    expect(onAfterCallLeave).toHaveBeenCalledTimes(1);
  });
});

describe('onJoinFailed', () => {
  it('ends the flow so the ringing UI cannot offer the failed call again', async () => {
    setRingingCallLifecycleHooks({});
    const call = createFakeCall();

    await onJoinFailed(call);

    expect(call.leave).toHaveBeenCalledWith({ reject: false });
  });

  it('does not leave a call that has already left', async () => {
    const call = createFakeCall(CallingState.LEFT);

    await onJoinFailed(call);

    expect(call.leave).not.toHaveBeenCalled();
  });

  it('never rejects, so the join error survives a failing leave', async () => {
    const call = createFakeCall();
    call.leave.mockRejectedValue(new Error('leave blew up'));

    await expect(onJoinFailed(call)).resolves.toBeUndefined();
  });
});
