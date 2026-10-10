// Import Jest Native matchers
import '@testing-library/jest-native/extend-expect';

const mockedMedia = {
  getTracks: jest.fn().mockReturnValue([
    {
      id: 'mocked-track-id',
      kind: 'mocked-kind',
      label: 'mocked-label',
      enabled: true,
      muted: false,
      readyState: 'mocked-ready-state',
      stop: jest.fn(),
    },
  ]),
};
const mockedDevices = [
  {
    deviceId: 'mocked-device-id',
    groupId: 'mocked-group-id',
    kind: 'mocked-kind',
    label: 'mocked-label',
  },
];

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  default: {
    OS: 'ios',
    select: jest.fn((selector) => selector.ios),
    Version: '16.2',
    constants: {
      osVersion: '16.2',
      systemName: 'iOS',
    },
  },
}));

jest.mock('react-native-reanimated', () => {
  const RNReanimatedmock = require('react-native-reanimated/mock');
  return { ...RNReanimatedmock, runOnUI: (fn: any) => fn };
});

// When mocking we implement only the needed navigator APIs, hence the suppression rule
global.navigator = {
  // @ts-expect-error due to dom typing incompatible with RN
  mediaDevices: {
    getUserMedia: jest.fn().mockResolvedValue(mockedMedia),
    enumerateDevices: jest.fn().mockResolvedValue(mockedDevices),
  },
  product: 'ReactNative',
};

// @ts-expect-error due to dom typing incompatible with RN
global.RTCPeerConnection = jest.fn();

// Codegen TurboModule mock: any method is a lazily created jest.fn; `on*` events return a subscription.
const mockTurboModule = (defaults: Record<string, unknown> = {}) =>
  new Proxy({} as Record<string, jest.Mock>, {
    get: (target, key) => {
      if (typeof key !== 'string' || key === 'then') return undefined;
      target[key] ??= key.startsWith('on')
        ? jest.fn(() => ({ remove: jest.fn() }))
        : jest.fn(() => defaults[key]);
      return target[key];
    },
  });

jest.mock('./src/native/NativeStreamInCallManager', () => ({
  __esModule: true,
  default: mockTurboModule({ getAudioStateLog: '' }),
}));

jest.mock('./src/native/NativeStreamVideoReactNative', () => ({
  __esModule: true,
  default: mockTurboModule({
    currentThermalState: 'NONE',
    getBatteryState: { charging: false, level: 100 },
  }),
}));

jest.mock('./src/native/NativeStreamVideoAppLifecycle', () => ({
  __esModule: true,
  default: mockTurboModule({ getCurrentAppState: 'active' }),
}));

jest.mock('./src/native/RTCViewPipNativeComponent', () => ({
  __esModule: true,
  default: require('react-native').View,
  Commands: { onCallClosed: jest.fn(), setPreferredContentSize: jest.fn() },
}));
