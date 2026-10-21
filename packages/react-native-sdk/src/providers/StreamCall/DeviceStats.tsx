import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import {
  CallingState,
  setPowerState,
  setThermalState,
  videoLoggerSystem,
} from '@stream-io/video-client';
import { Platform } from 'react-native';
import NativeStreamVideoReactNative from '../../native/NativeStreamVideoReactNative';

/**
 * This is a renderless component to get the device stats like thermal state and power saver mode.
 */
export const DeviceStats = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const call = useCall();

  useEffect(() => {
    if (!call || callingState !== CallingState.JOINED) return;

    const logger = videoLoggerSystem.getLogger('DeviceStats');

    try {
      const initialPowerMode =
        NativeStreamVideoReactNative.isLowPowerModeEnabled();
      setPowerState(initialPowerMode);
      call.tracer.trace('device.lowPowerMode', initialPowerMode);
    } catch (e) {
      logger.warn('Failed to get the low power mode', e);
    }

    const powerModeSubscription =
      NativeStreamVideoReactNative.onLowPowerModeChanged(
        (isLowPowerMode: boolean) => {
          setPowerState(isLowPowerMode);
          call.tracer.trace('device.lowPowerMode', isLowPowerMode);
        },
      );

    try {
      const initialState = NativeStreamVideoReactNative.currentThermalState();
      setThermalState(initialState);
      call.tracer.trace('device.thermalState', initialState);
    } catch (e) {
      logger.warn('Failed to get the thermal state', e);
    }

    const thermalStateSubscription =
      NativeStreamVideoReactNative.onThermalStateChanged(
        (thermalState: string) => {
          setThermalState(thermalState);
          call.tracer.trace('device.thermalStateChanged', thermalState);
        },
      );

    const pollBatteryState = () => {
      try {
        const data = NativeStreamVideoReactNative.getBatteryState();
        call.tracer.trace('device.batteryState', data);
      } catch (e) {
        logger.warn('Failed to get the battery state', e);
      }
    };

    // poll every 3 minutes, so we can calculate potential battery drain
    const batteryLevelId = setInterval(() => pollBatteryState(), 3 * 60 * 1000);
    pollBatteryState(); // initial call

    const batteryChargingSubscription =
      NativeStreamVideoReactNative.onChargingStateChanged(
        (data: { charging: boolean; level: number }) => {
          call.tracer.trace('device.chargingStateChanged', data);
        },
      );

    // on android we need to explicitly start and stop the thermal status updates
    if (Platform.OS === 'android') {
      NativeStreamVideoReactNative.startThermalStatusUpdates();
    }

    return () => {
      powerModeSubscription.remove();
      thermalStateSubscription.remove();
      batteryChargingSubscription.remove();
      clearInterval(batteryLevelId);
      if (Platform.OS === 'android') {
        NativeStreamVideoReactNative.stopThermalStatusUpdates();
      }
    };
  }, [call, callingState]);

  return null;
};
