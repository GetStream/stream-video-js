// JS contract tests; native registration and audio processing require device tests.
const nativeModule = {
  isEnabled: jest.fn(() => true),
  setEnabled: jest.fn<boolean, [boolean]>(() => true),
  deviceSupportsAdvancedAudioProcessing: jest.fn(() => true),
};
const getEnforcing = jest.fn(() => nativeModule);
const load = () => require('../src') as typeof import('../src');

beforeEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
  nativeModule.isEnabled.mockReturnValue(true);
  nativeModule.setEnabled.mockReturnValue(true);
  nativeModule.deviceSupportsAdvancedAudioProcessing.mockReturnValue(true);
  getEnforcing.mockReturnValue(nativeModule);
  jest.doMock('react-native', () => ({
    TurboModuleRegistry: { getEnforcing },
  }));
});

test('looks the native module up by its registered name on import', () => {
  load();
  expect(getEnforcing).toHaveBeenCalledWith('NoiseCancellationReactNative');
});

test('propagates the error when the native module is missing', () => {
  const error = new Error('NoiseCancellationReactNative could not be found');
  getEnforcing.mockImplementationOnce(() => {
    throw error;
  });
  expect(load).toThrow(error);
});

test.each([
  ['enable', true],
  ['disable', false],
] as const)(
  '%s adapts native results, event timing, and errors',
  async (method, enabled) => {
    const { NoiseCancellation, setEnabled } = load();
    const adapter = new NoiseCancellation();
    const onChange = jest.fn();
    adapter.on('change', onChange);

    expect(setEnabled(enabled)).toBe(true);
    const result = adapter[method]();
    expect(result).toBeInstanceOf(Promise);
    expect(nativeModule.setEnabled.mock.calls).toEqual([[enabled], [enabled]]);
    expect(onChange).not.toHaveBeenCalled();
    await expect(result).resolves.toBeUndefined();
    expect(onChange.mock.calls).toEqual([[enabled]]);

    const error = new Error('Processor not registered');
    nativeModule.setEnabled.mockImplementation(() => {
      throw error;
    });
    expect(() => setEnabled(enabled)).toThrow(error);
    await expect(adapter[method]()).rejects.toBe(error);
    expect(onChange).toHaveBeenCalledTimes(1);
  },
);

test.each([
  ['isEnabled', 'isEnabled'],
  ['deviceSupportsAdvancedAudioProcessing', 'canAutoEnable'],
] as const)(
  '%s returns booleans directly and Promises through %s',
  async (nativeMethod, adapterMethod) => {
    const api = load();
    const adapter = new api.NoiseCancellation();
    const query = nativeModule[nativeMethod];

    for (const value of [true, false]) {
      query.mockReturnValue(value);
      expect(api[nativeMethod]()).toBe(value);
      const result = adapter[adapterMethod]();
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBe(value);
    }
    expect(query).toHaveBeenCalledTimes(4);

    const error = new Error('Native query failed');
    query.mockImplementation(() => {
      throw error;
    });
    expect(api[nativeMethod]).toThrow(error);
    await expect(adapter[adapterMethod]()).rejects.toBe(error);
  },
);

test.each(['init', 'dispose'] as const)(
  '%s returns a resolved Promise',
  async (method) => {
    const { NoiseCancellation } = load();
    const result = new NoiseCancellation()[method]();
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBeUndefined();
  },
);
