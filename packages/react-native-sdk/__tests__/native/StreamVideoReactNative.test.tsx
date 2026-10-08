import React from 'react';
import { Platform } from 'react-native';
import { act, render, renderHook } from '@testing-library/react-native';
import NativeStreamVideoReactNative from '../../src/native/NativeStreamVideoReactNative';
import { DeviceStats } from '../../src/providers/StreamCall/DeviceStats';
import { useIsIosScreenshareBroadcastStarted } from '../../src/hooks/useIsIosScreenshareBroadcastStarted';
import { getAndroidDefaultRingtoneUrl } from '../../src/utils/getAndroidDefaultRingtoneUrl';
import { StreamVideoRN } from '../../src/utils/StreamVideoRN';

const mockNative = NativeStreamVideoReactNative as jest.Mocked<
  typeof NativeStreamVideoReactNative
>;

const mockTrace = jest.fn();
const mockCall = { tracer: { trace: mockTrace } };
jest.mock('@stream-io/video-react-bindings', () => ({
  useCall: () => mockCall,
  useCallStateHooks: () => ({
    useCallCallingState: () => 'joined',
  }),
}));

const mockSetPowerState = jest.fn();
const mockSetThermalState = jest.fn();
jest.mock('@stream-io/video-client', () => ({
  ...jest.requireActual('@stream-io/video-client'),
  setPowerState: (v: boolean) => mockSetPowerState(v),
  setThermalState: (v: string) => mockSetThermalState(v),
}));

type Listener<T> = (value: T) => void;

/** Captures the listener and the `remove` spy of a codegen `EventEmitter` mock. */
const captureEvent = <T,>(emitter: unknown) => {
  const remove = jest.fn();
  let listener!: Listener<T>;
  (emitter as jest.Mock).mockImplementation((l: Listener<T>) => {
    listener = l;
    return { remove };
  });
  return { remove, emit: (value: T) => listener(value) };
};

