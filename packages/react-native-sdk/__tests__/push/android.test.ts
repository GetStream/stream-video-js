/**
 * Tests for the `createStreamVideoClient` failure branches of the Android `call.ring` push handler.
 *
 * These branches abandon the push. Because `callingx.stopService()` is only a request — it no-ops
 * while any other call is registered or being registered — the abandoned call has to be ended
 * explicitly, otherwise its notification would be stranded whenever a second call is live.
 */

const makeCallingx = (overrides: Partial<any> = {}) => ({
  log: jest.fn(),
  stopService: jest.fn().mockResolvedValue(undefined),
  endCallWithReason: jest.fn().mockResolvedValue(undefined),
  acquireBackgroundTask: jest.fn().mockResolvedValue(undefined),
  releaseBackgroundTask: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const RING_DATA = {
  call_cid: 'default:abandoned-call',
  sender: 'stream.video',
  type: 'call.ring',
  created_by_id: 'caller-id',
};

/** Load the push handler with the client factory and platform state under test. */
const loadHandler = ({
  createStreamVideoClient,
  callingx,
  canListenToWS,
}: {
  createStreamVideoClient: jest.Mock;
  callingx: ReturnType<typeof makeCallingx>;
  canListenToWS: boolean;
}) => {
  let onRingNotificationReceived!: (data: any) => Promise<void>;
  let pushUnsubscriptionCallbacks!: Map<string, (() => void)[]>;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'android', select: (o: any) => o.android },
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
      canListenToWS: () => canListenToWS,
      shouldCallBeClosed: () => ({ mustEndCall: false }),
    }));
    onRingNotificationReceived =
      require('../../src/utils/push/internal/android').onRingNotificationReceived;
    pushUnsubscriptionCallbacks =
      require('../../src/utils/push/internal/constants').pushUnsubscriptionCallbacks;
  });
  return { onRingNotificationReceived, pushUnsubscriptionCallbacks };
};

describe('onRingNotificationReceived — abandoning a push', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('ends the displayed call before asking the service to stop when no client is returned', async () => {
    const callingx = makeCallingx();
    const { onRingNotificationReceived, pushUnsubscriptionCallbacks } =
      loadHandler({
        createStreamVideoClient: jest.fn().mockResolvedValue(undefined),
        callingx,
        canListenToWS: false,
      });

    await onRingNotificationReceived(RING_DATA);

    expect(callingx.endCallWithReason).toHaveBeenCalledWith(
      RING_DATA.call_cid,
      'error',
    );
    expect(callingx.stopService).toHaveBeenCalledTimes(1);
    expect(callingx.endCallWithReason.mock.invocationCallOrder[0]).toBeLessThan(
      callingx.stopService.mock.invocationCallOrder[0],
    );
    expect(pushUnsubscriptionCallbacks.has(RING_DATA.call_cid)).toBe(false);
  });

  it('ends the call and releases the background task when client creation throws', async () => {
    const callingx = makeCallingx();
    const { onRingNotificationReceived, pushUnsubscriptionCallbacks } =
      loadHandler({
        createStreamVideoClient: jest.fn().mockRejectedValue(new Error('boom')),
        callingx,
        canListenToWS: true,
      });

    await onRingNotificationReceived(RING_DATA);

    expect(callingx.releaseBackgroundTask).toHaveBeenCalledWith(
      `push:${RING_DATA.call_cid}`,
    );
    expect(callingx.endCallWithReason).toHaveBeenCalledWith(
      RING_DATA.call_cid,
      'error',
    );
    expect(callingx.stopService).toHaveBeenCalledTimes(1);
    expect(pushUnsubscriptionCallbacks.has(RING_DATA.call_cid)).toBe(false);
  });

  it('still stops the service when ending the call fails', async () => {
    const callingx = makeCallingx({
      endCallWithReason: jest.fn().mockRejectedValue(new Error('not tracked')),
    });
    const { onRingNotificationReceived } = loadHandler({
      createStreamVideoClient: jest.fn().mockResolvedValue(undefined),
      callingx,
      canListenToWS: false,
    });

    await onRingNotificationReceived(RING_DATA);

    expect(callingx.stopService).toHaveBeenCalledTimes(1);
  });
});

export {};
