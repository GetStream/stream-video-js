import React from 'react';
import {
  type ColorValue,
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import type { Theme } from '../../../../theme/theme';
import { ExclamationMark } from '../../../../icons';

interface CallControlsButtonProps {
  /**
   * `onPress` handler called when a single tap gesture is detected.
   */
  onPress?: PressableProps['onPress'];
  /**
   * The background color of the button rendered.
   */
  color?: ColorValue;
  /**
   * The background color of the disabled button.
   */
  disabledColor?: ColorValue;
  /**
   * Boolean to enable/disable the button
   */
  disabled?: boolean;
  /**
   * Boolean to show a badge on the button.
   */
  showBadge?: boolean;
  /**
   * Boolean to indicate if the button is turned on.
   */
  turnedOn?: boolean;
  /**
   * Style to the Pressable button.
   */
  style?: Partial<Theme['callControlsButton']>;
  /**
   * Sets the height, width and border-radius (half the value) of the button.
   * @deprecated Use the `style` prop instead.
   */
  size?: number;
  /**
   * Accessibility label for the button.
   */
  testID?: string;
  /**
   * Invoked on mount and layout changes with
   * {nativeEvent: { layout: {x, y, width, height}}}.
   */
  onLayout?: View['props']['onLayout'];
}

export const CallControlsButton = (
  props: React.PropsWithChildren<CallControlsButtonProps>,
) => {
  const {
    children,
    onPress,
    onLayout,
    turnedOn = true,
    disabled = false,
    showBadge = false,
    color,
    disabledColor: disabledColorProp,
    style: styleProp,
    testID,
  } = props;

  const {
    theme: {
      semantics,
      components,
      callControlsButton: { container, badge },
    },
  } = useTheme();

  const pressableStyle: PressableProps['style'] = [
    styles.container,
    {
      backgroundColor: disabled
        ? disabledColorProp || semantics.backgroundUtilityDisabled
        : turnedOn
          ? color || semantics.buttonSecondaryBg
          : semantics.buttonDestructiveBg,
    },
    container,
    styleProp?.container ?? null,
  ];

  const pressedOverlayStyle = (pressed: boolean): ViewStyle[] => [
    StyleSheet.absoluteFill,
    {
      backgroundColor: semantics.backgroundUtilityPressed,
      borderRadius: container.borderRadius,
      opacity: pressed ? 0.25 : 0,
    },
  ];

  return (
    <Pressable
      style={pressableStyle}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      onLayout={onLayout}
    >
      {({ pressed }) => (
        <>
          {children}
          <View pointerEvents="none" style={pressedOverlayStyle(pressed)} />
          {showBadge && (
            <View style={[styles.badge, badge]}>
              <ExclamationMark
                color={
                  disabled ? semantics.badgeBorder : semantics.textDisabled
                }
                size={components.iconSizeSm}
              />
            </View>
          )}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',

    // For android
    elevation: 6,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
