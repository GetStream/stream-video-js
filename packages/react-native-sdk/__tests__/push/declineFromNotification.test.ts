/**
 * Decline (or hang-up) from the system UI on Android, for a call the app already has: the call is
 * rejected on the server first, then removed from Telecom, then left. Telecom refuses every new
 * incoming call from the app while the declined call is still ringing there, so removing it must
 * not wait for the network.
 */

const CALL_CID = 'default:declined';
const USER_ID = 'callee';

type FakeCall = ReturnType<typeof createCall>;

const createCall = ({
  callingState = 'ringing',
  isMember = true,
  rejectFails = false,
}: {
  callingState?: string;
  isMember?: boolean;
  rejectFails?: boolean;
} = {}) => {
  const steps: string[] = [];
  let finishReject!: () => void;
  const call = {
    cid: CALL_CID,
    currentUserId: USER_ID,
    state: {
      callingState,
      members: isMember ? [{ user_id: USER_ID }] : [{ user_id: 'someone' }],
    },
    reject: jest.fn(() => {
      steps.push('reject started');
      return new Promise<void>((resolve, reject) => {
        finishReject = () => {
          steps.push('reject finished');
          if (rejectFails) {
            reject(new Error('network down'));
          } else {
            resolve();
          }
        };
      });
    }),
    leave: jest.fn(async () => {
      steps.push('leave');
    }),
  };
  return { call, steps, finishReject: () => finishReject() };
};

const createCallingx = (steps: string[], { tracked = true } = {}) => ({
  isCallTracked: jest.fn(() => tracked),
  endCallWithReason: jest.fn((_cid: string, reason: string) => {
    steps.push(`telecom end (${reason})`);
  }),
});

const loadUtils = () => {
  let utils!: typeof import('../../src/utils/push/internal/utils');
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'android' },
      AppState: { currentState: 'background', addEventListener: jest.fn() },
    }));
    // mocked to keep the video-client / react-native-webrtc runtime out of the test
    jest.doMock('@stream-io/video-client', () => ({
      CallingState: {
        IDLE: 'idle',
        RINGING: 'ringing',
        JOINED: 'joined',
        LEFT: 'left',
      },
      videoLoggerSystem: {
        getLogger: () => ({
          debug: jest.fn(),
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
        }),
      },
    }));
    utils = require('../../src/utils/push/internal/utils');
  });
  return utils;
};

