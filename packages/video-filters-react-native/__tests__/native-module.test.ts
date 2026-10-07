// JS contract tests; native registration and video processing require device tests.
const nativeModule = {
  registerBackgroundBlurVideoFilters: jest.fn(() => true),
  registerVirtualBackgroundFilter: jest.fn<boolean, [string]>(() => true),
  registerBlurVideoFilters: jest.fn(() => true),
  unregisterAllFilters: jest.fn(() => true),
};
const getEnforcing = jest.fn(() => nativeModule);
const resolveAssetSource = jest.fn((source: unknown) => ({
  uri: `resolved://${String(source)}`,
}));
const load = () => require('../src') as typeof import('../src');

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.doMock('react-native', () => ({
    TurboModuleRegistry: { getEnforcing },
    Image: { resolveAssetSource },
  }));
});

test('looks the native module up by its registered name on import', () => {
  load();
  expect(getEnforcing).toHaveBeenCalledWith('VideoFiltersReactNative');
});

test.each([
  'registerBackgroundBlurVideoFilters',
  'registerBlurVideoFilters',
  'unregisterAllFilters',
] as const)(
  '%s returns the native result synchronously and rethrows errors',
  (method) => {
    const api = load();
    const result = api[method]();
    expect(result).not.toBeInstanceOf(Promise);
    expect(result).toBe(true);
    expect(nativeModule[method]).toHaveBeenCalledTimes(1);

    const error = new Error('Native registration failed');
    nativeModule[method].mockImplementationOnce(() => {
      throw error;
    });
    expect(() => api[method]()).toThrow(error);
  },
);

test('registerVirtualBackgroundFilter registers and returns the resolved URI', () => {
  const { registerVirtualBackgroundFilter } = load();
  expect(registerVirtualBackgroundFilter(42)).toBe('resolved://42');
  expect(resolveAssetSource).toHaveBeenCalledWith(42);
  expect(nativeModule.registerVirtualBackgroundFilter).toHaveBeenCalledWith(
    'resolved://42',
  );
});
