/**
 * Recents redial: `didReceiveStartCallIntent` rings the users found in the handle, but only when
 * `ios.callsHistory.enabled` is set.
 */

const logger = { debug: jest.fn(), error: jest.fn() };

const setup = (callsHistory?: { enabled?: boolean; callType?: string }) => {
  const getOrCreate = jest.fn().mockResolvedValue(undefined);
  const call = jest.fn().mockReturnValue({ getOrCreate });
  const client = { call, state: { connectedUser: { id: 'me' } } };
  const createStreamVideoClient = jest.fn().mockResolvedValue(client);

  let handler!: (params: { handle: string; isVideo: boolean }) => Promise<void>;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios' },
      AppState: { currentState: 'active', addEventListener: jest.fn() },
    }));
    jest.doMock('@stream-io/video-client', () => ({
      CallingState: {},
      videoLoggerSystem: { getLogger: () => logger },
    }));
    jest.doMock('../../src/utils/push/libs/callingx', () => ({
      getCallingxLib: () => ({}),
    }));
    jest.doMock('../../src/utils/push/internal/utils', () => ({
      clearPushWSEventSubscriptions: jest.fn(),
      processCallFromPushInBackground: jest.fn(),
    }));
    jest.doMock('../../src/utils/push/internal/android', () => ({
      onRingNotificationReceived: jest.fn(),
    }));
    const {
      onStartCallIntent,
    } = require('../../src/utils/push/setupCallingExpEvents');
    handler = onStartCallIntent({
      ios: { pushProviderName: 'voip', callsHistory },
      createStreamVideoClient,
    });
  });

  return { handler, call, getOrCreate, createStreamVideoClient };
};

describe('onStartCallIntent', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('does nothing when callsHistory is disabled', async () => {
    const { handler, createStreamVideoClient, call } = setup({
      enabled: false,
    });
    await handler({ handle: 'bob', isVideo: false });
    expect(createStreamVideoClient).not.toHaveBeenCalled();
    expect(call).not.toHaveBeenCalled();
  });

  it('does nothing when callsHistory is not configured', async () => {
    const { handler, call } = setup(undefined);
    await handler({ handle: 'bob', isVideo: false });
    expect(call).not.toHaveBeenCalled();
  });

  it('rings the users from the handle with the configured call type', async () => {
    const { handler, call, getOrCreate } = setup({
      enabled: true,
      callType: 'audio_room',
    });
    await handler({ handle: 'bob, amy', isVideo: true });

    expect(call).toHaveBeenCalledWith('audio_room', expect.any(String));
    expect(getOrCreate).toHaveBeenCalledWith({
      ring: true,
      video: true,
      data: {
        members: [{ user_id: 'me' }, { user_id: 'bob' }, { user_id: 'amy' }],
      },
    });
  });

  it('defaults to the default call type and filters the current user id and empties', async () => {
    const { handler, call, getOrCreate } = setup({ enabled: true });
    await handler({ handle: 'me,,bob,', isVideo: false });

    expect(call).toHaveBeenCalledWith('default', expect.any(String));
    expect(getOrCreate).toHaveBeenCalledWith({
      ring: true,
      video: false,
      data: { members: [{ user_id: 'me' }, { user_id: 'bob' }] },
    });
  });

  it('does not create a call when only the current user is in the handle', async () => {
    const { handler, call } = setup({ enabled: true });
    await handler({ handle: 'me', isVideo: false });
    expect(call).not.toHaveBeenCalled();
  });

  it('swallows errors', async () => {
    const { handler, getOrCreate } = setup({ enabled: true });
    getOrCreate.mockRejectedValueOnce(new Error('boom'));
    await expect(
      handler({ handle: 'bob', isVideo: false }),
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});
