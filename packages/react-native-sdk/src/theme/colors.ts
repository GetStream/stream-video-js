import { palette } from './constants';
import { ColorScheme } from './types';

const opacityToHex = (opacity: number) => {
  return Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
};

const colors: ColorScheme = {
  primary: palette.blue500, // remove and replace with primary100
  error: palette.red400, // remove and replace with warning100
  info: palette.green500, // remove and replace with success100
  disabled: palette.grey600, // remove and replace with primary180

  // these are legacy and should be removed after Design v2 completed
  base1: palette.grey50,
  base2: palette.grey300,
  base3: palette.grey500,
  base4: palette.grey700,
  base5: palette.grey950,

  // these are legacy and should be removed after Design v2 completed
  background1: palette.grey950 + opacityToHex(0.05),
  background2: palette.grey800,
  background3: palette.grey950 + opacityToHex(0.4),
  background4: palette.grey950 + opacityToHex(0.6),
  background5: palette.grey900,
  background6: palette.grey950 + opacityToHex(0.85),

  // Colors candidates for the default theme
  buttonPrimaryDefault: '#005fff',
  buttonSecondaryDefault: '#19232d',
  buttonSecondaryWarningDefault: '#dc433b',
  iconPrimaryDefault: '#eff0f1',
  iconAlertSuccess: '#00e2a1',
  sheetPrimary: '#000000',

  buttonPrimaryDisabled: '#1b2c43',
  buttonPrimaryHover: '#4c8fff',
  buttonPrimaryPressed: '#123d82',
  buttonQuaternaryActive: '#19232d',
  buttonQuaternaryDefault: '#dc433b',
  buttonQuaternaryDisabled: '#31292f',
  buttonQuaternaryHover: '#e77b76',
  buttonQuaternaryPressed: '#7d3535',
  buttonSecondaryDisabled: '#1e262e29',
  buttonSecondaryHover: '#323b44',
  buttonSecondaryPressed: '#101213',
  buttonSecondaryActiveDefault: '#005fff',
  buttonSecondaryActiveHover: '#4c8fff',
  buttonSecondaryActivePressed: '#123d82',
  buttonSecondaryWarningHover: '#e77b76',
  buttonSecondaryWarningPressed: '#7d3535',
  buttonTertiaryActive: '#19232d',
  buttonTertiaryDisabled: '#1e262e29',
  buttonTertiaryHover: '#4c535b',
  buttonTertiaryPressed: '#101213',
  buttonTertiaryStroke: '#323b44',
  containerCaution: '#353830',
  containerNeutral: '#323b44',
  containerPrimary: '#1b2c43',
  containerSecondary: '#263942',
  containerSuccess: '#1d2f34',
  containerTertiary: '#2d3042',
  containerWarning: '#31292f',
  iconAlertCaution: '#ffd646',
  iconAlertWarning: '#dc433b',
  iconPrimaryAccent: '#005fff',
  iconPrimaryDisabled: '#7e8389',
  iconPrimaryHover: '#e3e4e5',
  iconPrimaryOnAccent: '#eff0f1',
  iconPrimaryPressed: '#656b72',
  sheetOverlay: '#0c0d0ea6',
  sheetSecondary: '#101213',
  sheetTertiary: '#19232d',
  typeAccent: '#00e2a1',
  typeOnAccent: '#eff0f1',
  typePrimary: '#eff0f1',
  typeQuaternary: '#101213',
  typeSecondary: '#b0b4b7',
  typeTertiary: '#656b72',
};

const colorPalette = {
  colors,
};

export { colorPalette, colors };
