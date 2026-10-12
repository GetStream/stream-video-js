/**
 * iOS handle values stored in the Recents: the caller's user id for incoming calls, the other
 * members' user ids (sorted, comma-joined) for outgoing ones so redial rings the same people.
 */

const mockCallingxModule = {
  isSetup: true,
  isOngoingCallsEnabled: false,
  isCallTracked: jest.fn(() => false),
  displayIncomingCall: jest.fn(async () => {}),
  answerIncomingCall: jest.fn(),
  endCallWithReason: jest.fn(),
  startCall: jest.fn(async () => {}),
};

jest.mock('../../src/utils/push/libs/callingx', () => ({
  getCallingxLibIfAvailable: () => mockCallingxModule,
  getCallingxLib: () => mockCallingxModule,
}));

const makeCall = (overrides: Partial<any> = {}, memberIds: string[] = []) =>
  ({
    cid: 'default:target',
    id: 'target',
    ringing: true,
    isCreatedByMe: false,
    currentUserId: 'me',
    state: {
      createdBy: { id: 'caller' },
      settings: { video: { enabled: false } },
      members: memberIds.map((id) => ({ user_id: id, user: { id } })),
    },
    leave: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as any;

const startedHandle = async (call: any) => {
  const {
    registerOutgoingCall,
    joinCallingxCall,
  } = require('../../src/utils/internal/callingx/callingx');
  if (call.isCreatedByMe) {
    await registerOutgoingCall(call);
    return (mockCallingxModule.startCall.mock.calls[0] as any[])[1];
  }
  await joinCallingxCall(call, [], () => false);
  return (mockCallingxModule.displayIncomingCall.mock.calls[0] as any[])[1];
};

describe('callingx handle values (iOS)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the caller user id for incoming calls', async () => {
    const call = makeCall({}, ['caller', 'me']);
    expect(await startedHandle(call)).toBe('caller');
  });

  it('uses the other member user id for an outgoing 1:1 call', async () => {
    const call = makeCall({ isCreatedByMe: true, state: undefined }, [
      'me',
      'bob',
    ]);
    call.state = {
      createdBy: { id: 'me' },
      settings: { video: { enabled: false } },
      members: ['me', 'bob'].map((id) => ({ user_id: id, user: { id } })),
    };
    expect(await startedHandle(call)).toBe('bob');
  });

  it('sorts and comma-joins the other members for an outgoing group call', async () => {
    const call = makeCall({ isCreatedByMe: true }, ['me', 'zed', 'amy', 'bob']);
    call.state.createdBy = { id: 'me' };
    expect(await startedHandle(call)).toBe('amy,bob,zed');
  });

  it('falls back to the creator id when no other members are known', async () => {
    const call = makeCall({ isCreatedByMe: true }, ['me']);
    call.state.createdBy = { id: 'me' };
    expect(await startedHandle(call)).toBe('me');
  });
});