describe('StreamVideoReactNative spec consumers', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    Platform.OS = originalOS;
    jest.useRealTimers();
  });

  describe('DeviceStats', () => {
    it('reads the initial device state synchronously', () => {
      mockNative.isLowPowerModeEnabled.mockReturnValue(true);
      mockNative.currentThermalState.mockReturnValue('LIGHT');
      mockNative.getBatteryState.mockReturnValue({ charging: true, level: 50 });
      render(<DeviceStats />);
      expect(mockSetPowerState).toHaveBeenCalledWith(true);
      expect(mockSetThermalState).toHaveBeenCalledWith('LIGHT');
      expect(mockTrace).toHaveBeenCalledWith('device.lowPowerMode', true);
      expect(mockTrace).toHaveBeenCalledWith('device.thermalState', 'LIGHT');
      expect(mockTrace).toHaveBeenCalledWith('device.batteryState', {
        charging: true,
        level: 50,
      });
    });

    it('forwards native events and removes every subscription on unmount', () => {
      const power = captureEvent<boolean>(mockNative.onLowPowerModeChanged);
      const thermal = captureEvent<string>(mockNative.onThermalStateChanged);
      const charging = captureEvent<{ charging: boolean; level: number }>(
        mockNative.onChargingStateChanged,
      );
      const { unmount } = render(<DeviceStats />);

      power.emit(true);
      thermal.emit('SEVERE');
      charging.emit({ charging: false, level: 10 });
      expect(mockSetPowerState).toHaveBeenLastCalledWith(true);
      expect(mockSetThermalState).toHaveBeenLastCalledWith('SEVERE');
      expect(mockTrace).toHaveBeenCalledWith('device.chargingStateChanged', {
        charging: false,
        level: 10,
      });

      unmount();
      expect(power.remove).toHaveBeenCalledTimes(1);
      expect(thermal.remove).toHaveBeenCalledTimes(1);
      expect(charging.remove).toHaveBeenCalledTimes(1);
    });

    it('swallows errors thrown by the sync getters', () => {
      mockNative.isLowPowerModeEnabled.mockImplementation(() => {
        throw new Error('boom');
      });
      mockNative.currentThermalState.mockImplementation(() => {
        throw new Error('boom');
      });
      mockNative.getBatteryState.mockImplementation(() => {
        throw new Error('boom');
      });
      expect(() => render(<DeviceStats />)).not.toThrow();
      expect(mockNative.onLowPowerModeChanged).toHaveBeenCalledTimes(1);
    });

    it('starts and stops thermal updates on Android only', () => {
      Platform.OS = 'android';
      const { unmount } = render(<DeviceStats />);
      expect(mockNative.startThermalStatusUpdates).toHaveBeenCalledTimes(1);
      unmount();
      expect(mockNative.stopThermalStatusUpdates).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();
      Platform.OS = 'ios';
      render(<DeviceStats />).unmount();
      expect(mockNative.startThermalStatusUpdates).not.toHaveBeenCalled();
      expect(mockNative.stopThermalStatusUpdates).not.toHaveBeenCalled();
    });
  });

  describe('useIsIosScreenshareBroadcastStarted', () => {
    it('tracks the broadcast events and unsubscribes on unmount', () => {
      const screenShare = captureEvent<{ name: string }>(
        mockNative.onScreenShareEvent,
      );
      const { result, unmount } = renderHook(() =>
        useIsIosScreenshareBroadcastStarted(),
      );
      expect(result.current).toBe(false);
      act(() => screenShare.emit({ name: 'iOS_BroadcastStarted' }));
      expect(result.current).toBe(true);
      act(() => screenShare.emit({ name: 'iOS_BroadcastStopped' }));
      expect(result.current).toBe(false);
      unmount();
      expect(screenShare.remove).toHaveBeenCalledTimes(1);
    });

    it('does not subscribe on Android', () => {
      Platform.OS = 'android';
      renderHook(() => useIsIosScreenshareBroadcastStarted());
      expect(mockNative.onScreenShareEvent).not.toHaveBeenCalled();
    });
  });

  describe('getAndroidDefaultRingtoneUrl', () => {
    it('returns the url synchronously resolved by native', async () => {
      Platform.OS = 'android';
      mockNative.getDefaultRingtoneUrl.mockReturnValue('content://ringtone');
      await expect(getAndroidDefaultRingtoneUrl()).resolves.toBe(
        'content://ringtone',
      );
    });

    it('resolves undefined when native returns null or throws', async () => {
      Platform.OS = 'android';
      mockNative.getDefaultRingtoneUrl.mockReturnValue(null);
      await expect(getAndroidDefaultRingtoneUrl()).resolves.toBeUndefined();
      mockNative.getDefaultRingtoneUrl.mockImplementation(() => {
        throw new Error('boom');
      });
      await expect(getAndroidDefaultRingtoneUrl()).resolves.toBeUndefined();
    });

    it('does not call native on iOS', async () => {
      await expect(getAndroidDefaultRingtoneUrl()).resolves.toBeUndefined();
      expect(mockNative.getDefaultRingtoneUrl).not.toHaveBeenCalled();
    });
  });

  describe('StreamVideoRN hardware checks', () => {
    it('return plain booleans (not Promises) on Android', () => {
      Platform.OS = 'android';
      mockNative.hasAudioOutputHardware.mockReturnValue(true);
      mockNative.hasMicrophoneHardware.mockReturnValue(false);
      mockNative.hasCameraHardware.mockReturnValue(true);
      expect(StreamVideoRN.androidHasAudioOutputHardware()).toBe(true);
      expect(StreamVideoRN.androidHasMicrophoneHardware()).toBe(false);
      expect(StreamVideoRN.androidHasCameraHardware()).toBe(true);
    });

    it('throw on iOS', () => {
      expect(() => StreamVideoRN.androidHasCameraHardware()).toThrow();
    });

    it('keep the busy tone methods async', async () => {
      mockNative.playBusyTone.mockResolvedValue(true);
      mockNative.stopBusyTone.mockResolvedValue(true);
      await expect(StreamVideoRN.playBusyTone()).resolves.toBe(true);
      await expect(StreamVideoRN.stopBusyTone()).resolves.toBe(true);
    });
  });
});
