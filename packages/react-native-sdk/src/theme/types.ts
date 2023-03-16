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
};

export type ColorType = Record<'light' | 'dark', ColorScheme>;
export type Theme = ColorType;
