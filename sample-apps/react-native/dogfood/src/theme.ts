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

  const baseTheme: DeepPartial<Theme> = {
    variants: {
      insets: {
        top,
        right,
        bottom,
        left,
      },
    },
    floatingParticipantsView: {
      topPosition: 47,
    },
  } as DeepPartial<Theme['variants']>;

  if (mode === 'light') {
    return {
      ...baseTheme,
      colors: {
        buttonPrimaryDefault: '#005fff',
        buttonPrimaryDisabled: '#e6eef7',
        buttonSecondaryDefault: '#f5f7f9',
        buttonSecondaryHover: '#e8ecef',
        buttonSecondaryWarningDefault: '#dc433b',
        iconPrimaryDefault: '#1a1d21',
        iconPrimaryAccent: '#005fff',
        iconAlertSuccess: '#00c589',
        iconAlertWarning: '#dc433b',
        sheetPrimary: '#ffffff',
        sheetSecondary: '#f5f7f9',
        sheetTertiary: '#e8ecef',
        sheetOverlay: 'rgba(0, 0, 0, 0.1)',
        typePrimary: '#1a1d21',
        typeSecondary: '#6b7278',
      } as DeepPartial<Theme['colors']>,
    };
  }

  return baseTheme;
};
