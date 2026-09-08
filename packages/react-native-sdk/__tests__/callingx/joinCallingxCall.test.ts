import { CallingState } from '@stream-io/video-client';

/**
 * Registration of an incoming call waits for any other ringing call to leave
 * first, and that wait is unbounded. If the target call is left during it, the
 * bridge must not go on to register and answer it: the native side is keyed by
 * cid alone, so an orphan registration cannot be told apart from a replacement
 * lifecycle's, and whichever cleanup runs next ends the wrong call.
 */

const mockCallingxModule = {
  isSetup: true,
  isOngoingCallsEnabled: false,
  isCallTracked: jest.fn(() => true),
  displayIncomingCall: jest.fn().mockResolvedValue(undefined),
  answerIncomingCall: jest.fn().mockResolvedValue(undefined),
  endCallWithReason: jest.fn().mockResolvedValue(undefined),
  startCall: jest.fn().mockResolvedValue(undefined),
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
  beforeEach(() => jest.clearAllMocks());

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
  });
});
