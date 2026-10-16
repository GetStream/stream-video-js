import React from 'react';
import { AppState, Platform } from 'react-native';
import { act, render, renderHook } from '@testing-library/react-native';
import NativeStreamVideoReactNative from '../../src/native/NativeStreamVideoReactNative';
import NativeStreamVideoAppLifecycle from '../../src/native/NativeStreamVideoAppLifecycle';
import { Commands } from '../../src/native/RTCViewPipNativeComponent';
import { AppStateListener } from '../../src/providers/StreamCall/AppStateListener';
import { DeviceStats } from '../../src/providers/StreamCall/DeviceStats';
import {
  onNativeCallClosed,
  onNativeDimensionsUpdated,
  RTCViewPipNative,
  type RTCViewPipNativeRef,
} from '../../src/components/Call/CallContent/RTCViewPipNative';
import { useIsIosScreenshareBroadcastStarted } from '../../src/hooks/useIsIosScreenshareBroadcastStarted';
import { StreamVideoRN } from '../../src/utils/StreamVideoRN';
import { isInPiPMode$ } from '../../src/utils/internal/rxSubjects';

// the native modules are mocked in jest-setup.ts
const mockNative = jest.mocked(NativeStreamVideoReactNative);
const mockLifecycle = jest.mocked(NativeStreamVideoAppLifecycle!);

const mockCamera = {
  state: { status: 'enabled' },
  disable: jest.fn().mockResolvedValue(undefined),
};
const mockTrace = jest.fn();
jest.mock('@stream-io/video-react-bindings', () => ({
  useCall: () => ({ camera: mockCamera, tracer: { trace: mockTrace } }),
  useCallStateHooks: () => ({ useCallCallingState: () => 'joined' }),
}));

const mockSetThermalState = jest.fn();
jest.mock('@stream-io/video-client', () => ({
  ...jest.requireActual('@stream-io/video-client'),
  setThermalState: (v: string) => mockSetThermalState(v),
}));

/** The listener and subscription of the latest codegen `EventEmitter` call. */
const lastSubscription = <T,>(event: unknown) => {
  const { calls, results } = (event as jest.Mock).mock;
  return {
    emit: calls[calls.length - 1][0] as (value: T) => void,
    remove: results[results.length - 1]!.value.remove as jest.Mock,
  };
};

const setPlatform = (os: 'ios' | 'android', version: string | number) => {
  Platform.OS = os;
  Platform.Version = version;
};

describe('native module consumers', () => {
  const originalAppState = AppState.currentState;

  beforeEach(() => {
    jest.clearAllMocks();
    isInPiPMode$.next(false);
  });

  afterEach(() => {
    setPlatform('ios', '16.2');
    AppState.currentState = originalAppState;
  });

  it('DeviceStats reads state synchronously, follows events and unsubscribes', () => {
    setPlatform('android', 33);
    mockNative.currentThermalState.mockReturnValueOnce('LIGHT');
    const { unmount } = render(<DeviceStats />);
    expect(mockSetThermalState).toHaveBeenCalledWith('LIGHT');
    expect(mockNative.startThermalStatusUpdates).toHaveBeenCalledTimes(1);

    const thermal = lastSubscription<string>(mockNative.onThermalStateChanged);
    thermal.emit('SEVERE');
    expect(mockSetThermalState).toHaveBeenLastCalledWith('SEVERE');

    unmount();
    expect(thermal.remove).toHaveBeenCalledTimes(1);
    expect(mockNative.stopThermalStatusUpdates).toHaveBeenCalledTimes(1);
  });

  it('useIsIosScreenshareBroadcastStarted follows broadcast events', () => {
    const { result, unmount } = renderHook(() =>
      useIsIosScreenshareBroadcastStarted(),
    );
    const screenShare = lastSubscription<{ name: string }>(
      mockNative.onScreenShareEvent,
    );
    act(() => screenShare.emit({ name: 'iOS_BroadcastStarted' }));
    expect(result.current).toBe(true);
    unmount();
    expect(screenShare.remove).toHaveBeenCalledTimes(1);
  });

  it('StreamVideoRN hardware checks are sync on Android and throw elsewhere', () => {
    expect(() => StreamVideoRN.androidHasCameraHardware()).toThrow();
    setPlatform('android', 33);
    mockNative.hasCameraHardware.mockReturnValueOnce(true);
    expect(StreamVideoRN.androidHasCameraHardware()).toBe(true);
  });

  it('AppStateListener follows app state and PiP events on Android', () => {
    setPlatform('android', 33);
    mockNative.isInPiPMode.mockReturnValueOnce(true);
    const { unmount } = render(<AppStateListener />);
    expect(isInPiPMode$.getValue()).toBe(true);
    const pip = lastSubscription<boolean>(mockNative.onPiPChange);
    pip.emit(false);
    expect(isInPiPMode$.getValue()).toBe(false);

    // backgrounded without PiP or keep-alive: the camera is disabled
    const appState = lastSubscription<string>(mockLifecycle.onAppStateChanged);
    AppState.currentState = 'background';
    appState.emit('background');
    expect(mockCamera.disable).toHaveBeenCalledTimes(1);

    unmount();
    expect(pip.remove).toHaveBeenCalledTimes(1);
    expect(appState.remove).toHaveBeenCalledTimes(1);
  });

  it('RTCViewPipNative dispatches commands on iOS only', () => {
    const view = {} as RTCViewPipNativeRef;
    onNativeCallClosed(view);
    onNativeDimensionsUpdated(view, 320, 180);
    onNativeCallClosed(null);
    expect(Commands.onCallClosed).toHaveBeenCalledTimes(1);
    expect(Commands.setPreferredContentSize).toHaveBeenCalledWith(
      view,
      320,
      180,
    );

    jest.clearAllMocks();
    setPlatform('android', 33);
    onNativeCallClosed(view);
    expect(Commands.onCallClosed).not.toHaveBeenCalled();
    expect(render(<RTCViewPipNative streamURL="stream" />).toJSON()).toBeNull();
  });
});
