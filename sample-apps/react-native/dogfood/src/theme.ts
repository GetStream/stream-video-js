import { DeepPartial, Theme } from '@stream-io/video-react-native-sdk';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Overrides handed to `StreamVideo` alongside `colorScheme`.
 *
 * Only the safe-area insets: the SDK resolves light/dark itself from the
 * `colorScheme` prop, so nothing else needs repeating here.
 */
export const useCustomTheme = (): DeepPartial<Theme> => {
  const { top, right, bottom, left } = useSafeAreaInsets();

  return useMemo(
    () => ({ insets: { top, right, bottom, left } }),
    [top, right, bottom, left],
  );
};
