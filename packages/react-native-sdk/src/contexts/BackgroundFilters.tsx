import React, {
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MediaStream } from '@stream-io/react-native-webrtc';
import { useCall } from '@stream-io/video-react-bindings';
import { Image, Platform } from 'react-native';
import {
  BackgroundFiltersContext,
  type BlurIntensity,
  type CurrentBackgroundFilter,
  type ImageSourceType,
} from './internal/BackgroundFiltersContext';

// for maintaining backwards compatibility
export type {
  BlurIntensity,
  CurrentBackgroundFilter,
  BackgroundFiltersAPI,
} from './internal/BackgroundFiltersContext';

type VideoFiltersModuleType =
  typeof import('@stream-io/video-filters-react-native');

let videoFiltersModule: VideoFiltersModuleType | undefined;

try {
  videoFiltersModule = require('@stream-io/video-filters-react-native');
} catch {}

const isSupported = (function () {
  if (!videoFiltersModule) return false;
  if (Platform.OS === 'ios') {
    // only supported on ios 15 and above
    const currentVersion = parseInt(Platform.Version, 10);
    return currentVersion >= 15;
  }
  return Platform.OS === 'android';
})();

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
  // Native filter name for reapply on track replacement (camera flip,
  // enable-after-disable). State alone can't distinguish `BackgroundBlur*`
  // from `Blur*` — both hold `{ blur: intensity }`.
  //
  // Also used as a staleness signal: apply sets it before awaiting and bails
  // if a later apply/disable changed it.
  const lastAppliedFilterNameRef = useRef<string | null>(null);

  const [currentBackgroundFilter, setCurrentBackgroundFilter] =
    useState<CurrentBackgroundFilter>();

  const applyBackgroundBlurFilter = useCallback(
    async (blurIntensity: BlurIntensity) => {
      if (!isSupported) {
        return;
      }
      let filterName = 'BackgroundBlurMedium';
      if (blurIntensity === 'heavy') {
        filterName = 'BackgroundBlurHeavy';
      } else if (blurIntensity === 'light') {
        filterName = 'BackgroundBlurLight';
      }
      // Mark intent before awaiting so a later apply/disable can invalidate us.
      lastAppliedFilterNameRef.current = filterName;
      if (!isBackgroundBlurRegisteredRef.current) {
        await videoFiltersModule?.registerBackgroundBlurVideoFilters();
        if (lastAppliedFilterNameRef.current !== filterName) return;
        isBackgroundBlurRegisteredRef.current = true;
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
      let filterName = 'BlurMedium';
      if (blurIntensity === 'heavy') {
        filterName = 'BlurHeavy';
      } else if (blurIntensity === 'light') {
        filterName = 'BlurLight';
      }
      lastAppliedFilterNameRef.current = filterName;
      if (!isVideoBlurRegisteredRef.current) {
        await videoFiltersModule?.registerBlurVideoFilters();
        if (lastAppliedFilterNameRef.current !== filterName) return;
        isVideoBlurRegisteredRef.current = true;
      }
      call?.tracer.trace('videoFilters.apply', filterName);
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
      const source = Image.resolveAssetSource(imageSource);
      const imageUri = source.uri;
      const filterName = `VirtualBackground-${imageUri}`;
      lastAppliedFilterNameRef.current = filterName;
      const registeredImageFiltersSet = registeredImageFiltersSetRef.current;
      if (!registeredImageFiltersSet.has(imageUri)) {
        await videoFiltersModule?.registerVirtualBackgroundFilter(imageSource);
        if (lastAppliedFilterNameRef.current !== filterName) return;
        registeredImageFiltersSetRef.current.add(imageUri);
      }
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
    // Clearing the ref invalidates any in-flight apply — its stale check will bail.
    lastAppliedFilterNameRef.current = null;
    (call?.camera.state.mediaStream as MediaStream | undefined)
      ?.getVideoTracks()
      .forEach((track) => {
        track._setVideoEffect(null);
      });
    setCurrentBackgroundFilter(undefined);
  }, [call]);

  // Reapplies the filter on track replacement (flip, enable-after-disable).
  // Releases native filter state on unmount / call change.
  useEffect(() => {
    if (!call || !isSupported) return;
    const registeredImageFiltersSet = registeredImageFiltersSetRef.current;
    const subscription = call.camera.state.mediaStream$.subscribe(() => {
      const name = lastAppliedFilterNameRef.current;
      if (!name) return;
      (call.camera.state.mediaStream as MediaStream | undefined)
        ?.getVideoTracks()
        .forEach((track) => {
          track._setVideoEffect(name);
        });
    });
    return () => {
      subscription.unsubscribe();
      (call.camera.state.mediaStream as MediaStream | undefined)
        ?.getVideoTracks()
        .forEach((track) => {
          track._setVideoEffect(null);
        });
      lastAppliedFilterNameRef.current = null;
      isBackgroundBlurRegisteredRef.current = false;
      isVideoBlurRegisteredRef.current = false;
      registeredImageFiltersSet.clear();
    };
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
