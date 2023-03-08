import { StyleProp, TextStyle, ViewStyle } from 'react-native';

export type ColorScheme = {
  primary: string;
  error: string;
  info: string;
  static_black: string;
  static_white: string;
  static_overlay: string;
  static_grey: string;
  link_bg: string;
  disabled: string;
  text_low_emphasis: string;
  text_high_emphasis: string;
  controls_bg: string;
  borders: string;
  overlay: string;
  overlay_dark: string;
  bars: string;
  content_bg: string;
};

export type ColorType = Record<'light' | 'dark', ColorScheme>;

export type FontTypes =
  | 'heading4'
  | 'heading5'
  | 'heading6'
  | 'subtitle'
  | 'subtitleBold'
  | 'caption';
export type FontStyle = {
  fontSize: TextStyle['fontSize'];
  fontWeight: TextStyle['fontWeight'];
};

export type FontsScheme = Record<FontTypes, FontStyle>;

export type PaddingTypes = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type PaddingScheme = Record<PaddingTypes, number>;

export type MarginTypes = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type MarginScheme = Record<MarginTypes, number>;

export type IconTypes = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconScheme = Record<IconTypes, StyleProp<ViewStyle>>;

export type ButtonTypes = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonScheme = Record<ButtonTypes, StyleProp<ViewStyle>>;

export type AvatarTypes = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarScheme = Record<AvatarTypes, number>;

export type Theme = ColorType & {
  fonts: FontsScheme;
  padding: PaddingScheme;
  margin: MarginScheme;
  icon: IconScheme;
  button: ButtonScheme;
  avatar: AvatarScheme;
};
