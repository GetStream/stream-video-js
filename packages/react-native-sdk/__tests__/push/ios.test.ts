/**
 * The iOS VoIP push handler must only process payloads that are both sent by `stream.video` and
 * of type `call.ring`. Anything else must be ignored, otherwise it is surfaced as a ringing call.
 */

const CALL_CID = 'default:voip';

/** Loads the handler with a client factory that resolves to no client. */
const setup = () => {
  const createStreamVideoClient = jest.fn().mockResolvedValue(undefined);
  const logger = { debug: jest.fn(), error: jest.fn() };

  let handler!: (notification: unknown, pushConfig: unknown) => Promise<void>;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios' },
      AppState: { currentState: 'background', addEventListener: jest.fn() },
    }));
    // mocked to keep the video-client / react-native-webrtc runtime out of the test
    jest.doMock('@stream-io/video-client', () => ({
      videoLoggerSystem: { getLogger: () => logger },
    }));
    jest.doMock('../../src/utils/push/libs/callingx', () => ({
      getCallingxLib: () => ({}),
    }));
    jest.doMock('../../src/utils/push/internal/utils', () => ({
      canListenToWS: () => true,
      shouldCallBeClosed: () => ({ mustEndCall: false }),
    }));
    handler =
      require('../../src/utils/push/internal/ios').onVoipNotificationReceived;
  });

  const pushConfig = {
    ios: { pushProviderName: 'voip' },
    createStreamVideoClient,
  };

  return { handler, pushConfig, createStreamVideoClient };
};

describe('onVoipNotificationReceived — payload filtering', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it.each([
    ['a non-ring stream.video payload', 'stream.video', 'call.missed'],
    ['a ring from another sender', 'other.sender', 'call.ring'],
  ])('ignores %s', async (_label, sender, type) => {
    const { handler, pushConfig, createStreamVideoClient } = setup();

    await handler({ stream: { call_cid: CALL_CID, sender, type } }, pushConfig);

    expect(createStreamVideoClient).not.toHaveBeenCalled();
  });

  it('processes a stream.video ring', async () => {
    const { handler, pushConfig, createStreamVideoClient } = setup();

    await handler(
      {
        stream: {
          call_cid: CALL_CID,
          sender: 'stream.video',
          type: 'call.ring',
        },
      },
      pushConfig,
    );

    expect(createStreamVideoClient).toHaveBeenCalledTimes(1);
  });
});

export {};
