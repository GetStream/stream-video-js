import { NativeEventEmitter, NativeModules } from 'react-native';

export type ThermalState =
  | 'unknown'
  | 'nominal'
  | 'fair'
  | 'serious'
  | 'critical';

const { ThermalStateModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(ThermalStateModule);

export class ThermalStateManager {
  static getCurrentState(): Promise<{ state: ThermalState }> {
    return Promise.resolve({ state: 'nominal' });
  }

  static addListener(callback: (response: { state: ThermalState }) => void) {
    return eventEmitter.addListener('ThermalStateChange', callback);
  }
}
