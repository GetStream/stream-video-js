import { palette } from './constants';

const opacityToHex = (opacity: number) => {
  return Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
};

const lightColors = {
  primary: palette.blue500,
  error: palette.red400,
  info: palette.green500,
  disabled: palette.grey600,

  background: palette.grey800,
  border: palette.grey300,
  bar: palette.grey50,
  text_low_emphasis: palette.grey500,
  text_high_emphasis: palette.grey950,

  overlay_light: palette.grey950 + opacityToHex(0.4),
  overlay_medium: palette.grey950 + opacityToHex(0.6),
  overlay_heavy: palette.grey950 + opacityToHex(0.85),

  static_white: palette.grey50,
  static_grey: palette.grey700,
  static_black: palette.grey950,
};

const darkColors = {
  primary: palette.blue500,
  error: palette.red400,
  info: palette.green500,
  disabled: palette.grey600,

  background: palette.grey800,
  border: palette.grey950 + opacityToHex(0.05),
  bar: palette.grey900,
  text_low_emphasis: palette.grey500,
  text_high_emphasis: palette.grey50,

  overlay_light: palette.grey950 + opacityToHex(0.4),
  overlay_medium: palette.grey950 + opacityToHex(0.6),
  overlay_heavy: palette.grey950 + opacityToHex(0.85),

  static_white: palette.grey50,
  static_grey: palette.grey700,
  static_black: palette.grey950,
};

const colorPalette = {
  light: lightColors,
  dark: darkColors,
};

export { colorPalette, lightColors, darkColors };
