import { NativeModule, requireNativeModule } from 'expo';

declare class VideoEffectsModule extends NativeModule {
  registerVideoFilters(): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<VideoEffectsModule>('VideoEffects');
