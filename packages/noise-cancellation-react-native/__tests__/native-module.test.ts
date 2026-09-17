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

test('adapts synchronous controls to Promises and dispatches change after success', async () => {
  const { NoiseCancellation } = load();
  const noiseCancellation = new NoiseCancellation();
  const onChange = jest.fn();
  noiseCancellation.on('change', onChange);

  const enabled = noiseCancellation.enable();
  expect(enabled).toBeInstanceOf(Promise);
  expect(nativeModule.setEnabled).toHaveBeenCalledWith(true);
  expect(onChange).not.toHaveBeenCalled();
  await expect(enabled).resolves.toBeUndefined();
  expect(onChange).toHaveBeenNthCalledWith(1, true);

  const disabled = noiseCancellation.disable();
  expect(disabled).toBeInstanceOf(Promise);
  expect(nativeModule.setEnabled).toHaveBeenLastCalledWith(false);
  expect(onChange).toHaveBeenCalledTimes(1);
  await expect(disabled).resolves.toBeUndefined();
  expect(onChange).toHaveBeenNthCalledWith(2, false);
});

test('rejects adapter calls but throws from direct helpers without dispatching change', async () => {
  const { NoiseCancellation, setEnabled } = load();
  const error = new Error('Noise cancellation filter not registered');
  nativeModule.setEnabled.mockImplementation(() => {
    throw error;
  });
  const noiseCancellation = new NoiseCancellation();
  const onChange = jest.fn();
  noiseCancellation.on('change', onChange);

  await expect(noiseCancellation.enable()).rejects.toBe(error);
  await expect(noiseCancellation.disable()).rejects.toBe(error);
  expect(() => setEnabled(true)).toThrow(error);
  expect(onChange).not.toHaveBeenCalled();
});

test('returns native boolean results directly from exported helpers', () => {
  const { isEnabled, setEnabled, deviceSupportsAdvancedAudioProcessing } =
    load();

  expect(isEnabled()).toBe(true);
  expect(setEnabled(false)).toBe(true);
  expect(deviceSupportsAdvancedAudioProcessing()).toBe(true);
  expect(nativeModule.isEnabled).toHaveBeenCalledTimes(1);
  expect(nativeModule.setEnabled).toHaveBeenCalledWith(false);
  expect(
    nativeModule.deviceSupportsAdvancedAudioProcessing,
  ).toHaveBeenCalledTimes(1);
});

test('keeps instance queries and lifecycle methods Promise-based while helpers return booleans', async () => {
  const {
    NoiseCancellation,
    isEnabled,
    deviceSupportsAdvancedAudioProcessing,
  } = load();
  nativeModule.isEnabled.mockReturnValue(false);
  nativeModule.deviceSupportsAdvancedAudioProcessing.mockReturnValue(false);
  const noiseCancellation = new NoiseCancellation();

  expect(isEnabled()).toBe(false);
  expect(deviceSupportsAdvancedAudioProcessing()).toBe(false);
  for (const query of [
    noiseCancellation.isEnabled,
    noiseCancellation.canAutoEnable,
  ]) {
    const result = query();
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBe(false);
  }
  for (const lifecycle of [noiseCancellation.init, noiseCancellation.dispose]) {
    const result = lifecycle();
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBeUndefined();
  }
});

test('converts synchronous query errors to adapter rejections', async () => {
  const {
    NoiseCancellation,
    isEnabled,
    deviceSupportsAdvancedAudioProcessing,
  } = load();
  const error = new Error('Native query failed');
  const throwError = () => {
    throw error;
  };
  nativeModule.isEnabled.mockImplementation(throwError);
  nativeModule.deviceSupportsAdvancedAudioProcessing.mockImplementation(
    throwError,
  );
  const noiseCancellation = new NoiseCancellation();

  expect(isEnabled).toThrow(error);
  expect(deviceSupportsAdvancedAudioProcessing).toThrow(error);
  await expect(noiseCancellation.isEnabled()).rejects.toBe(error);
  await expect(noiseCancellation.canAutoEnable()).rejects.toBe(error);
});
