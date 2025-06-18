import {
  useBackgroundFilters,
  useCall,
} from '@stream-io/video-react-native-sdk';
import { useRef, useCallback, useState } from 'react';

import { MediaStream } from '@stream-io/react-native-webrtc';

import { Platform } from 'react-native';
import VideoEffectsModule from '../../modules/video-effects';

const isSupported = Platform.OS === 'android' || Platform.OS === 'ios';

type CustomFilters = 'GrayScale' | 'FaceBoxDetector';

export const useCustomVideoFilters = () => {
  const call = useCall();
  const isFiltersRegisteredRef = useRef(false);
  const { disableAllFilters } = useBackgroundFilters();
  const [currentCustomFilter, setCustomFilter] = useState<CustomFilters>();

  const applyGrayScaleFilter = useCallback(async () => {
    if (!isSupported) {
      return;
    }
    if (!isFiltersRegisteredRef.current) {
      VideoEffectsModule.registerVideoFilters();
      isFiltersRegisteredRef.current = true;
    }
    disableAllFilters();
    (call?.camera.state.mediaStream as MediaStream | undefined)
      ?.getVideoTracks()
      .forEach((track) => {
        track._setVideoEffect('grayscale');
      });
    setCustomFilter('GrayScale');
  }, [call, disableAllFilters]);

  const applyFaceBoxDetectorFilter = useCallback(async () => {
    if (!isSupported) {
      return;
    }
    if (!isFiltersRegisteredRef.current) {
      VideoEffectsModule.registerVideoFilters();
      isFiltersRegisteredRef.current = true;
    }
    disableAllFilters();
    (call?.camera.state.mediaStream as MediaStream | undefined)
      ?.getVideoTracks()
      .forEach((track) => {
        track._setVideoEffect('faceboxdetector');
      });
    setCustomFilter('FaceBoxDetector');
  }, [call, disableAllFilters]);

  const disableCustomFilter = useCallback(() => {
    disableAllFilters();
    setCustomFilter(undefined);
  }, [disableAllFilters]);

  return {
    currentCustomFilter,
    applyGrayScaleFilter,
    applyFaceBoxDetectorFilter,
    disableCustomFilter,
  };
};
