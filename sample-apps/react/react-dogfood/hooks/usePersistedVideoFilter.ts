import { useEffect } from 'react';
import { useBackgroundFilters } from '@stream-io/video-react-sdk';
import {
  BackgroundBlurLevel,
  BackgroundFilter,
} from '@stream-io/video-filters-web';

type PersistedVideoFilter = {
  backgroundFilter: BackgroundFilter | null;
  backgroundImage: string | null;
  backgroundBlurLevel: BackgroundBlurLevel;
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
    isReady,
    storageKey,
  ]);

  useEffect(() => {
    if (!isReady) return;
    storeVideoFilter(storageKey, {
      backgroundFilter: backgroundFilter ?? null,
      backgroundImage: backgroundImage ?? null,
      backgroundBlurLevel: backgroundBlurLevel ?? 'high',
    });
  }, [
    backgroundBlurLevel,
    backgroundFilter,
    backgroundImage,
    isReady,
    storageKey,
  ]);
};
