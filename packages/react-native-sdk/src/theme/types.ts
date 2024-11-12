import { ColorValue, TextStyle } from 'react-native';

export type ColorScheme = {
  buttonPrimaryDefault: ColorValue;
  buttonPrimaryDisabled: ColorValue;
  buttonSecondaryDefault: ColorValue;
  buttonSecondaryHover: ColorValue;
  buttonSecondaryWarningDefault: ColorValue;
  iconPrimaryDefault: ColorValue;
  iconPrimaryAccent: ColorValue;
  iconAlertSuccess: ColorValue;
  iconAlertWarning: ColorValue;
  sheetPrimary: ColorValue;
  sheetSecondary: ColorValue;
  sheetTertiary: ColorValue;
  sheetOverlay: ColorValue;
  typePrimary: ColorValue;
  typeSecondary: ColorValue;

  // allow any other color
  [key: string]: ColorValue;
};

export type ColorType = Record<'light' | 'dark', ColorScheme>;

export type FontTypes =
  | 'heading4'
  | 'heading5'
  | 'heading6'
  | 'subtitle'
  | 'subtitleBold'
  | 'caption'
  | 'bodyBold';
export type FontStyle = {
  fontSize: TextStyle['fontSize'];
  fontWeight: TextStyle['fontWeight'];
};

export type DimensionType = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

export type Insets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type FontsScheme = Record<FontTypes, FontStyle>;

export type Theme = ColorType;
