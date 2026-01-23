import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';

export type LayoutConfig = {
  title: string;
  icon: string;
  props?: Record<string, unknown>;
};

export type LayoutMap = Record<string, LayoutConfig>;

type LayoutSwitcherContextValue = {
  layout: string;
  setLayout: (layout: string) => void;
  layouts: LayoutMap;
};

const LayoutSwitcherContext = createContext<
  LayoutSwitcherContextValue | undefined
>(undefined);

const DEFAULT_STORAGE_KEY = '@stream/layout-settings';

export type LayoutSwitcherProviderProps = {
  children: ReactNode;
  layouts: LayoutMap;
  defaultLayout: string;
  layoutOverride?: string;
  storageKey?: string;
  /**
   * Layouts to hide when screen share is active.
   * If current layout is in this list, it will switch to fallbackLayout.
   */
  hideOnScreenShare?: string[];
  /**
   * Layout to switch to when current layout is incompatible with screen share.
   */
  fallbackLayoutOnScreenShare?: string;
};

export const LayoutSwitcherProvider = ({
  children,
  layouts,
  defaultLayout,
  layoutOverride,
  storageKey = DEFAULT_STORAGE_KEY,
  hideOnScreenShare = [],
  fallbackLayoutOnScreenShare,
}: LayoutSwitcherProviderProps) => {
  const [layout, setLayoutState] = useState<string>(() => {
    if (layoutOverride && layouts[layoutOverride]) {
      return layoutOverride;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as { selectedLayout: string };
          if (layouts[parsed.selectedLayout]) {
            return parsed.selectedLayout;
          }
        }
      } catch (e) {
        console.warn('Error parsing layout settings', e);
      }
    }
    return defaultLayout;
  });

  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();

  useEffect(() => {
    if (hasScreenShare && hideOnScreenShare.includes(layout)) {
      const fallback = fallbackLayoutOnScreenShare ?? defaultLayout;
      setLayoutState(fallback);
    }
  }, [
    hasScreenShare,
    hideOnScreenShare,
    layout,
    fallbackLayoutOnScreenShare,
    defaultLayout,
  ]);

  useEffect(() => {
    if (layoutOverride && layouts[layoutOverride]) {
      setLayoutState(layoutOverride);
    }
  }, [layoutOverride, layouts]);

  const setLayout = useCallback(
    (newLayout: string) => {
      setLayoutState(newLayout);
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ selectedLayout: newLayout }),
        );
      }
    },
    [storageKey],
  );

  const value: LayoutSwitcherContextValue = {
    layout,
    setLayout,
    layouts,
  };

  return (
    <LayoutSwitcherContext.Provider value={value}>
      {children}
    </LayoutSwitcherContext.Provider>
  );
};

export const useLayoutSwitcher = (): LayoutSwitcherContextValue => {
  const context = useContext(LayoutSwitcherContext);
  if (!context) {
    throw new Error(
      'useLayoutSwitcher must be used within a LayoutSwitcherProvider',
    );
  }
  return context;
};
