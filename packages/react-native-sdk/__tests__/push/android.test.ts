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

/** Loads the handler with a failing client factory. `calls` records the callingx sequence. */
const setup = (createStreamVideoClient: jest.Mock) => {
  const calls: string[] = [];
  const callingx = {
    log: jest.fn(),
    acquireBackgroundTask: jest.fn().mockResolvedValue(undefined),
    releaseBackgroundTask: jest.fn(() => {
      calls.push('release');
    }),
    endCallWithReason: jest.fn(async () => {
      calls.push('end');
    }),
    stopService: jest.fn(async () => {
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
    jest.doMock('../../src/utils/StreamVideoRN', () => ({
      StreamVideoRN: {
        getConfig: () => ({ push: { createStreamVideoClient } }),
      },
    }));
    jest.doMock('../../src/utils/push/internal/utils', () => ({
      canListenToWS: () => true,
      shouldCallBeClosed: () => ({ mustEndCall: false }),
    }));
    handler =
      require('../../src/utils/push/internal/android').onRingNotificationReceived;
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

  it('still requests the stop when ending the call fails', async () => {
    const { handler, calls, callingx, subscriptions } = setup(
      jest.fn().mockResolvedValue(undefined),
    );
    callingx.endCallWithReason.mockRejectedValue(new Error('not tracked'));

    await handler(RING_DATA);

    expect(calls).toEqual(['release', 'stop']);
    expect(subscriptions.has(CALL_CID)).toBe(false);
  });
});

export {};
