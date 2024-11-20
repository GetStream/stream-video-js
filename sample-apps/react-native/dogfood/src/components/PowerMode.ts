import { NativeModules } from 'react-native';

const { PowerModeModule } = NativeModules;

export const checkLowPowerMode = (): Promise<boolean> => {
  return PowerModeModule.isLowPowerModeEnabled();
};
