import { Call, CallingState, StreamVideoClient } from '@stream-io/video-client';
import {
  beforeJoin,
  onJoinFailed,
  onLeave,
  setRingingCallLifecycleHooks,
} from '../../src/utils/internal/ringingCallLifecycle';

/**
 * Drives a real `Call` against the real RN preparation module through the globals
 * bridge. The unit suites either stub the owner inside core or call the module
 * with a fake call; between them they miss the dispatch, the ordering against
 * native registration and media setup, and what a failed join does to the call.
 *
 * One `Call` is one call flow here, as the public contract says: nothing below
 * rejoins an instance it has left.
 */

const endCall = jest.fn().mockResolvedValue(undefined);
const joinCall = jest.fn().mockResolvedValue(undefined);

type Kind = 'incoming' | 'outgoing' | 'ring-option';

const createCall = (kind: Kind = 'ring-option') => {
  const client = new StreamVideoClient({
    apiKey: 'abc',
    // no network from these fixtures: the reporter would otherwise post call
    // telemetry after the test has finished and fail the run on a late log
    options: { clientEventsReportingEnabled: false, logLevel: 'error' },
  });
  const call =
    kind === 'ring-option'
      ? client.call('test', `int-${Math.random().toString(36).slice(2)}`)
      : // an incoming or outgoing ringing call is built ringing by the SDK, well
        // before anything calls `join()` on it
        new Call({
          type: 'test',
          id: `int-${Math.random().toString(36).slice(2)}`,
          ringing: true,
          streamClient: client.streamClient,
          clientEventReporter: client.clientEventReporter,
          clientStore: (client as any).writeableStateStore,
        });
  if (kind === 'outgoing') {
    jest.spyOn(call, 'isCreatedByMe', 'get').mockReturnValue(true);
  }
  // stop short of the network; the join flow up to that point is the subject
  jest.spyOn(client.streamClient, 'post').mockResolvedValue({ duration: '0' });
  jest.spyOn(call as any, 'setup').mockResolvedValue(undefined);
  jest.spyOn(call as any, 'doJoin').mockImplementation(async () => {
    // a real join reaches JOINED, which is what refuses a later duplicate
    call.state.setCallingState(CallingState.JOINED);
  });
  return call;
};

const joinOptions = (kind: Kind) =>
  kind === 'ring-option' ? { ring: true } : {};

const tick = () => new Promise((r) => setImmediate(r));
const flush = async (times = 8) => {
  for (let i = 0; i < times; i++) await Promise.resolve();
};

beforeEach(() => {
  jest.clearAllMocks();
  (globalThis as any).streamRNVideoSDK = {
    ringingCallLifecycle: { beforeJoin, onJoinFailed, onLeave },
    callingX: { joinCall, endCall },
    callManager: { setup: jest.fn(), start: jest.fn(), stop: jest.fn() },
  };
});

afterEach(() => {
  setRingingCallLifecycleHooks({});
  (globalThis as any).streamRNVideoSDK = undefined;
  // the timeout test installs fake timers, which also fake `setImmediate`
  jest.useRealTimers();
});

describe('a fresh ringing join', () => {
  it.each<Kind>(['incoming', 'outgoing', 'ring-option'])(
    'runs setup before native registration and media setup (%s)',
    async (kind) => {
      const order: string[] = [];
      setRingingCallLifecycleHooks({
        onBeforeCallJoin: jest.fn(async () => {
          order.push('setup');
        }),
      });
      joinCall.mockImplementation(async () => {
        order.push('native');
      });
      const call = createCall(kind);
      jest
        .spyOn(call as any, 'setup')
        .mockImplementation(async () => void order.push('call-setup'));

      await call.join(joinOptions(kind));

      expect(order).toEqual(['setup', 'native', 'call-setup']);
    },
  );

  it('shares one preparation and one join between concurrent accepts', async () => {
    let finishHook: () => void = () => {};
    const onBeforeCallJoin = jest.fn(
      () => new Promise<void>((resolve) => (finishHook = resolve)),
    );
    setRingingCallLifecycleHooks({ onBeforeCallJoin });
    const call = createCall('incoming');

    // a push acceptance racing an in-app tap
    const first = call.join();
    const second = call.join();
    finishHook();
    await Promise.all([first, second]);

    expect(onBeforeCallJoin).toHaveBeenCalledTimes(1);
    expect(joinCall).toHaveBeenCalledTimes(1);
    expect((call as any).doJoin).toHaveBeenCalledTimes(1);
  });

  it('refuses a duplicate after success without releasing the live call', async () => {
    const onBeforeCallJoin = jest.fn().mockResolvedValue(undefined);
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({ onBeforeCallJoin, onAfterCallLeave });
    const call = createCall('incoming');

    await call.join();
    await expect(call.join()).rejects.toThrow('Illegal State');

    expect(onBeforeCallJoin).toHaveBeenCalledTimes(1);
    // the live call still owns its manager
    expect(onAfterCallLeave).not.toHaveBeenCalled();

    await call.leave();
    expect(onAfterCallLeave).toHaveBeenCalledTimes(1);
  });
});

