import 'react-native';
import type { Spec as BroadcastSpec } from './NativeBroadcast';

declare module 'react-native' {
  interface NativeModulesStatic {
    /**
     * Native Broadcast TurboModule, accessible via NativeModules.Broadcast.
     * For direct (and preferred) access, use TurboModuleRegistry through
     * the typed helper exported by this package (NativeBroadcast.ts).
     */
    Broadcast: BroadcastSpec;
  }
}
