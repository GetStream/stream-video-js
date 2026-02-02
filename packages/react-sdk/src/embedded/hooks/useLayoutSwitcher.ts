import { useCallback, useEffect, useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import type { LayoutOption } from '../types';

const SETTINGS_KEY = '@stream-io/embedded/layout-settings';
const DEFAULT_LAYOUT: LayoutOption = 'SpeakerLeft';

const VALID_LAYOUTS: LayoutOption[] = [
  'PaginatedGrid',
  'SpeakerLeft',
  'SpeakerRight',
  'SpeakerTop',
  'SpeakerBottom',
];

const isValidLayout = (layout: string): layout is LayoutOption =>
  VALID_LAYOUTS.includes(layout as LayoutOption);

const getLayoutSettings = (): { selectedLayout: LayoutOption } | undefined => {
  if (typeof window === 'undefined') return;
  const settings = window.localStorage.getItem(SETTINGS_KEY);
  if (settings) {
    try {
      const parsed = JSON.parse(settings);
      if (isValidLayout(parsed.selectedLayout)) {
        return parsed;
      }
    } catch (e) {
      console.log('Error parsing layout settings', e);
    }
  }
  return undefined;
};

export interface UseLayoutSwitcherProps {
  /** Initial layout from props (takes precedence over localStorage) */
  initialLayout?: LayoutOption;
}

/**
 * Hook to manage layout selection with localStorage persistence.
 * Automatically switches to Speaker layout when screen share is active.
 */
export const useLayoutSwitcher = ({
  initialLayout,
}: UseLayoutSwitcherProps = {}) => {
  const [layout, setLayoutState] = useState<LayoutOption>(() => {
    const layoutToUse =
      initialLayout || getLayoutSettings()?.selectedLayout || DEFAULT_LAYOUT;
    return isValidLayout(layoutToUse) ? layoutToUse : DEFAULT_LAYOUT;
  });

  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();

  useEffect(() => {
    if (hasScreenShare) {
      setLayoutState((currentLayout) => {
        if (currentLayout.startsWith('Speaker')) return currentLayout;
        return 'SpeakerRight';
      });
      return;
    }

    const storedLayout =
      initialLayout ?? getLayoutSettings()?.selectedLayout ?? DEFAULT_LAYOUT;
    setLayoutState(isValidLayout(storedLayout) ? storedLayout : DEFAULT_LAYOUT);
  }, [hasScreenShare, initialLayout]);

  const setLayout = useCallback((newLayout: LayoutOption) => {
    setLayoutState(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ selectedLayout: newLayout }),
      );
    }
  }, []);

  return {
    layout,
    setLayout,
  };
};
