import { StyleProp, TextStyle, ViewStyle } from 'react-native';

export type ColorScheme = {
  primary: string;
  error: string;
  info: string;
  static_black: string;
  static_white: string;
  static_overlay: string;
  static_grey: string;
  disabled: string;
  text_low_emphasis: string;
  text_high_emphasis: string;
  controls_bg: string;
  borders: string;
  overlay: string;
  overlay_dark: string;
  bars: string;
  content_bg: string;
  dark_gray: string;
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

type SizingTypes = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type PaddingScheme = Record<SizingTypes, number>;

export type MarginScheme = Record<SizingTypes, number>;

export type IconScheme = Record<SizingTypes, StyleProp<ViewStyle>>;

export type ButtonScheme = Record<SizingTypes, StyleProp<ViewStyle>>;

export type AvatarScheme = Record<SizingTypes, number>;

export type SpacingScheme = Record<SizingTypes, number>;

export type RoundedScheme = Record<SizingTypes, number>;

export type Theme = ColorType & {
  fonts: FontsScheme;
  padding: PaddingScheme;
  margin: MarginScheme;
  icon: IconScheme;
  button: ButtonScheme;
  avatar: AvatarScheme;
  spacing: SpacingScheme;
  rounded: RoundedScheme;
};
