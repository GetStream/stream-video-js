import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package '@stream-io/video-filters-react-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const VideoFiltersReactNative = NativeModules.VideoFiltersReactNative
  ? NativeModules.VideoFiltersReactNative
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export async function registerBackgroundBlurVideoFilters(): Promise<boolean> {
  return await VideoFiltersReactNative.registerBackgroundBlurVideoFilters();
}

export async function registerVirtualBackgroundFilter(
  imageUri: string
): Promise<boolean> {
  return await VideoFiltersReactNative.registerVirtualBackgroundFilter(
    imageUri
  );
}
