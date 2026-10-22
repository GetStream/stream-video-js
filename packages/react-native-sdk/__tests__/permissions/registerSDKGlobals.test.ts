import {
  AppState,
  type AppStateStatus,
  PermissionsAndroid,
  Platform,
} from 'react-native';

const mockQuery = jest.fn();

jest.mock('@stream-io/react-native-webrtc', () => ({
  ...jest.requireActual('@stream-io/react-native-webrtc'),
  permissions: { query: (...args: unknown[]) => mockQuery(...args) },
}));

jest.mock('../../src/utils/internal/registerMediaEngine', () => ({
  registerCallMediaEngine: jest.fn(),
}));

describe('registerSDKGlobals permissions', () => {
  beforeAll(() => {
    const { registerSDKGlobals } = jest.requireActual(
      '../../src/utils/internal/registerSDKGlobals',
    );
    globalThis.streamRNVideoSDK = undefined;
    registerSDKGlobals();
  });

  it('queries the native permission state', async () => {
    const query = globalThis.streamRNVideoSDK!.permissions.query!;

    // iOS
    mockQuery.mockResolvedValueOnce('denied');
    await expect(query('microphone')).resolves.toBe('denied');
    mockQuery.mockResolvedValueOnce('tvOS is not supported');
    await expect(query('camera')).rejects.toThrow('Unexpected');

    // Android
    Platform.OS = 'android';
    jest.spyOn(PermissionsAndroid, 'check').mockResolvedValueOnce(false);
    await expect(query('microphone')).resolves.toBe('prompt');
    Platform.OS = 'ios';
  });

  it('notifies when the app returns to foreground', () => {
    let onChange: (state: AppStateStatus) => void = () => {};
    const remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, cb) => {
      onChange = cb;
      return { remove } as any;
    });
    const cb = jest.fn();

    const unsubscribe =
      globalThis.streamRNVideoSDK!.nativeEvents.appForeground!.subscribe(cb);
    onChange('background');
    onChange('active');
    onChange('active'); // already active
    onChange('inactive');
    onChange('active');
    expect(cb).toHaveBeenCalledTimes(2);

    unsubscribe();
    expect(remove).toHaveBeenCalled();
  });
});
