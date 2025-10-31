import { type TurboModule, TurboModuleRegistry } from 'react-native';

export type Preset = {
  width: number;
  height: number;
  frameRate: number;
  videoBitrate: number;
  audioBitrate: number;
};

export interface Spec extends TurboModule {
  // Synchronous creation with preset
  createInstance: (preset: Preset) => string;

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
