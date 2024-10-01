import { ColorValue, TextStyle } from 'react-native';

export type ColorScheme = {
  primary: ColorValue;
  error: ColorValue;
  info: ColorValue;
  disabled: ColorValue;

  base1: ColorValue;
  base2: ColorValue;
  base3: ColorValue;
  base4: ColorValue;

  background1: ColorValue;
  background2: ColorValue;
  background3: ColorValue;
  background4: ColorValue;
  background5: ColorValue;
  background6: ColorValue;

  text_low_emphasis: ColorValue;
  text_medium_emphasis: ColorValue;
  text_high_emphasis: ColorValue;

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
