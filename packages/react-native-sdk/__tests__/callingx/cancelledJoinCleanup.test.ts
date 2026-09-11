import { CallingState, StreamVideoClient } from '@stream-io/video-client';

/**
 * A native registration can outlive the join that asked for it: `leave()` lands
 * while the OS is still bringing the call up, and core then aborts the join at
 * its next cancellation check - before reaching the failure path that would end
 * the native call. Ringing calls have a lifecycle owner that cleans up after
 * them; ordinary calls with ongoing-call integration do not, so the bridge has
 * to close its own registration.
 */

const mockTracked = new Set<string>();
const mockCallingxModule = {
  isSetup: true,
  isOngoingCallsEnabled: true,
  isCallTracked: jest.fn((cid: string) => mockTracked.has(cid)),
  displayIncomingCall: jest.fn(async (cid: string) => {
    mockTracked.add(cid);
  }),
  answerIncomingCall: jest.fn().mockResolvedValue(undefined),
  startCall: jest.fn(async (cid: string) => {
    mockTracked.add(cid);
  }),
  endCallWithReason: jest.fn(async (cid: string) => {
    mockTracked.delete(cid);
  }),
};

jest.mock('../../src/utils/push/libs/callingx', () => ({
  getCallingxLibIfAvailable: () => mockCallingxModule,
  getCallingxLib: () => mockCallingxModule,
}));

// required rather than imported: the bridge reads the callingx module at import
// time, and an `import` would run before the mock object above is assigned
const {
  joinCallingxCall,
  endCallingxCall,
} = require('../../src/utils/internal/callingx/callingx');
const {
  beforeJoin,
  onJoinFailed,
  onLeave,
} = require('../../src/utils/internal/ringingCallLifecycle');

const createCall = () => {
  const client = new StreamVideoClient({
    apiKey: 'abc',
    // no network from these fixtures - see ringingJoinIntegration.test.ts
    options: { clientEventsReportingEnabled: false, logLevel: 'error' },
  });
  const call = client.call(
    'test',
    `cancel-${Math.random().toString(36).slice(2)}`,
  );
  // stop short of the network; what happens before the join is the subject
  jest.spyOn(call as any, 'doJoin').mockResolvedValue(undefined);
  jest.spyOn(call as any, 'setup').mockResolvedValue(undefined);
  return call;
};

/** Holds the native registration open until the test releases it. */
const deferRegistration = (method: 'startCall' | 'displayIncomingCall') => {
  let release: () => void = () => {};
  mockCallingxModule[method].mockImplementationOnce(
    (cid: string) =>
      new Promise<void>((resolve) => {
        release = () => {
          mockTracked.add(cid);
          resolve();
        };
      }),
  );
  return () => release();
};

const tick = () => new Promise((r) => setImmediate(r));

beforeEach(() => {
  jest.clearAllMocks();
  mockTracked.clear();
  (globalThis as any).streamRNVideoSDK = {
    callingX: { joinCall: joinCallingxCall, endCall: endCallingxCall },
    ringingCallLifecycle: { beforeJoin, onJoinFailed, onLeave },
    callManager: { setup: jest.fn(), start: jest.fn(), stop: jest.fn() },
  };
});

afterEach(() => {
  (globalThis as any).streamRNVideoSDK = undefined;
});

describe('a join cancelled while its native registration is pending', () => {
  it('leaves no tracked call behind for an ordinary ongoing call', async () => {
    const call = createCall();
    const release = deferRegistration('startCall');

    const joining = call.join().catch((e: Error) => e);
    await tick();
    await call.leave();
    release();

    await expect(joining).resolves.toThrow(
      'Call was left while the join was in progress',
    );
    expect((call as any).doJoin).not.toHaveBeenCalled();
    expect(call.state.callingState).toBe(CallingState.LEFT);
    expect(mockCallingxModule.endCallWithReason).toHaveBeenCalledWith(
      call.cid,
      'canceled',
    );
    expect(mockTracked.has(call.cid)).toBe(false);
  });

  it('leaves no tracked call behind for a ringing call', async () => {
    const call = createCall();
    const release = deferRegistration('displayIncomingCall');

    const joining = call.join({ ring: true }).catch((e: Error) => e);
    await tick();
    await call.leave({ reject: false });
    release();

    await joining;
    expect((call as any).doJoin).not.toHaveBeenCalled();
    // answering a call nobody is waiting for is exactly what this prevents
    expect(mockCallingxModule.answerIncomingCall).not.toHaveBeenCalled();
    expect(mockTracked.has(call.cid)).toBe(false);
  });

  it('keeps the registration when the join was not cancelled', async () => {
    const call = createCall();

    await call.join();

    expect(mockCallingxModule.startCall).toHaveBeenCalled();
    expect(mockCallingxModule.endCallWithReason).not.toHaveBeenCalled();
    expect(mockTracked.has(call.cid)).toBe(true);
  });
});
