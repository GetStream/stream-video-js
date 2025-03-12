import React from 'react';
import {
  type ColorValue,
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import type { Theme } from '../../../theme/theme';

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
   * Style to the Pressable button.
   */
  style?: Theme['callControlsButton'];
  /**
   * Sets the height, width and border-radius (half the value) of the button.
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
    onPress,
    children,
    disabled,
    color: colorProp,
    disabledColor: disabledColorProp,
    style: styleProp,
    size,
    testID,
    onLayout,
  } = props;

  const {
    theme: {
      colors,
      defaults,
      variants: { roundButtonSizes },
      callControlsButton: { container },
    },
  } = useTheme();

  const pressableStyle: PressableProps['style'] = ({ pressed }) => [
    styles.container,
    {
      backgroundColor: disabled
        ? disabledColorProp || colors.buttonDisabled
        : colorProp || colors.buttonSecondary,
      opacity: pressed ? 0.2 : 1,
      height: size || roundButtonSizes.lg,
      width: size || roundButtonSizes.lg,
      borderRadius: defaults.borderRadius,
    },
    styleProp?.container ?? null,
    container,
  ];

  const childrenSize = (size || roundButtonSizes.lg) / 2 - 5;
  return (
    <Pressable
      disabled={disabled}
      style={pressableStyle}
      onPress={onPress}
      testID={testID}
      onLayout={onLayout}
    >
      <View
        style={[
          { height: childrenSize, width: childrenSize },
          styleProp?.svgContainer ?? null,
        ]}
      >
        {children}
      </View>
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
});
