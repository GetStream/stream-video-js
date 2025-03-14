import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import {
  CallingState,
  setPowerState,
  setThermalState,
} from '@stream-io/video-client';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const eventEmitter = NativeModules?.StreamVideoReactNative
  ? new NativeEventEmitter(NativeModules?.StreamVideoReactNative)
  : undefined;

/**
 * This is a renderless component to get the device stats like thermal state and power saver mode.
 */
export const DeviceStats = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  useEffect(() => {
    if (callingState !== CallingState.JOINED) {
      return;
    }

    NativeModules?.StreamVideoReactNative.isLowPowerModeEnabled().then(
      (initialPowerMode: boolean) => setPowerState(initialPowerMode),
    );

    const powerModeSubscription = eventEmitter?.addListener(
      'isLowPowerModeEnabled',
      (isLowPowerMode: boolean) => setPowerState(isLowPowerMode),
    );

    NativeModules?.StreamVideoReactNative.currentThermalState().then(
      (initialState: string) => setThermalState(initialState),
    );

    const thermalStateSubscription = eventEmitter?.addListener(
      'thermalStateDidChange',
      (thermalState: string) => setThermalState(thermalState),
    );

    // on android we need to explicitly start and stop the thermal status updates
    if (Platform.OS === 'android') {
      NativeModules?.StreamVideoReactNative.startThermalStatusUpdates();
    }

    return () => {
      powerModeSubscription?.remove();
      thermalStateSubscription?.remove();
      if (Platform.OS === 'android') {
        NativeModules?.StreamVideoReactNative.stopThermalStatusUpdates();
      }
    };
  }, [callingState]);

  return null;
};
