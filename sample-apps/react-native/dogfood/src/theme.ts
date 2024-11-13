import { DeepPartial, Theme } from '@stream-io/video-react-native-sdk';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeMode } from './contexts/AppContext';

const opacityToHex = (opacity: number) => {
  return Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
};

// TODO add type Theme to this object
export const appTheme = {
  colors: {
    static_grey: '#272A30',
    static_white: '#ffffff',
    static_overlay: '#080707' + opacityToHex(0.85),
    primary: '#005FFF',
    light_gray: '#979797',
    light_blue: '#669FFF',
    disabled: '#4C525C',
    dark_gray: '#1C1E22',
    error: '#FF3742',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  zIndex: {
    IN_BACK: 0,
    IN_MIDDLE: 1,
    IN_FRONT: 2,
  },
};

export const useCustomTheme = (mode: ThemeMode): DeepPartial<Theme> => {
  const { top, right, bottom, left } = useSafeAreaInsets();

  const variants: DeepPartial<Theme['variants']> = {
    insets: {
      top,
      right,
      bottom,
      left,
    },
  };

  const lightThemeColors: DeepPartial<Theme['colors']> = {
    buttonPrimary: '#005fff',
    buttonSecondary: '#eff0f1',
    buttonDisabled: '#ccdfff',
    buttonWarning: '#dc433b',
    iconPrimary: '#19232d',
    iconSecondary: '#005fff',
    iconSuccess: '#00e2a1',
    iconWarning: '#dc433b',
    sheetPrimary: '#ffffff',
    sheetSecondary: '#eff0f1',
    sheetTertiary: '#e3e4e5',
    sheetOverlay: '#0c0d0ea6',
    textPrimary: '#000000',
    textSecondary: '#19232d',
  };

  const baseTheme: DeepPartial<Theme> = {
    variants,
  };

  if (mode === 'light') {
    return {
      ...baseTheme,
      colors: lightThemeColors,
    };
  }

  return baseTheme;
};
