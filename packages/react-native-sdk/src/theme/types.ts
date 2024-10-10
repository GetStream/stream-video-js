import { ColorValue, TextStyle } from 'react-native';

export type ColorScheme = {
  primary: ColorValue;
  error: ColorValue;
  info: ColorValue;
  disabled: ColorValue;

  // TODO: remove these legacy colors when Design v2 rewrite is completed
  base1: ColorValue;
  base2: ColorValue;
  base4: ColorValue;
  base5: ColorValue;

  // TODO: remove these legacy colors when Design v2 rewrite is completed
  background1: ColorValue;
  background2: ColorValue;
  background3: ColorValue;
  background4: ColorValue;
  background5: ColorValue;
  background6: ColorValue;

  // TODO: when design v2 is complete, filter out the not used colors from here (expected to have ~15 theme colors)
  buttonPrimaryDefault: ColorValue;
  buttonPrimaryDisabled: ColorValue;
  buttonPrimaryHover: ColorValue;
  buttonPrimaryPressed: ColorValue;
  buttonQuaternaryActive: ColorValue;
  buttonQuaternaryDefault: ColorValue;
  buttonQuaternaryDisabled: ColorValue;
  buttonQuaternaryHover: ColorValue;
  buttonQuaternaryPressed: ColorValue;
  buttonSecondaryDefault: ColorValue;
  buttonSecondaryDisabled: ColorValue;
  buttonSecondaryHover: ColorValue;
  buttonSecondaryPressed: ColorValue;
  buttonSecondaryActiveDefault: ColorValue;
  buttonSecondaryActiveHover: ColorValue;
  buttonSecondaryActivePressed: ColorValue;
  buttonSecondaryWarningDefault: ColorValue;
  buttonSecondaryWarningHover: ColorValue;
  buttonSecondaryWarningPressed: ColorValue;
  buttonTertiaryActive: ColorValue;
  buttonTertiaryDisabled: ColorValue;
  buttonTertiaryHover: ColorValue;
  buttonTertiaryPressed: ColorValue;
  buttonTertiaryStroke: ColorValue;
  containerCaution: ColorValue;
  containerNeutral: ColorValue;
  containerPrimary: ColorValue;
  containerSecondary: ColorValue;
  containerSuccess: ColorValue;
  containerTertiary: ColorValue;
  containerWarning: ColorValue;
  iconAlertCaution: ColorValue;
  iconAlertSuccess: ColorValue;
  iconAlertWarning: ColorValue;
  iconPrimaryAccent: ColorValue;
  iconPrimaryDefault: ColorValue;
  iconPrimaryDisabled: ColorValue;
  iconPrimaryHover: ColorValue;
  iconPrimaryOnAccent: ColorValue;
  iconPrimaryPressed: ColorValue;
  sheetOverlay: ColorValue;
  sheetPrimary: ColorValue;
  sheetSecondary: ColorValue;
  sheetTertiary: ColorValue;
  typeAccent: ColorValue;
  typeOnAccent: ColorValue;
  typePrimary: ColorValue;
  typeQuaternary: ColorValue;
  typeSecondary: ColorValue;
  typeTertiary: ColorValue;

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

export type Insets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type FontsScheme = Record<FontTypes, FontStyle>;

export type Theme = ColorType;