/** Lets the already-resolved promises run their callbacks. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('endLiveCallFromSystem', () => {
  it('rejects first, removes the call from Telecom before the reject finishes, then leaves', async () => {
    const { endLiveCallFromSystem } = loadUtils();
    const { call, steps, finishReject } = createCall();
    const callingx = createCallingx(steps);

    const done = endLiveCallFromSystem(call as never, callingx);
    await flush();

    // Telecom is told while the reject is still on the network
    expect(steps).toEqual(['reject started', 'telecom end (rejected)']);
    expect(call.leave).not.toHaveBeenCalled();

    finishReject();
    await done;

    expect(steps).toEqual([
      'reject started',
      'telecom end (rejected)',
      'reject finished',
      'leave',
    ]);
    expect(call.reject).toHaveBeenCalledWith({ reason: 'decline' });
    // already rejected above, so leaving must not reject a second time
    expect(call.leave).toHaveBeenCalledWith({ reject: false });
  });

  it('still removes the call from Telecom and leaves it when the reject fails', async () => {
    const { endLiveCallFromSystem } = loadUtils();
    const { call, steps, finishReject } = createCall({ rejectFails: true });
    const callingx = createCallingx(steps);

    const done = endLiveCallFromSystem(call as never, callingx);
    await flush();
    finishReject();
    await done;

    expect(steps).toEqual([
      'reject started',
      'telecom end (rejected)',
      'reject finished',
      'leave',
    ]);
  });

  it('hangs up an active call without rejecting it', async () => {
    const { endLiveCallFromSystem } = loadUtils();
    const { call, steps } = createCall({ callingState: 'joined' });
    const callingx = createCallingx(steps);

    await endLiveCallFromSystem(call as never, callingx);

    expect(call.reject).not.toHaveBeenCalled();
    expect(steps).toEqual(['telecom end (local)', 'leave']);
  });

  it('does not reject a ringing call the user is not a member of', async () => {
    const { endLiveCallFromSystem } = loadUtils();
    const { call, steps } = createCall({ isMember: false });
    const callingx = createCallingx(steps);

    await endLiveCallFromSystem(call as never, callingx);

    expect(call.reject).not.toHaveBeenCalled();
    expect(steps).toEqual(['telecom end (rejected)', 'leave']);
  });

  it('does not end a call callingx no longer tracks', async () => {
    const { endLiveCallFromSystem } = loadUtils();
    const { call, steps, finishReject } = createCall();
    const callingx = createCallingx(steps, { tracked: false });

    const done = endLiveCallFromSystem(call as never, callingx);
    await flush();
    finishReject();
    await done;

    expect(callingx.endCallWithReason).not.toHaveBeenCalled();
    expect(steps).toEqual(['reject started', 'reject finished', 'leave']);
  });

  it('does not leave a call that was already left', async () => {
    const { endLiveCallFromSystem } = loadUtils();
    const { call, steps } = createCall({ callingState: 'left' });
    const callingx = createCallingx(steps);

    await endLiveCallFromSystem(call as never, callingx);

    expect(call.leave).not.toHaveBeenCalled();
  });
});

describe('findLiveCall', () => {
  const loadLiveClients = () => {
    let liveClients!: typeof import('../../src/utils/push/internal/liveClients');
    jest.isolateModules(() => {
      jest.doMock('@stream-io/video-client', () => ({
        CallingState: { LEFT: 'left' },
      }));
      liveClients = require('../../src/utils/push/internal/liveClients');
    });
    return liveClients;
  };

  const clientWith = (...calls: { cid: string; callingState: string }[]) => ({
    state: {
      calls: calls.map(({ cid, callingState }) => ({
        cid,
        state: { callingState },
      })),
    },
  });

  it('finds the call in a registered client, skipping calls already left', () => {
    const { registerLiveClient, findLiveCall } = loadLiveClients();
    registerLiveClient(
      clientWith({ cid: CALL_CID, callingState: 'left' }) as never,
    );
    const live = clientWith({ cid: CALL_CID, callingState: 'ringing' });
    registerLiveClient(live as never);

    expect(findLiveCall(CALL_CID)).toBe(live.state.calls[0]);
  });

  it('forgets a client once it is unregistered', () => {
    const { registerLiveClient, findLiveCall } = loadLiveClients();
    const forget = registerLiveClient(
      clientWith({ cid: CALL_CID, callingState: 'ringing' }) as never,
    );
    forget();

    expect(findLiveCall(CALL_CID)).toBeUndefined();
  });
});

describe('onEndCall (Android)', () => {
  const setup = (liveCall: FakeCall['call'] | undefined) => {
    const listeners = new Map<string, (params: unknown) => void>();
    const callingx = {
      addEventListener: jest.fn((name: string, listener: never) => {
        listeners.set(name, listener);
      }),
      getInitialEvents: jest.fn(() => []),
      fulfillEndCallAction: jest.fn(),
    };
    const endLiveCallFromSystem = jest.fn(async () => {});
    const processCallFromPushInBackground = jest.fn();

    jest.isolateModules(() => {
      jest.doMock('react-native', () => ({ Platform: { OS: 'android' } }));
      jest.doMock('@stream-io/video-client', () => ({
        CallingState: { RINGING: 'ringing', IDLE: 'idle', LEFT: 'left' },
        videoLoggerSystem: {
          getLogger: () => ({
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          }),
        },
      }));
      jest.doMock('../../src/utils/push/libs/callingx', () => ({
        getCallingxLib: () => callingx,
      }));
      jest.doMock('../../src/utils/push/internal/utils', () => ({
        clearPushWSEventSubscriptions: jest.fn(),
        endLiveCallFromSystem,
        processCallFromPushInBackground,
      }));
      jest.doMock('../../src/utils/push/internal/liveClients', () => ({
        findLiveCall: () => liveCall,
      }));
      jest.doMock('../../src/utils/push/internal/android', () => ({
        onRingNotificationReceived: jest.fn(),
      }));
      const {
        setupCallingExpEvents,
      } = require('../../src/utils/push/setupCallingExpEvents');
      setupCallingExpEvents({ android: { pushProviderName: 'fcm' } });
    });

    const endCall = (source: string) =>
      listeners.get('endCall')!({ callId: CALL_CID, source });
    return {
      endCall,
      callingx,
      endLiveCallFromSystem,
      processCallFromPushInBackground,
    };
  };

  it('ends a call the app already has right away, without creating a client', () => {
    const { call } = createCall();
    const {
      endCall,
      callingx,
      endLiveCallFromSystem,
      processCallFromPushInBackground,
    } = setup(call);

    endCall('sys');

    expect(endLiveCallFromSystem).toHaveBeenCalledWith(call, callingx);
    expect(processCallFromPushInBackground).not.toHaveBeenCalled();
  });

  it('falls back to creating a client when the app does not have the call', () => {
    const { endCall, endLiveCallFromSystem, processCallFromPushInBackground } =
      setup(undefined);

    endCall('sys');

    expect(endLiveCallFromSystem).not.toHaveBeenCalled();
    expect(processCallFromPushInBackground).toHaveBeenCalledWith(
      expect.anything(),
      CALL_CID,
      'decline',
      expect.any(Function),
    );
  });

  it('ignores an end the app itself started', () => {
    const { call } = createCall();
    const { endCall, endLiveCallFromSystem, processCallFromPushInBackground } =
      setup(call);

    endCall('app');

    expect(endLiveCallFromSystem).not.toHaveBeenCalled();
    expect(processCallFromPushInBackground).not.toHaveBeenCalled();
  });
});
