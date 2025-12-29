import { createContext } from 'react';
import { type ImageSourcePropType } from 'react-native';

// excluding array of images and only allow one image
export type ImageSourceType = Exclude<ImageSourcePropType, Array<any>>;

export type BlurIntensity = 'light' | 'medium' | 'heavy';

export type CurrentBackgroundFilter = {
  blur?: BlurIntensity;
  image?: ImageSourceType;
};

export type BackgroundFiltersAPI = {
  /**
   * The currently applied background filter. Undefined value indicates that no filter is applied.
   */
  currentBackgroundFilter: CurrentBackgroundFilter | undefined;
  /**
   * Whether the current device supports the background filters.
   */
  isSupported: boolean;
  /**
   * Applies a background image filter to the video.
   *
   * @param imageSource the URL of the image to use as the background.
   */
  applyBackgroundImageFilter: (imageSource: ImageSourceType) => void;
  /**
   * Applies a background blur filter to the video.
   *
   * @param blurLevel the level of blur to apply to the background.
   */
  applyBackgroundBlurFilter: (blurIntensity: BlurIntensity) => void;
  /**
   * Applies a video blur filter to the video.
   *
   * @param blurIntensity the level of blur to apply to the video.
   */
  applyVideoBlurFilter: (blurIntensity: BlurIntensity) => void;
  /**
   * Disables all filters applied to the video.
   */
  disableAllFilters: () => void;
};

/**
 * The context for the background filters.
 */
export const BackgroundFiltersContext = createContext<
  BackgroundFiltersAPI | undefined
>(undefined);
