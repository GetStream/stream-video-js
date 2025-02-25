import { palette } from './constants';
import { type ColorScheme } from './types';

const colors: ColorScheme = {
  primary: palette.primary100,
  secondary: palette.neutral90,
  success: palette.success100,
  warning: palette.warning100,

  buttonPrimary: palette.primary100,
  buttonSecondary: palette.neutral90,
  buttonSuccess: palette.success100,
  buttonWarning: palette.warning100,
  buttonDisabled: palette.primary180,

  iconPrimary: palette.neutral0,
  iconSecondary: palette.primary100,
  iconSuccess: palette.success100,
  iconWarning: palette.warning100,

  sheetPrimary: palette.neutral120,
  sheetSecondary: palette.neutral110,
  sheetTertiary: palette.neutral90,
  sheetOverlay: palette.overlay,

  textPrimary: palette.neutral0,
  textSecondary: palette.neutral30,
};

const colorPalette = {
  colors,
};

export { colorPalette, colors };
