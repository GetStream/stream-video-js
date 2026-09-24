import { Image } from 'react-native';
import VideoFiltersReactNative from './NativeVideoFiltersReactNative';

const resolveAssetSourceFunc = Image.resolveAssetSource;

// excluding array of images and only allow one image
type ImageSourceType = Exclude<
  Parameters<typeof resolveAssetSourceFunc>[0],
  Array<any>
>;

/**
 * Registers the background blur video filters.
 * The name of the background filters are 'BackgroundBlurLight', 'BackgroundBlurMedium' and 'BackgroundBlurHeavy'.
 * Runs synchronously; throws if the native registration fails.
 */
export function registerBackgroundBlurVideoFilters(): boolean {
  return VideoFiltersReactNative.registerBackgroundBlurVideoFilters();
}

/**
 * Registers a virtual background filter with the given image.
 * Note: it uses Image.resolveAssetSource to resolve the URI of the given image source.
 * Runs synchronously; throws if the native registration fails.
 *
 * @param imageSource Source of the image to use as the background. It can be either remote or local image
 * @returns the URI of the image that was registered as the virtual background
 */
export function registerVirtualBackgroundFilter(
  imageSource: ImageSourceType,
): string {
  const source = resolveAssetSourceFunc(imageSource);
  const imageUri = source.uri;
  VideoFiltersReactNative.registerVirtualBackgroundFilter(imageUri);
  return imageUri;
}

/**
 * Registers the blur video filters.
 * The name of the blur filters are 'BlurLight', 'BlurMedium' and 'BlurHeavy'.
 * Runs synchronously; throws if the native registration fails.
 */
export function registerBlurVideoFilters(): boolean {
  return VideoFiltersReactNative.registerBlurVideoFilters();
}

/**
 * Unregisters all filters that were previously registered via this module,
 * allowing the native processor instances to be released. Safe to call even
 * if no filters were registered.
 * Runs synchronously; throws if the native unregistration fails.
 */
export function unregisterAllFilters(): boolean {
  return VideoFiltersReactNative.unregisterAllFilters();
}
