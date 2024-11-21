import { NativeModules, NativeEventEmitter } from 'react-native';

const { PowerModeModule } = NativeModules;
const powerModeEmitter = new NativeEventEmitter(PowerModeModule);

// TODO: remove if this is not needed
export const checkLowPowerMode = (): Promise<boolean> => {
  return PowerModeModule.isLowPowerModeEnabled();
};

export const addPowerModeListener = (
  callback: (isLowPowerMode: boolean) => void,
) => {
  return powerModeEmitter.addListener(
    PowerModeModule.POWER_MODE_EVENT,
    callback,
  );
};
