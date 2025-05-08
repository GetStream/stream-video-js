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

export default NoiseCancellationReactNative;
