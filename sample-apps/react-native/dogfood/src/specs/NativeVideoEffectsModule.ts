import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  registerVideoFilters(): boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>('VideoEffectsModule');
