import { DeepPartial, Theme } from '@stream-io/video-react-native-sdk';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeMode } from './contexts/AppContext';

export const useCustomTheme = (mode: ThemeMode): DeepPartial<Theme> => {
  const { top, right, bottom, left } = useSafeAreaInsets();

  const baseTheme: DeepPartial<Theme> = {
    insets: { top, right, bottom, left },
  };

  return baseTheme;
};
