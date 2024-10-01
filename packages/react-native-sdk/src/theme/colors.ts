import { palette } from './constants';
import { ColorScheme } from './types';

const opacityToHex = (opacity: number) => {
  return Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
};

const colors: ColorScheme = {
  primary: palette.blue500,
  error: palette.red400,
  info: palette.green500,
  disabled: palette.grey600,

  base1: palette.grey50,
  base2: palette.grey300,
  base3: palette.grey700,
  base4: palette.grey950,

  background1: palette.grey950 + opacityToHex(0.05), // old dark.conent_bg
  background2: palette.grey800,
  background3: palette.grey950 + opacityToHex(0.4), // overlay_light
  background4: palette.grey950 + opacityToHex(0.6), // overlay_medium
  background5: palette.grey900,
  background6: palette.grey950 + opacityToHex(0.85), // overlay_heavy

  text_low_emphasis: palette.grey50,
  text_medium_emphasis: palette.grey500,
  text_high_emphasis: palette.grey950 + opacityToHex(0.5),
};

const colorPalette = {
  colors,
};

export { colorPalette, colors };
