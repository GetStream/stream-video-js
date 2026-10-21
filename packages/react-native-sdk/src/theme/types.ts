import { TextStyle, ViewStyle } from 'react-native';

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

export type BaseButtonSizes = 'small' | 'medium' | 'large';
export type BaseButtonVariants =
  'primary' | 'secondary' | 'destructive' | 'disabled';
type ButtonVariantStyle = {
  container: ViewStyle;
  text: TextStyle;
};

export type BaseButtonStyle = {
  container: ViewStyle;
  content: ViewStyle;
  accessory: ViewStyle;
} & {
  [key in BaseButtonVariants]: ButtonVariantStyle;
} & {
  [key in BaseButtonSizes]: ViewStyle;
};

export type AvatarSize = '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';
export type AvatarStyle = {
  container: {
    base: ViewStyle;
  } & { [key in AvatarSize]: ViewStyle };
  text: {
    base: TextStyle;
  } & { [key in AvatarSize]: TextStyle };
};

export type AvatarGroupSize = '3xl' | '2xl' | 'xl' | 'lg';
export type AvatarGroupPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center-top'
  | 'center-bottom';

export type AvatarGroupStyle = {
  container: { [key in AvatarGroupSize]: ViewStyle };
  item: { [key in AvatarGroupSize]: ViewStyle };
  text: {
    base: TextStyle;
  } & { [key in AvatarGroupSize]: TextStyle };
} & {
  [key in AvatarGroupPosition]: ViewStyle;
};

export type CallControlsButtonStyle = {
  container: ViewStyle;
  badge: ViewStyle;
};
