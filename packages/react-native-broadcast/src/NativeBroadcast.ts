import { type TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Synchronous creation
  createInstance: () => string;

  destroyInstance: (instanceId: string) => void;

  start: (
    instanceId: string,
    endpoint: string,
    streamName: string,
  ) => Promise<void>;
  stop: (instanceId: string) => Promise<void>;

  setCameraDirection: (instanceId: string, direction: string) => void;
  setCameraEnabled: (instanceId: string, enabled: boolean) => void;
  setMicrophoneEnabled: (instanceId: string, enabled: boolean) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Broadcast');
