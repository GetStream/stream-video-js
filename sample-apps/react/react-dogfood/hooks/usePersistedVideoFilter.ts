import { useEffect } from 'react';
import { useBackgroundFilters } from '@stream-io/video-react-sdk';
import {
  BackgroundBlurLevel,
  BackgroundFilter,
} from '@stream-io/video-filters-web';
import { useSettings, SegmentationModel } from '../context/SettingsContext';

const SEGMENTATION_MODEL_URLS: Record<SegmentationModel, string> = {
  selfie_segmenter_landscape:
    'https://unpkg.com/@stream-io/video-filters-web@latest/mediapipe/models/selfie_segmenter_landscape.tflite',
  selfie_multiclass_256x256:
    'https://unpkg.com/@stream-io/video-filters-web@latest/mediapipe/models/selfie_multiclass_256x256.tflite',
  selfie_segmenter:
    'https://unpkg.com/@stream-io/video-filters-web@latest/mediapipe/models/selfie_segmenter.tflite',
};

export const getSegmentationModelUrl = (model: SegmentationModel) =>
  SEGMENTATION_MODEL_URLS[model];

type PersistedVideoFilter = {
  backgroundFilter: BackgroundFilter | null;
  backgroundImage: string | null;
  backgroundBlurLevel: BackgroundBlurLevel;
  segmentationModel?: SegmentationModel;
};

const loadVideoFilter = (storageKey: string): PersistedVideoFilter | null => {
  try {
    return JSON.parse(localStorage.getItem(storageKey)!);
  } catch (e) {
    console.error('Failed to load video filter', e);
  }
  return null;
};

const storeVideoFilter = (storageKey: string, filter: PersistedVideoFilter) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(filter));
  } catch (e) {
    console.error('Failed to store video filter', e);
  }
};

export const usePersistedVideoFilter = (storageKey: string) => {
  const {
    isReady,
    backgroundFilter,
    backgroundImage,
    backgroundBlurLevel,
    disableBackgroundFilter,
    applyBackgroundBlurFilter,
    applyBackgroundImageFilter,
  } = useBackgroundFilters();

  const {
    settings: { segmentationModel, setSegmentationModel },
  } = useSettings();

  useEffect(() => {
    const filter = loadVideoFilter(storageKey);
    if (!filter || !isReady) return;

    if (filter.backgroundFilter === 'blur') {
      applyBackgroundBlurFilter(filter.backgroundBlurLevel);
    } else if (filter.backgroundFilter === 'image' && filter.backgroundImage) {
      applyBackgroundImageFilter(filter.backgroundImage);
    } else {
      disableBackgroundFilter();
    }
  }, [
    applyBackgroundBlurFilter,
    applyBackgroundImageFilter,
    disableBackgroundFilter,
    setSegmentationModel,
    isReady,
    storageKey,
  ]);

  useEffect(() => {
    if (!isReady) return;
    storeVideoFilter(storageKey, {
      backgroundFilter: backgroundFilter ?? null,
      backgroundImage: backgroundImage ?? null,
      backgroundBlurLevel: backgroundBlurLevel ?? 'high',
      segmentationModel,
    });
  }, [
    backgroundBlurLevel,
    backgroundFilter,
    backgroundImage,
    segmentationModel,
    isReady,
    storageKey,
  ]);
};
