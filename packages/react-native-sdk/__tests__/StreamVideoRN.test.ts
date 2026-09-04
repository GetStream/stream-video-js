/**
 * Tests for the app-level (process-wide) opt-out of the Android communication-mode keep-alive.
 * It is set once at app start and lands on the native module directly; the native field is
 * sticky for the process, so there is no join-time re-application.
 */

const makeInCallManager = () => ({
  setDisableCommunicationModeWorkaround: jest.fn(),
});

/** Load StreamVideoRN with the given platform + mocked native module. */
const loadStreamVideoRN = ({
  os,
  inCallManager,
}: {
  os: 'android' | 'ios';
  inCallManager: ReturnType<typeof makeInCallManager> | undefined;
}) => {
  let StreamVideoRN!: typeof import('../src/utils/StreamVideoRN').StreamVideoRN;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({
      Platform: { OS: os, select: (o: any) => o[os] },
      NativeModules: {
        StreamInCallManager: inCallManager,
        StreamVideoReactNative: {},
      },
      NativeEventEmitter: class {
        addListener() {
          return { remove: jest.fn() };
        }
      },
    }));
    // keep the push/callingx runtime out of this test
    jest.doMock('../src/utils/push/setupIosVoipPushEvents', () => ({
      setupIosVoipPushEvents: jest.fn(),
    }));
    jest.doMock('../src/utils/push/setupAndroidPushEvents', () => ({
      setupAndroidPushEvents: jest.fn(),
    }));
    jest.doMock('../src/utils/push/setupCallingExpEvents', () => ({
      setupCallingExpEvents: jest.fn(),
    }));
    jest.doMock('../src/utils/push/libs/callingx', () => ({
      extractCallingExpOptions: jest.fn(),
      getCallingxLib: jest.fn(),
      getCallingxLibIfAvailable: jest.fn(),
    }));
    StreamVideoRN = require('../src/utils/StreamVideoRN').StreamVideoRN;
  });
  return StreamVideoRN;
};

describe('StreamVideoRN.setDisableCommunicationModeWorkaround', () => {
  afterEach(() => jest.resetModules());

  it('forwards true to the native module on Android', () => {
    const inCallManager = makeInCallManager();
    const StreamVideoRN = loadStreamVideoRN({ os: 'android', inCallManager });

    StreamVideoRN.setDisableCommunicationModeWorkaround(true);

    expect(
      inCallManager.setDisableCommunicationModeWorkaround,
    ).toHaveBeenCalledWith(true);
  });

  it('forwards false to the native module on Android', () => {
    const inCallManager = makeInCallManager();
    const StreamVideoRN = loadStreamVideoRN({ os: 'android', inCallManager });

    StreamVideoRN.setDisableCommunicationModeWorkaround(false);

    expect(
      inCallManager.setDisableCommunicationModeWorkaround,
    ).toHaveBeenCalledWith(false);
  });

  it('is a no-op on iOS', () => {
    const inCallManager = makeInCallManager();
    const StreamVideoRN = loadStreamVideoRN({ os: 'ios', inCallManager });

    StreamVideoRN.setDisableCommunicationModeWorkaround(true);

    expect(
      inCallManager.setDisableCommunicationModeWorkaround,
    ).not.toHaveBeenCalled();
  });

  it('survives a native module that predates the method (version skew)', () => {
    const inCallManager = makeInCallManager();
    delete (inCallManager as Partial<typeof inCallManager>)
      .setDisableCommunicationModeWorkaround;
    const StreamVideoRN = loadStreamVideoRN({ os: 'android', inCallManager });

    expect(() =>
      StreamVideoRN.setDisableCommunicationModeWorkaround(true),
    ).not.toThrow();
  });

  it('survives the native module being absent entirely', () => {
    const StreamVideoRN = loadStreamVideoRN({
      os: 'android',
      inCallManager: undefined,
    });

    expect(() =>
      StreamVideoRN.setDisableCommunicationModeWorkaround(true),
    ).not.toThrow();
  });
});
