import { useCallback, useEffect, useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';

import { useConfiguration } from '../context/ConfigurationContext';
import { LayoutKey, DEFAULT_LAYOUT, isLayoutKey } from '../layouts/LayoutMap';

const SETTINGS_KEY = '@stream-embedded/layout-settings';

export const getLayoutSettings = () => {
  if (typeof window === 'undefined') return;
  const settings = window.localStorage.getItem(SETTINGS_KEY);
  if (settings) {
    try {
      return JSON.parse(settings) as { selectedLayout: LayoutKey };
    } catch (e) {
      console.log('Error parsing layout settings', e);
    }
  }
};

export const useLayoutSwitcher = () => {
  const { layout: layoutOverride } = useConfiguration();

  const [layout, setLayout] = useState<LayoutKey>(() => {
    const layoutToUse =
      layoutOverride || getLayoutSettings()?.selectedLayout || DEFAULT_LAYOUT;
    return isLayoutKey(layoutToUse) ? layoutToUse : DEFAULT_LAYOUT;
  });

  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();

  useEffect(() => {
    if (hasScreenShare) {
      return setLayout((currentLayout) => {
        if (currentLayout.startsWith('Speaker')) return currentLayout;
        return 'SpeakerRight';
      });
    }

    const storedLayout =
      layoutOverride ?? getLayoutSettings()?.selectedLayout ?? DEFAULT_LAYOUT;
    setLayout(isLayoutKey(storedLayout) ? storedLayout : DEFAULT_LAYOUT);
  }, [hasScreenShare, layoutOverride]);

  const switchLayout = useCallback((newLayout: LayoutKey) => {
    setLayout(newLayout);
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ selectedLayout: newLayout }),
    );
  }, []);

  return {
    layout,
    setLayout: switchLayout,
  };
};
