import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import { AppStateListener } from '../../src/providers/StreamCall/AppStateListener';

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
