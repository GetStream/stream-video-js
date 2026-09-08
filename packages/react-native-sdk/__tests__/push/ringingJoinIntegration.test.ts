import { CallingState, StreamVideoClient } from '@stream-io/video-client';
import { endCallingxCall } from '../../src/utils/internal/callingx/callingx';
import {
  onLeave,
  RingingJoinBusyError,
  runJoin,
  setRingingCallLifecycleHooks,
} from '../../src/utils/internal/ringingCallLifecycle';

/**
 * Drives a real `Call` against the real runner through the globals bridge.
 *
 * The unit suites either stub the owner inside core or call the runner with a
 * fake call; between them they miss the dispatch, the timing, and what happens
 * to a call that already joined. These cover that seam.
 */

jest.mock('../../src/utils/internal/callingx/callingx', () => ({
  ...jest.requireActual('../../src/utils/internal/callingx/callingx'),
  endCallingxCall: jest.fn().mockResolvedValue(undefined),
}));

const endCall = jest.fn().mockResolvedValue(undefined);
const joinCall = jest.fn().mockResolvedValue(undefined);

const createCall = () => {
  const client = new StreamVideoClient({ apiKey: 'abc' });
  const call = client.call(
    'test',
    `int-${Math.random().toString(36).slice(2)}`,
  );
  // stop short of the network; the join flow up to that point is the subject
  jest.spyOn(call as any, 'doJoin').mockResolvedValue(undefined);
  jest.spyOn(call as any, 'setup').mockResolvedValue(undefined);
  return call;
};

beforeEach(() => {
  jest.clearAllMocks();
  (globalThis as any).streamRNVideoSDK = {
    ringingCallLifecycle: { runJoin, onLeave },
    callingX: { joinCall, endCall },
    callManager: { setup: jest.fn(), start: jest.fn(), stop: jest.fn() },
  };
});

afterEach(() => {
  setRingingCallLifecycleHooks({});
  (globalThis as any).streamRNVideoSDK = undefined;
});

describe('ringing join, core to runner', () => {
  it('F1: a reused instance joined with ring:true still runs setup', async () => {
    const onBeforeCallJoin = jest.fn().mockResolvedValue(undefined);
    setRingingCallLifecycleHooks({ onBeforeCallJoin });
    const call = createCall();

    await call.join({ ring: true });

    expect(onBeforeCallJoin).toHaveBeenCalledWith(call);
  });

  it('F1: a rejecting hook prevents the join', async () => {
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn().mockRejectedValue(new Error('no key')),
    });
    const call = createCall();

    await expect(call.join({ ring: true })).rejects.toThrow('no key');
    expect(call.state.callingState).not.toBe(CallingState.JOINED);
  });

  it('F3/F5: a duplicate after success reruns no setup and releases nothing', async () => {
    const onBeforeCallJoin = jest.fn().mockResolvedValue(undefined);
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({ onBeforeCallJoin, onAfterCallLeave });
    const call = createCall();

    await call.join({ ring: true });
    await call.join({ ring: true }).catch(() => {});

    expect(onBeforeCallJoin).toHaveBeenCalledTimes(1);
    expect(onAfterCallLeave).not.toHaveBeenCalled();

    await call.leave();
    expect(onAfterCallLeave).toHaveBeenCalledTimes(1);
  });

  it('F5: declining a call that never joined releases nothing', async () => {
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn().mockResolvedValue(undefined),
      onAfterCallLeave,
    });

    await createCall().leave({ reject: true });

    expect(onAfterCallLeave).not.toHaveBeenCalled();
  });

  it('F5: a failed setup followed by leave releases exactly once', async () => {
    const onAfterCallLeave = jest.fn();
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn().mockRejectedValue(new Error('no key')),
      onAfterCallLeave,
    });
    const call = createCall();

    await call.join({ ring: true }).catch(() => {});
    await call.leave();

    expect(onAfterCallLeave).toHaveBeenCalledTimes(1);
  });

  it('F4: a rejecting hook ends the already reported native call', async () => {
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn().mockRejectedValue(new Error('no key')),
    });
    const call = createCall();

    await call.join({ ring: true }).catch(() => {});

    // core never registered it - the push path reported the accept already
    expect(endCallingxCall).toHaveBeenCalled();
  });

  it('refuses a retry while a cancelled attempt is still settling', async () => {
    let finishHook: () => void = () => {};
    setRingingCallLifecycleHooks({
      onBeforeCallJoin: jest.fn(
        () => new Promise<void>((resolve) => (finishHook = resolve)),
      ),
      onAfterCallLeave: jest.fn(),
    });
    const call = createCall();

    const cancelled = call.join({ ring: true }).catch(() => 'cancelled');
    await new Promise((r) => setImmediate(r));
    await call.leave({ reject: false });

    await expect(call.join({ ring: true })).rejects.toBeInstanceOf(
      RingingJoinBusyError,
    );

    finishHook();
    await cancelled;
  });
});
