import { palette } from './constants';

const opacityToHex = (opacity: number) => {
  return Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
};

const colors = {
  primary: palette.blue500,
  error: palette.red400,
  info: palette.green500,
  static_black: palette.grey950,
  static_white: palette.grey50,
  static_overlay: palette.grey950 + opacityToHex(0.85),
  static_grey: palette.grey700,
  disabled: palette.grey600,
  text_low_emphasis: palette.grey500,
  text_high_emphasis: palette.grey950,
  controls_bg: palette.grey50,
  borders: palette.grey300,
  overlay: palette.grey950 + opacityToHex(0.4),
  overlay_dark: palette.grey950 + opacityToHex(0.6),
  bars: palette.grey50,
  content_bg: palette.grey950 + opacityToHex(0.05),
  dark_gray: palette.grey800,
};

const darkThemeColors = {
  primary: palette.blue500,
  error: palette.red400,
  info: palette.green500,
  static_black: palette.grey950,
  static_white: palette.grey50,
  static_overlay: palette.grey950 + opacityToHex(0.85),
  static_grey: palette.grey700,
  disabled: palette.grey600,
  text_low_emphasis: palette.grey500,
  text_high_emphasis: palette.grey50,
  controls_bg: palette.grey900,
  borders: palette.grey700,
  overlay: palette.grey950 + opacityToHex(0.4),
  overlay_dark: palette.grey50 + opacityToHex(0.6),
  bars: palette.grey900,
  content_bg: palette.grey950 + opacityToHex(0.05),
  dark_gray: palette.grey800,
};

export { colors, darkThemeColors };
