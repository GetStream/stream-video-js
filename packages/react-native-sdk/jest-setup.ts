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

jest.mock('./src/native/NativeStreamInCallManager', () => ({
  __esModule: true,
  default: {
    setAudioRole: jest.fn(),
    setDefaultAudioDeviceEndpointType: jest.fn(),
    setTelecomManagedMode: jest.fn(),
    setDisableCommunicationModeWorkaround: jest.fn(),
    setEnableStereoAudioOutput: jest.fn(),
    setMuteMode: jest.fn(),
    setRecordingAlwaysPreparedMode: jest.fn(),
    setup: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    showAudioRoutePicker: jest.fn(),
    getAudioDeviceStatus: jest.fn(),
    chooseAudioDeviceEndpoint: jest.fn(),
    reapplyAudioRoute: jest.fn(),
    setForceSpeakerphoneOn: jest.fn(),
    setMicrophoneMute: jest.fn(),
    logAudioState: jest.fn(),
    getAudioStateLog: jest.fn(() => ''),
    playSound: jest.fn(),
    stopSound: jest.fn(),
    muteAudioOutput: jest.fn(),
    unmuteAudioOutput: jest.fn(),
    onAudioDeviceChanged: jest.fn(() => ({ remove: jest.fn() })),
    onAudioInterruption: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

jest.mock('./src/native/NativeStreamVideoReactNative', () => ({
  __esModule: true,
  default: {
    getDefaultRingtoneUrl: jest.fn(() => null),
    isInPiPMode: jest.fn(() => false),
    isCallAliveConfigured: jest.fn(() => false),
    startKeepCallAliveService: jest.fn(),
    stopKeepCallAliveService: jest.fn(),
    canAutoEnterPipMode: jest.fn(),
    exitPipMode: jest.fn(),
    startThermalStatusUpdates: jest.fn(),
    stopThermalStatusUpdates: jest.fn(),
    currentThermalState: jest.fn(() => 'NONE'),
    isLowPowerModeEnabled: jest.fn(() => false),
    getBatteryState: jest.fn(() => ({ charging: false, level: 100 })),
    takeScreenshot: jest.fn(),
    hasAudioOutputHardware: jest.fn(() => true),
    hasMicrophoneHardware: jest.fn(() => true),
    hasCameraHardware: jest.fn(() => true),
    captureRef: jest.fn(),
    checkPermission: jest.fn(),
    playBusyTone: jest.fn(),
    stopBusyTone: jest.fn(),
    startInAppScreenCapture: jest.fn(),
    stopInAppScreenCapture: jest.fn(),
    startScreenShareAudioMixing: jest.fn(),
    stopScreenShareAudioMixing: jest.fn(),
    startTrackRecording: jest.fn(),
    stopTrackRecording: jest.fn(),
    clearStreamRecordings: jest.fn(),
    getStreamRecordings: jest.fn(),
    onPiPChange: jest.fn(() => ({ remove: jest.fn() })),
    onScreenShareEvent: jest.fn(() => ({ remove: jest.fn() })),
    onLowPowerModeChanged: jest.fn(() => ({ remove: jest.fn() })),
    onThermalStateChanged: jest.fn(() => ({ remove: jest.fn() })),
    onChargingStateChanged: jest.fn(() => ({ remove: jest.fn() })),
  },
}));
