import React, {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MediaStream } from '@stream-io/react-native-webrtc';
import { useCall } from '@stream-io/video-react-bindings';
import { Image, Platform } from 'react-native';

const isSupported = (function () {
  if (Platform.OS === 'ios') {
    // only supported on ios 15 and above
    const currentVersion = parseInt(Platform.Version, 10);
    return currentVersion >= 15;
  }
  return Platform.OS === 'android';
})();

type VideoFiltersModuleType =
  typeof import('@stream-io/video-filters-react-native');

let videoFiltersModule: VideoFiltersModuleType | undefined;

try {
  videoFiltersModule = require('@stream-io/video-filters-react-native');
} catch {}

const resolveAssetSourceFunc = Image.resolveAssetSource;

// excluding array of images and only allow one image
type ImageSourceType = Exclude<
  Parameters<typeof resolveAssetSourceFunc>[0],
  Array<any>
>;

export type BlurIntensity = 'light' | 'medium' | 'heavy';

export type BackgroundFilterType = 'blur' | 'image';

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
const BackgroundFiltersContext = createContext<
  BackgroundFiltersAPI | undefined
>(undefined);

/**
 * A hook to access the background filters context API.
 */
export const useBackgroundFilters = () => {
  const context = useContext(BackgroundFiltersContext);
  if (!context) {
    throw new Error(
      'useBackgroundFilters must be used within a BackgroundFiltersProvider',
    );
  }
  if (!videoFiltersModule) {
    throw new Error(
      "Install the '@stream-io/video-filters-react-native' library to use background filters",
    );
  }
  return context;
};

/**
 * A provider component that enables the use of background filters in your app.
 *
 * Please make sure you have the `@stream-io/video-filters-react-native` package installed
 * in your project before using this component.
 */
export const BackgroundFiltersProvider = ({ children }: PropsWithChildren) => {
  if (!videoFiltersModule) {
    throw new Error(
      "Install the '@stream-io/video-filters-react-native' library to use background filters",
    );
  }
  const call = useCall();
  const isBackgroundBlurRegisteredRef = useRef(false);
  const isVideoBlurRegisteredRef = useRef(false);
  const registeredImageFiltersSetRef = useRef(new Set<string>());

  const [currentBackgroundFilter, setCurrentBackgroundFilter] =
    useState<CurrentBackgroundFilter>();

  const applyBackgroundBlurFilter = useCallback(
    async (blurIntensity: BlurIntensity) => {
      if (!isSupported) {
        return;
      }
      if (!isBackgroundBlurRegisteredRef.current) {
        await videoFiltersModule?.registerBackgroundBlurVideoFilters();
        isBackgroundBlurRegisteredRef.current = true;
      }
      let filterName = 'BackgroundBlurMedium';
      if (blurIntensity === 'heavy') {
        filterName = 'BackgroundBlurHeavy';
      } else if (blurIntensity === 'light') {
        filterName = 'BackgroundBlurLight';
      }
      call?.tracer.trace('backgroundFilters.apply', filterName);
      (call?.camera.state.mediaStream as MediaStream | undefined)
        ?.getVideoTracks()
        .forEach((track) => {
          track._setVideoEffect(filterName);
        });
      setCurrentBackgroundFilter({ blur: blurIntensity });
    },
    [call],
  );

  const applyVideoBlurFilter = useCallback(
    async (blurIntensity: BlurIntensity) => {
      if (!isSupported) {
        return;
      }
      if (!isVideoBlurRegisteredRef.current) {
        await videoFiltersModule?.registerBlurVideoFilters();
        isVideoBlurRegisteredRef.current = true;
      }
      let filterName = 'BlurMedium';
      if (blurIntensity === 'heavy') {
        filterName = 'BlurHeavy';
      } else if (blurIntensity === 'light') {
        filterName = 'BlurLight';
      }
      call?.tracer.trace('backgroundFilters.apply', filterName);
      (call?.camera.state.mediaStream as MediaStream | undefined)
        ?.getVideoTracks()
        .forEach((track) => {
          track._setVideoEffect(filterName);
        });
      setCurrentBackgroundFilter({ blur: blurIntensity });
    },
    [call],
  );

  const applyBackgroundImageFilter = useCallback(
    async (imageSource: ImageSourceType) => {
      if (!isSupported) {
        return;
      }
      const source = resolveAssetSourceFunc(imageSource);
      const imageUri = source.uri;
      const registeredImageFiltersSet = registeredImageFiltersSetRef.current;
      if (!registeredImageFiltersSet.has(imageUri)) {
        await videoFiltersModule?.registerVirtualBackgroundFilter(imageSource);
        registeredImageFiltersSetRef.current.add(imageUri);
      }
      const filterName = `VirtualBackground-${imageUri}`;
      call?.tracer.trace('backgroundFilters.apply', filterName);
      (call?.camera.state.mediaStream as MediaStream | undefined)
        ?.getVideoTracks()
        .forEach((track) => {
          track._setVideoEffect(filterName);
        });
      setCurrentBackgroundFilter({ image: imageSource });
    },
    [call],
  );

  const disableAllFilters = useCallback(() => {
    if (!isSupported) {
      return;
    }
    call?.tracer.trace('backgroundFilters.disableAll', null);
    (call?.camera.state.mediaStream as MediaStream | undefined)
      ?.getVideoTracks()
      .forEach((track) => {
        track._setVideoEffect(null);
      });
    setCurrentBackgroundFilter(undefined);
  }, [call]);

  const value = useMemo(
    () => ({
      currentBackgroundFilter,
      isSupported,
      applyBackgroundImageFilter,
      applyBackgroundBlurFilter,
      applyVideoBlurFilter,
      disableAllFilters,
    }),
    [
      applyBackgroundBlurFilter,
      applyBackgroundImageFilter,
      applyVideoBlurFilter,
      currentBackgroundFilter,
      disableAllFilters,
    ],
  );

  return (
    <BackgroundFiltersContext.Provider value={value}>
      {children}
    </BackgroundFiltersContext.Provider>
  );
};
