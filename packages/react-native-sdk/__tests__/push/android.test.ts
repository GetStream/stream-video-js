/**
 * The two `createStreamVideoClient` failure branches of the Android `call.ring` push handler
 * abandon the push. `callingx.stopService()` is only a request — it no-ops while another call is
 * registered or being registered — so the abandoned call has to be ended explicitly, otherwise its
 * notification is stranded whenever a second call is live.
 */

const CALL_CID = 'default:abandoned';
const RING_DATA = {
  call_cid: CALL_CID,
  sender: 'stream.video',
  type: 'call.ring',
};

/** Loads the handler with the given client factory. `calls` records the callingx sequence. */
const setup = (
  createStreamVideoClient: jest.Mock,
  { listenToWS = true, mustEndCall = false } = {},
) => {
  const calls: string[] = [];
  const callingx = {
    log: jest.fn(),
    acquireBackgroundTask: jest.fn(),
    releaseBackgroundTask: jest.fn(() => {
      calls.push('release');
    }),
    endCallWithReason: jest.fn(() => {
      calls.push('end');
    }),
    stopService: jest.fn(() => {
      calls.push('stop');
    }),
  };

  let handler!: (data: unknown) => Promise<void>;
  let subscriptions!: Map<string, unknown>;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'android' },
      AppState: { currentState: 'background', addEventListener: jest.fn() },
    }));
    // mocked to keep the video-client / react-native-webrtc runtime out of the test
    jest.doMock('@stream-io/video-client', () => ({
      CallingState: { IDLE: 'idle', LEFT: 'left' },
    }));
    jest.doMock('../../src/utils/push/libs', () => ({
      getCallingxLib: () => callingx,
      getCallingxLibIfAvailable: () => callingx,
    }));
    jest.doMock('../../src/utils/push/internal/utils', () => ({
      canListenToWS: () => listenToWS,
      shouldCallBeClosed: () => ({ mustEndCall, endCallReason: 'remote' }),
    }));
    const {
      onRingNotificationReceived,
    } = require('../../src/utils/push/internal/android');
    handler = (data) =>
      onRingNotificationReceived(data, { createStreamVideoClient });
    subscriptions =
      require('../../src/utils/push/internal/constants').pushUnsubscriptionCallbacks;
  });

  return { handler, calls, callingx, subscriptions };
};

describe('onRingNotificationReceived — abandoning a push', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it.each<[string, () => jest.Mock]>([
    ['returns no client', () => jest.fn().mockResolvedValue(undefined)],
    ['throws', () => jest.fn().mockRejectedValue(new Error('boom'))],
  ])(
    'ends the call before requesting the stop when the client factory %s',
    async (_label, clientFactory) => {
      const { handler, calls, callingx, subscriptions } =
        setup(clientFactory());

      await handler(RING_DATA);

      expect(calls).toEqual(['release', 'end', 'stop']);
      expect(callingx.endCallWithReason).toHaveBeenCalledWith(
        CALL_CID,
        'error',
      );
      expect(subscriptions.has(CALL_CID)).toBe(false);
    },
  );

  it.each<['endCallWithReason' | 'stopService', string[], string]>([
    ['endCallWithReason', ['release', 'stop'], 'Failed to end call'],
    ['stopService', ['release', 'end'], 'Failed to stop the call service for'],
  ])('finishes the cleanup when %s throws', async (failing, expected, log) => {
    const { handler, calls, callingx, subscriptions } = setup(
      jest.fn().mockResolvedValue(undefined),
    );
    callingx[failing].mockImplementation(() => {
      throw new Error('boom');
    });

    await handler(RING_DATA);

    expect(calls).toEqual(expected);
    expect(callingx.log).toHaveBeenCalledWith(
      expect.stringContaining(`${log} ${CALL_CID}`),
      'error',
    );
    // a retained entry would make every later push for this cid look like a duplicate
    expect(subscriptions.has(CALL_CID)).toBe(false);
  });
});

describe('onRingNotificationReceived — closing an already-ended ring', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('still leaves the call when the synchronous endCallWithReason throws', async () => {
    const callFromPush = { leave: jest.fn().mockResolvedValue(undefined) };
    const client = {
      onRingingCall: jest.fn().mockResolvedValue(callFromPush),
    };
    const { handler, callingx } = setup(jest.fn().mockResolvedValue(client), {
      listenToWS: false,
      mustEndCall: true,
    });
    callingx.endCallWithReason.mockImplementation(() => {
      throw new Error('boom');
    });

    await expect(handler(RING_DATA)).resolves.toBeUndefined();

    expect(callingx.endCallWithReason).toHaveBeenCalledWith(CALL_CID, 'remote');
    expect(callingx.log).toHaveBeenCalledWith(
      expect.stringContaining(`Failed to end call ${CALL_CID}`),
      'error',
    );
    expect(callFromPush.leave).toHaveBeenCalledWith({ reject: false });
  });
});

export {};
