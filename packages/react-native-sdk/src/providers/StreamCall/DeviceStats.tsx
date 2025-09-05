import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import {
  CallingState,
  setPowerState,
  setThermalState,
} from '@stream-io/video-client';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const { StreamVideoReactNative } = NativeModules;
const eventEmitter = new NativeEventEmitter(StreamVideoReactNative);
/**
 * This is a renderless component to get the device stats like thermal state and power saver mode.
 */
export const DeviceStats = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const call = useCall();

  useEffect(() => {
    if (!call || callingState !== CallingState.JOINED) return;

    StreamVideoReactNative.isLowPowerModeEnabled().then(
      (initialPowerMode: boolean) => {
        setPowerState(initialPowerMode);
        call.tracer.trace('device.lowPowerMode', initialPowerMode);
      },
    );

    const powerModeSubscription = eventEmitter.addListener(
      'isLowPowerModeEnabled',
      (isLowPowerMode: boolean) => {
        setPowerState(isLowPowerMode);
        call.tracer.trace('device.lowPowerMode', isLowPowerMode);
      },
    );

    StreamVideoReactNative.currentThermalState().then(
      (initialState: string) => {
        setThermalState(initialState);
        call.tracer.trace('device.thermalState', initialState);
      },
    );

    const thermalStateSubscription = eventEmitter.addListener(
      'thermalStateDidChange',
      (thermalState: string) => {
        setThermalState(thermalState);
        call.tracer.trace('device.thermalStateChanged', thermalState);
      },
    );

    const pollBatteryState = () => {
      StreamVideoReactNative.getBatteryState().then(
        (data: { charging: boolean; level: number }) => {
          call.tracer.trace('device.batteryState', data);
        },
      );
    };

    // poll every 3 minutes, so we can calculate potential battery drain
    const batteryLevelId = setInterval(() => pollBatteryState(), 3 * 60 * 1000);
    pollBatteryState(); // initial call

    const batteryChargingSubscription = eventEmitter.addListener(
      'chargingStateChanged',
      (data: { charging: boolean; level: number }) => {
        call.tracer.trace('device.chargingStateChanged', data);
      },
    );

    // on android we need to explicitly start and stop the thermal status updates
    if (Platform.OS === 'android') {
      StreamVideoReactNative.startThermalStatusUpdates();
    }

    return () => {
      powerModeSubscription.remove();
      thermalStateSubscription.remove();
      batteryChargingSubscription.remove();
      clearInterval(batteryLevelId);
      if (Platform.OS === 'android') {
        StreamVideoReactNative.stopThermalStatusUpdates();
      }
    };
  }, [call, callingState]);

  return null;
};
