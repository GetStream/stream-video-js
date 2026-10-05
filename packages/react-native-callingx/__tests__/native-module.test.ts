// JS contract tests; native registration and call behavior require device tests.
const emptySnapshot = { endpoints: [], currentEndpoint: null };
const snapshot = {
  endpoints: [{ id: 'e1', name: 'Speaker', type: 'speaker' }],
  currentEndpoint: 'e1',
};
const subscription = { remove: jest.fn() };
const nativeModule = {
  setCurrentCallActive: jest.fn(() => true),
  answerIncomingCall: jest.fn(() => true),
  updateDisplay: jest.fn(() => true),
  endCallWithReason: jest.fn(() => true),
  setMutedCall: jest.fn(() => true),
  setOnHoldCall: jest.fn(() => true),
  requestAudioEndpointChange: jest.fn(() => true),
  stopService: jest.fn(() => true),
  startBackgroundTask: jest.fn(() => true),
  getAvailableAudioEndpoints: jest.fn(() => JSON.stringify(snapshot)),
  onNewEvent: jest.fn(() => subscription),
  onNewVoipEvent: jest.fn(() => subscription),
};
const getEnforcing = jest.fn(() => nativeModule);
const platform = { OS: 'android' };
const load = () =>
  (require('../src') as typeof import('../src')).CallingxModule;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  platform.OS = 'android';
  getEnforcing.mockReturnValue(nativeModule);
  jest.doMock('react-native', () => ({
    TurboModuleRegistry: { getEnforcing },
    Platform: platform,
    AppRegistry: { registerHeadlessTask: jest.fn() },
  }));
});

test('looks the native module up by its registered name on import', () => {
  load();
  expect(getEnforcing).toHaveBeenCalledWith('Callingx');
});

test.each([
  ['setCurrentCallActive', ['call-1'], ['call-1']],
  ['answerIncomingCall', ['call-1'], ['call-1']],
  [
    'updateDisplay',
    ['call-1', '+1', 'Alice', true],
    ['call-1', '+1', 'Alice', { displayTitle: 'Alice' }],
  ],
  ['endCallWithReason', ['call-1', 'remote'], ['call-1', expect.any(Number)]],
  ['setMutedCall', ['call-1', true], ['call-1', true]],
  ['setOnHoldCall', ['call-1', true], ['call-1', true]],
  ['requestAudioEndpointChange', ['call-1', 'e1'], ['call-1', 'e1']],
  ['stopService', [], []],
] as const)(
  '%s runs synchronously and rethrows native errors',
  (method, args, nativeArgs) => {
    const module = load() as any;
    const native = nativeModule[method] as jest.Mock;

    expect(module[method](...args)).toBeUndefined();
    expect(native).toHaveBeenCalledWith(...nativeArgs);

    const error = new Error('native failure');
    native.mockImplementationOnce(() => {
      throw error;
    });
    expect(() => module[method](...args)).toThrow(error);
  },
);

describe('getAvailableAudioEndpoints', () => {
  test('parses the native JSON snapshot', () => {
    expect(load().getAvailableAudioEndpoints('call-1')).toEqual(snapshot);
    expect(nativeModule.getAvailableAudioEndpoints).toHaveBeenCalledWith(
      'call-1',
    );
  });

  test('returns the empty snapshot when native throws', () => {
    nativeModule.getAvailableAudioEndpoints.mockImplementationOnce(() => {
      throw new Error('native failure');
    });
    expect(load().getAvailableAudioEndpoints('call-1')).toEqual(emptySnapshot);
  });

  test('returns the empty snapshot on iOS without calling native', () => {
    platform.OS = 'ios';
    expect(load().getAvailableAudioEndpoints('call-1')).toEqual(emptySnapshot);
    expect(nativeModule.getAvailableAudioEndpoints).not.toHaveBeenCalled();
  });
});

test('acquireBackgroundTask rethrows native failures without retaining the owner', () => {
  const module = load();
  const error = new Error('start failed');
  nativeModule.startBackgroundTask.mockImplementationOnce(() => {
    throw error;
  });
  expect(() => module.acquireBackgroundTask('owner')).toThrow(error);

  expect(module.acquireBackgroundTask('owner')).toBeUndefined();
  expect(nativeModule.startBackgroundTask).toHaveBeenCalledTimes(2);
  expect(module.releaseBackgroundTask('owner')).toBeUndefined();
});

test('addEventListener subscribes once and removes after the last listener', () => {
  const module = load();
  const first = module.addEventListener('answerCall', jest.fn());
  const second = module.addEventListener('endCall', jest.fn());
  expect(nativeModule.onNewEvent).toHaveBeenCalledTimes(1);
  expect(nativeModule.onNewVoipEvent).not.toHaveBeenCalled();

  first.remove();
  expect(subscription.remove).not.toHaveBeenCalled();
  second.remove();
  expect(subscription.remove).toHaveBeenCalledTimes(1);

  const voip = module.addEventListener('voipNotificationReceived', jest.fn());
  expect(nativeModule.onNewVoipEvent).toHaveBeenCalledTimes(1);
  voip.remove();
  expect(subscription.remove).toHaveBeenCalledTimes(2);
});
