import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package '@stream-io/noise-cancellation-react-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const NoiseCancellationReactNative = NativeModules.NoiseCancellationReactNative
  ? NativeModules.NoiseCancellationReactNative
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      },
    );
/**
 * Registers the noise cancellation processor.
 * This must be called before using any other methods.
 * @returns A promise that resolves when the processor is registered.
 */
export const registerProcessor = (): Promise<boolean> => {
  return NoiseCancellationReactNative.registerProcessor();
};

/**
 * Checks if noise cancellation is currently enabled.
 * @returns A promise that resolves with a boolean indicating if noise cancellation is enabled.
 */
export const isEnabled = (): Promise<boolean> => {
  return NoiseCancellationReactNative.isEnabled();
};

/**
 * Enables or disables noise cancellation.
 * @param enabled - Whether to enable or disable noise cancellation.
 * @returns A promise that resolves when the operation is complete.
 */
export const setEnabled = (enabled: boolean): Promise<boolean> => {
  return NoiseCancellationReactNative.setEnabled(enabled);
};

/**
 * Checks if the device supports advanced audio processing required for noise cancellation.
 * @returns A promise that resolves with a boolean indicating if the device supports advanced audio processing.
 */
export const deviceSupportsAdvancedAudioProcessing = (): Promise<boolean> => {
  return NoiseCancellationReactNative.deviceSupportsAdvancedAudioProcessing();
};

export default NoiseCancellationReactNative;
