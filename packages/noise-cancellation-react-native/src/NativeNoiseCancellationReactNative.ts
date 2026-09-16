import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  isEnabled(): Promise<boolean>;
  setEnabled(enabled: boolean): Promise<boolean>;
  deviceSupportsAdvancedAudioProcessing(): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NoiseCancellationReactNative',
);
