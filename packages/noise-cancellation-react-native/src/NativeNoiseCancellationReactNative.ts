import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  isEnabled(): boolean;
  setEnabled(enabled: boolean): boolean;
  deviceSupportsAdvancedAudioProcessing(): boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NoiseCancellationReactNative',
);
