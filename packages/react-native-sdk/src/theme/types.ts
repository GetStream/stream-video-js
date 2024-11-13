import { ColorValue, TextStyle } from 'react-native';

export type ColorScheme = {
  primary: ColorValue;
  secondary: ColorValue;
  success: ColorValue;
  warning: ColorValue;

  buttonPrimary: ColorValue;
  buttonSecondary: ColorValue;
  buttonDisabled: ColorValue;
  buttonWarning: ColorValue;

  iconPrimary: ColorValue;
  iconSuccess: ColorValue;
  iconPrimaryAccent: ColorValue;
  iconWarning: ColorValue;

  sheetPrimary: ColorValue;
  sheetSecondary: ColorValue;
  sheetTertiary: ColorValue;
  sheetOverlay: ColorValue;

  textPrimary: ColorValue;
  textSecondary: ColorValue;

  // allow any other color
  [key: string]: ColorValue;
};

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

/**
 * DimensionType is used to define the size of a component.
 * It is an object with xs, sm, md, lg, and xl properties.
 */
export type DimensionType = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

/**
 * Insets are used to define the padding or margin of a component.
 * These values can also represent safe area insets, which ensure content
 * is properly padded to avoid device-specific UI elements like notches
 * or rounded corners.
 */
export type Insets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type FontsScheme = Record<FontTypes, FontStyle>;
