import { Platform, TurboModuleRegistry, type TurboModule } from 'react-native';

import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  getCurrentAppState(): string;

  readonly onAppStateChanged: EventEmitter<string>;
}

// Android-only: there is no iOS implementation of this module.
export default Platform.OS === 'android'
  ? TurboModuleRegistry.get<Spec>('StreamVideoAppLifecycle')
  : null;
