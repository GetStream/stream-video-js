import { ColorValue, TextStyle } from 'react-native';

// TODO: check if this is used somewhere and remove if not
export type ColorScheme = {
  primary: ColorValue;
  error: ColorValue;
  info: ColorValue;
  static_black: ColorValue;
  static_white: ColorValue;
  static_overlay: ColorValue;
  static_grey: ColorValue;
  disabled: ColorValue;
  text_low_emphasis: ColorValue;
  text_high_emphasis: ColorValue;
  controls_bg: ColorValue;
  borders: ColorValue;
  overlay: ColorValue;
  overlay_dark: ColorValue;
  bars: ColorValue;
  content_bg: ColorValue;
  dark_gray: ColorValue;
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

export type FontsScheme = Record<FontTypes, FontStyle>;

export type Theme = ColorType;
