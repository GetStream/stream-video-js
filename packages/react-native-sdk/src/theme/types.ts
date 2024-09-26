import { ColorValue, TextStyle } from 'react-native';

// TODO: check if this is used somewhere and remove if not
export type ColorScheme = {
  primary: ColorValue;
  error: ColorValue;
  info: ColorValue;
  disabled: ColorValue;

  background: ColorValue;
  border: ColorValue;
  bar: ColorValue;
  text_low_emphasis: ColorValue;
  text_high_emphasis: ColorValue;

  overlay_light: ColorValue;
  overlay_medium: ColorValue;
  overlay_heavy: ColorValue;

  static_black: ColorValue;
  static_white: ColorValue;
  static_grey: ColorValue;

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

export type FontsScheme = Record<FontTypes, FontStyle>;

export type Theme = ColorType;
