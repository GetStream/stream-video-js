import { type TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  start: (endpoint: string, streamName: string) => Promise<void>;
  stop: () => Promise<void>;

  setCameraDirection: (direction: string) => void;
  setCameraEnabled: (enabled: boolean) => void;
  setMicrophoneEnabled: (enabled: boolean) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Broadcast');