describe('a ringing join whose setup fails', () => {
  it.each([
    ['rejects', () => jest.fn().mockRejectedValue(new Error('no key'))],
    [
      'throws synchronously',
      () =>
        jest.fn(() => {
          throw new Error('no key');
        }),
    ],
  ])('fails the join and ends the flow when the hook %s', async (_, hook) => {
    setRingingCallLifecycleHooks({ onBeforeCallJoin: hook() as any });
    const call = createCall('incoming');

    await expect(call.join()).rejects.toThrow('no key');

    expect((call as any).doJoin).not.toHaveBeenCalled();
    expect(joinCall).not.toHaveBeenCalled();
    // ended, so the ringing UI has nothing left to accept
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  it('ends the already reported native call', async () => {
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn().mockRejectedValue(new Error('no key')),
    });
    const call = createCall('incoming');

    await call.join().catch(() => {});

    // core never registered it - the push path reported the accept already
    expect(endCall).toHaveBeenCalledWith(call, 'error');
  });

  it('ends the flow on a timeout, and releases the hook only once it settles', async () => {
    jest.useFakeTimers();
    let finishHook: () => void = () => {};
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn(
        () => new Promise<void>((resolve) => (finishHook = resolve)),
      ),
      onAfterCallLeave,
    });
    const call = createCall('incoming');

    const joining = call.join().catch((e: Error) => e.message);
    await jest.advanceTimersByTimeAsync(5_000);

    await expect(joining).resolves.toContain('did not settle within');
    expect(call.state.callingState).toBe(CallingState.LEFT);
    // the app's hook cannot be cancelled, so nothing waited for it
    expect(onAfterCallLeave).not.toHaveBeenCalled();

    finishHook();
    await flush();
    expect(onAfterCallLeave).toHaveBeenCalledTimes(1);
  });

  it('releases exactly once across the failure and the leave it performs', async () => {
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn().mockRejectedValue(new Error('no key')),
      onAfterCallLeave,
    });
    const call = createCall('incoming');

    await call.join().catch(() => {});
    await flush();

    expect(onAfterCallLeave).toHaveBeenCalledTimes(1);
  });
});

describe('a ringing join overtaken by leave', () => {
  it('never reaches media setup, and releases the late setup once', async () => {
    let finishHook: () => void = () => {};
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn(
        () => new Promise<void>((resolve) => (finishHook = resolve)),
      ),
      onAfterCallLeave,
    });
    const call = createCall('incoming');

    const joining = call.join().catch((e: Error) => e.message);
    await tick();
    await call.leave({ reject: false });

    finishHook();
    await expect(joining).resolves.toContain(
      'Call was left while the join was in progress',
    );
    await flush();

    expect((call as any).doJoin).not.toHaveBeenCalled();
    expect(onAfterCallLeave).toHaveBeenCalledTimes(1);
  });
});

describe('release-only registration', () => {
  it('releases a joined call on leave, and a declined one too', async () => {
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({ onAfterCallLeave });

    const joined = createCall('incoming');
    await joined.join();
    expect(onAfterCallLeave).not.toHaveBeenCalled();
    await joined.leave();
    expect(onAfterCallLeave).toHaveBeenCalledTimes(1);

    const declined = createCall('incoming');
    await declined.leave({ reject: true });
    expect(onAfterCallLeave).toHaveBeenCalledTimes(2);
  });
});

describe('an ordinary call', () => {
  it('runs no ringing hooks and joins through the core path', async () => {
    const onBeforeCallJoin = jest.fn().mockResolvedValue(undefined);
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({ onBeforeCallJoin, onAfterCallLeave });
    const call = createCall('ring-option');

    await call.join();
    await call.leave();

    expect(onBeforeCallJoin).not.toHaveBeenCalled();
    expect(onAfterCallLeave).not.toHaveBeenCalled();
    expect((call as any).doJoin).toHaveBeenCalledTimes(1);
  });

  it('is not ended by the ringing failure path when its join fails', async () => {
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn().mockResolvedValue(undefined),
    });
    const call = createCall('ring-option');
    jest
      .spyOn(call as any, 'doJoin')
      .mockRejectedValue(new Error('sfu unavailable'));

    await expect(call.join({ maxJoinRetries: 1 })).rejects.toThrow(
      'sfu unavailable',
    );

    // upstream behaviour: the app owns an ordinary call's teardown
    expect(call.state.callingState).not.toBe(CallingState.LEFT);
  });
});
