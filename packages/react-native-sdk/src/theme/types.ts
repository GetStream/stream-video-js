import { type ColorValue, type TextStyle } from 'react-native';

/**
 * ColorScheme defines the complete color palette for the application's theme.
 * It provides a centralized type definition for maintaining consistent colors
 * across different UI components and contexts.
 */
export type ColorScheme = {
  primary: ColorValue;
  secondary: ColorValue;
  success: ColorValue;
  warning: ColorValue;

  buttonPrimary: ColorValue;
  buttonSecondary: ColorValue;
  buttonSuccess: ColorValue;
  buttonWarning: ColorValue;
  buttonDisabled: ColorValue;

  iconPrimary: ColorValue;
  iconSecondary: ColorValue;
  iconSuccess: ColorValue;
  iconWarning: ColorValue;

  sheetPrimary: ColorValue;
  sheetSecondary: ColorValue;
  sheetTertiary: ColorValue;
  sheetOverlay: ColorValue;

  textPrimary: ColorValue;
  textSecondary: ColorValue;

  // allow any other color
  [key: string]: ColorValue;
};

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

/**
 * DimensionType defines a set of standardized size values for component scaling.
 * Each property represents a size tier from extra small (xs) to extra large (xl).
 *
 * @property xs - Extra small size (typically used for minimal spacing or compact elements)
 * @property sm - Small size (used for tight but readable spacing)
 * @property md - Medium size (default size for most components)
 * @property lg - Large size (used for emphasized or prominent elements)
 * @property xl - Extra large size (used for maximum emphasis or touch targets)
 *
 * Common use cases:
 * - Padding and margin values
 * - Icon sizes
 * - Button dimensions
 * - Component spacing
 */
export type DimensionType = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

/**
 * Insets represent spacing measurements for the four edges of a component or screen.
 *
 * @property top - Distance from the upper edge (e.g., status bar, notch)
 * @property right - Distance from the right edge (e.g., curved screen edges)
 * @property bottom - Distance from the bottom edge (e.g., home indicator, navigation bar)
 * @property left - Distance from the left edge (e.g., curved screen edges)
 *
 * Common use cases:
 * - Safe area padding to avoid device UI elements
 * - Component internal padding
 * - Layout margin spacing
 */
export type Insets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type FontsScheme = Record<FontTypes, FontStyle>;
