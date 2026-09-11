import { CallingState } from '@stream-io/video-client';

/**
 * Registration of an incoming call waits for any other ringing call to leave
 * first, and that wait is unbounded. If the target call is left during it, the
 * bridge must not go on to register and answer it: the native side is keyed by
 * cid alone, so an orphan registration cannot be told apart from a replacement
 * lifecycle's, and whichever cleanup runs next ends the wrong call.
 */

const mockTracked = new Set<string>();
const mockCallingxModule = {
  isSetup: true,
  isOngoingCallsEnabled: false,
  isCallTracked: jest.fn((cid: string) => mockTracked.has(cid)),
  displayIncomingCall: jest.fn(async (cid: string) => {
    mockTracked.add(cid);
  }),
  answerIncomingCall: jest.fn().mockResolvedValue(undefined),
  endCallWithReason: jest.fn(async (cid: string) => {
    mockTracked.delete(cid);
  }),
  startCall: jest.fn(async (cid: string) => {
    mockTracked.add(cid);
  }),
};

jest.mock('../../src/utils/push/libs/callingx', () => ({
  getCallingxLibIfAvailable: () => mockCallingxModule,
  getCallingxLib: () => mockCallingxModule,
}));

const makeCall = (overrides: Partial<any> = {}) =>
  ({
    cid: 'default:target',
    ringing: true,
    isCreatedByMe: false,
    state: {
      callingState: CallingState.RINGING,
      createdBy: { id: 'caller' },
      settings: { video: { enabled: false } },
      members: [],
    },
    leave: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as any;

describe('joinCallingxCall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTracked.clear();
    mockCallingxModule.isOngoingCallsEnabled = false;
  });

  it('registers an incoming call that is still wanted', async () => {
    const {
      joinCallingxCall,
    } = require('../../src/utils/internal/callingx/callingx');
    const call = makeCall();

    await joinCallingxCall(call, [], () => false);

    expect(mockCallingxModule.displayIncomingCall).toHaveBeenCalledWith(
      'default:target',
      'caller',
      expect.anything(),
      false,
    );
    expect(mockCallingxModule.answerIncomingCall).toHaveBeenCalledWith(
      'default:target',
    );
  });

  it('does not register a call whose join was cancelled while waiting', async () => {
    const {
      joinCallingxCall,
    } = require('../../src/utils/internal/callingx/callingx');
    const call = makeCall();
    let cancelled = false;
    const other = makeCall({
      cid: 'default:other',
      leave: jest.fn(async () => {
        // the user hangs up the target while the previous call is still leaving
        cancelled = true;
      }),
    });

    // the caller owns this decision: a `Call` reused for a fresh ring is also
    // `LEFT` here, so the call's own state cannot answer it
    await joinCallingxCall(call, [other], () => cancelled);

    expect(other.leave).toHaveBeenCalled();
    expect(mockCallingxModule.displayIncomingCall).not.toHaveBeenCalled();
    expect(mockCallingxModule.answerIncomingCall).not.toHaveBeenCalled();
    // nothing was registered, so there is nothing to end either
    expect(mockCallingxModule.endCallWithReason).not.toHaveBeenCalled();
  });

  it('ends a registration that completed after its join was cancelled', async () => {
    const {
      joinCallingxCall,
    } = require('../../src/utils/internal/callingx/callingx');
    const call = makeCall();
    let cancelled = false;
    mockCallingxModule.displayIncomingCall.mockImplementationOnce(
      async (cid: string) => {
        // the user hangs up while the OS is still bringing the call up
        cancelled = true;
        mockTracked.add(cid);
      },
    );

    await joinCallingxCall(call, [], () => cancelled);

    expect(mockCallingxModule.endCallWithReason).toHaveBeenCalledWith(
      'default:target',
      'canceled',
    );
    expect(mockTracked.has('default:target')).toBe(false);
  });

  it('leaves the currently active call before registering the accepted one', async () => {
    const {
      joinCallingxCall,
    } = require('../../src/utils/internal/callingx/callingx');
    const accepted = makeCall();
    const active = makeCall({ cid: 'default:active' });

    await joinCallingxCall(accepted, [active], () => false);

    // the SDK's standing behaviour: one active call, so A goes before B arrives
    expect(active.leave).toHaveBeenCalledWith({ reason: 'cancel' });
    expect(mockCallingxModule.displayIncomingCall).toHaveBeenCalled();
    expect(mockTracked.has('default:target')).toBe(true);
    // declining B never reaches this bridge at all, so A is untouched by it
  });

  it('ends an outgoing registration that outlived its join', async () => {
    const {
      joinCallingxCall,
    } = require('../../src/utils/internal/callingx/callingx');
    const call = makeCall({ cid: 'default:outgoing', isCreatedByMe: true });
    let cancelled = false;
    mockCallingxModule.startCall.mockImplementationOnce(async (cid: string) => {
      cancelled = true;
      mockTracked.add(cid);
    });

    await joinCallingxCall(call, [], () => cancelled);

    expect(mockCallingxModule.endCallWithReason).toHaveBeenCalledWith(
      'default:outgoing',
      'canceled',
    );
    expect(mockTracked.has('default:outgoing')).toBe(false);
  });

  it('ends a partial registration whose answer rejected after cancellation', async () => {
    const {
      joinCallingxCall,
    } = require('../../src/utils/internal/callingx/callingx');
    const call = makeCall();
    let cancelled = false;
    mockCallingxModule.displayIncomingCall.mockImplementationOnce(
      async (cid: string) => {
        mockTracked.add(cid);
      },
    );
    mockCallingxModule.answerIncomingCall.mockImplementationOnce(async () => {
      cancelled = true;
      throw new Error('answer failed');
    });

    await joinCallingxCall(call, [], () => cancelled);

    // the call was displayed, so something is tracked even though answer threw
    expect(mockCallingxModule.endCallWithReason).toHaveBeenCalledWith(
      'default:target',
      'canceled',
    );
    expect(mockTracked.has('default:target')).toBe(false);
  });

  it('ends an ordinary ongoing registration that outlived its join', async () => {
    mockCallingxModule.isOngoingCallsEnabled = true;
    const {
      joinCallingxCall,
    } = require('../../src/utils/internal/callingx/callingx');
    const call = makeCall({
      cid: 'default:ongoing',
      ringing: false,
      state: { callingState: CallingState.IDLE, members: [] },
    });
    let cancelled = false;
    mockCallingxModule.startCall.mockImplementationOnce(async (cid: string) => {
      cancelled = true;
      mockTracked.add(cid);
    });

    await joinCallingxCall(call, [], () => cancelled);

    expect(mockCallingxModule.startCall).toHaveBeenCalled();
    expect(mockCallingxModule.endCallWithReason).toHaveBeenCalledWith(
      'default:ongoing',
      'canceled',
    );
    expect(mockTracked.has('default:ongoing')).toBe(false);
  });
});
