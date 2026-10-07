import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  registerBackgroundBlurVideoFilters(): boolean;
  registerVirtualBackgroundFilter(backgroundImageUrlString: string): boolean;
  registerBlurVideoFilters(): boolean;
  unregisterAllFilters(): boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'VideoFiltersReactNative',
);
