import {
  useBackgroundFilters,
  useCall,
} from '@stream-io/video-react-native-sdk';
import { useRef, useCallback, useState } from 'react';

import { MediaStream } from '@stream-io/react-native-webrtc';

import { NativeModules, Platform } from 'react-native';

const VideoEffectsModule = NativeModules.VideoEffectsModule;

const isSupported = Platform.OS === 'android' || Platform.OS === 'ios';

type CustomFilters = 'GrayScale';

export const useCustomVideoFilters = () => {
  const call = useCall();
  const isGrayScaleRegisteredRef = useRef(false);
  const { disableAllFilters } = useBackgroundFilters();
  const [currentCustomFilter, setCustomFilter] = useState<CustomFilters>();

  const applyGrayScaleFilter = useCallback(async () => {
    if (!isSupported) {
      return;
    }
    if (!isGrayScaleRegisteredRef.current) {
      await VideoEffectsModule?.registerVideoFilters();
      isGrayScaleRegisteredRef.current = true;
    }
    disableAllFilters();
    (call?.camera.state.mediaStream as MediaStream | undefined)
      ?.getVideoTracks()
      .forEach((track) => {
        track._setVideoEffect('grayscale');
      });
    setCustomFilter('GrayScale');
  }, [call, disableAllFilters]);

  const disableCustomFilter = useCallback(() => {
    disableAllFilters();
    setCustomFilter(undefined);
  }, [disableAllFilters]);

  return {
    currentCustomFilter,
    applyGrayScaleFilter,
    disableCustomFilter,
  };
};
