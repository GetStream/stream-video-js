import React from 'react';
import { AppState, Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import { AppStateListener } from '../../src/providers/StreamCall/AppStateListener';
import NativeStreamVideoReactNative from '../../src/native/NativeStreamVideoReactNative';
import { isInPiPMode$ } from '../../src/utils/internal/rxSubjects';

const mockNative = NativeStreamVideoReactNative as jest.Mocked<
  typeof NativeStreamVideoReactNative
>;

const mockRemove = jest.fn();
const mockGetCurrentAppState = jest.fn();
let mockOnAppStateChanged: (state: string) => void;
const mockSubscribe = jest.fn((listener: (state: string) => void) => {
  mockOnAppStateChanged = listener;
  return { remove: mockRemove };
});

jest.mock('../../src/native/NativeStreamVideoAppLifecycle', () => ({
  __esModule: true,
  default: {
    getCurrentAppState: () => mockGetCurrentAppState(),
    onAppStateChanged: (listener: (state: string) => void) =>
      mockSubscribe(listener),
  },
}));

const mockCamera = {
  state: { status: 'enabled' },
  disable: jest.fn().mockResolvedValue(undefined),
  enable: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stream-io/video-react-bindings', () => ({
  useCall: () => ({ camera: mockCamera }),
}));

describe('AppStateListener (Android)', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    // the Android branch checks Platform.OS inside the effect, at runtime
    Platform.OS = 'android';
    mockGetCurrentAppState.mockReturnValue('active');
  });

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('reads the initial state synchronously and subscribes to the codegen event', () => {
    render(<AppStateListener />);
    expect(mockGetCurrentAppState).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });

  it('removes the event subscription on unmount', () => {
    const { unmount } = render(<AppStateListener />);
    expect(mockRemove).not.toHaveBeenCalled();
    unmount();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it('swallows errors thrown by the sync getter and still subscribes', () => {
    mockGetCurrentAppState.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(() => render(<AppStateListener />)).not.toThrow();
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });

  it('handles background events emitted by the native module', () => {
    render(<AppStateListener />);
    mockOnAppStateChanged('background');
    expect(mockCamera.disable).toHaveBeenCalledTimes(1);
  });

  it('ignores unknown app states emitted by the native module', () => {
    render(<AppStateListener />);
    mockOnAppStateChanged('inactive');
    expect(mockCamera.disable).not.toHaveBeenCalled();
  });
});

describe('AppStateListener (Android 8+ PiP)', () => {
  const originalOS = Platform.OS;
  const originalVersion = Platform.Version;
  const originalAppState = AppState.currentState;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    Platform.Version = 33;
    mockGetCurrentAppState.mockReturnValue('active');
    isInPiPMode$.next(false);
  });

  afterEach(() => {
    Platform.OS = originalOS;
    Platform.Version = originalVersion;
    AppState.currentState = originalAppState;
  });

  it('reads the initial PiP mode synchronously and follows onPiPChange until unmount', () => {
    const remove = jest.fn();
    let emitPiPChange!: (value: boolean) => void;
    mockNative.isInPiPMode.mockReturnValueOnce(true);
    (mockNative.onPiPChange as jest.Mock).mockImplementationOnce(
      (listener: (value: boolean) => void) => {
        emitPiPChange = listener;
        return { remove };
      },
    );

    const { unmount } = render(<AppStateListener />);
    expect(isInPiPMode$.getValue()).toBe(true);

    emitPiPChange(false);
    expect(isInPiPMode$.getValue()).toBe(false);

    unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('swallows errors thrown by isInPiPMode and still subscribes', () => {
    mockNative.isInPiPMode.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    expect(() => render(<AppStateListener />)).not.toThrow();
    expect(mockNative.onPiPChange).toHaveBeenCalledTimes(1);
  });

  it('keeps the camera on when backgrounded into PiP', () => {
    render(<AppStateListener />);
    mockNative.isInPiPMode.mockReturnValueOnce(true);
    AppState.currentState = 'background';
    mockOnAppStateChanged('background');
    expect(isInPiPMode$.getValue()).toBe(true);
    expect(mockCamera.disable).not.toHaveBeenCalled();
  });

  it('disables the camera when backgrounded without PiP and keep-alive is unavailable', () => {
    render(<AppStateListener />);
    mockNative.isCallAliveConfigured.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    AppState.currentState = 'background';
    mockOnAppStateChanged('background');
    expect(isInPiPMode$.getValue()).toBe(false);
    expect(mockCamera.disable).toHaveBeenCalledTimes(1);
  });

  it('keeps the camera on when backgrounded without PiP but keep-alive is configured', () => {
    render(<AppStateListener />);
    mockNative.isCallAliveConfigured.mockReturnValueOnce(true);
    AppState.currentState = 'background';
    mockOnAppStateChanged('background');
    expect(mockCamera.disable).not.toHaveBeenCalled();
  });
});
