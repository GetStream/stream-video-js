import { Image, NativeModules, Platform } from 'react-native';

const resolveAssetSourceFunc = Image.resolveAssetSource;

// excluding array of images and only allow one image
type ImageSourceType = Exclude<
  Parameters<typeof resolveAssetSourceFunc>[0],
  Array<any>
>;

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
      },
    );

/**
 * Registers the background blur video filters.
 * The name of the background filters are 'BackgroundBlurLight', 'BackgroundBlurMedium' and 'BackgroundBlurHeavy'.
 */
export async function registerBackgroundBlurVideoFilters(): Promise<boolean> {
  return await VideoFiltersReactNative.registerBackgroundBlurVideoFilters();
}

/**
 * Registers a virtual background filter with the given image.
 * Note: it uses Image.resolveAssetSource to resolve the URI of the given image source.
 *
 * @param imageSource Source of the image to use as the background. It can be either remote or local image
 * @returns the URI of the image that was registered as the virtual background
 */
export async function registerVirtualBackgroundFilter(
  imageSource: ImageSourceType,
): Promise<string> {
  const source = resolveAssetSourceFunc(imageSource);
  const imageUri = source.uri;
  await VideoFiltersReactNative.registerVirtualBackgroundFilter(imageUri);
  return imageUri;
}
