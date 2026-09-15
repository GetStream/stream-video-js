import {
  DeepPartial,
  resolveTheme,
  Theme,
} from '@stream-io/video-react-native-sdk';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeMode } from './contexts/AppContext';

/**
 * The theme handed to `StreamVideo`.
 *
 * This has to carry the whole resolved theme, not just the insets: `StreamVideo`
 * renders its own `StreamTheme` internally, and `StreamTheme` always rebuilds
 * from `defaultTheme` (`resolveTheme(false)` - light) rather than inheriting the
 * surrounding `ThemeContext`. Anything missing here therefore falls back to the
 * light value for every component inside the provider, which is all of them.
 */
export const useCustomTheme = (mode: ThemeMode): DeepPartial<Theme> => {
  const { top, right, bottom, left } = useSafeAreaInsets();

  return useMemo(
    () => ({
      ...resolveTheme(mode === 'dark'),
      insets: { top, right, bottom, left },
    }),
    [mode, top, right, bottom, left],
  );
};
