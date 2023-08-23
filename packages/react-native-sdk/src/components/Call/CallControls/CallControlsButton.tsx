import React from 'react';
import {
  ColorValue,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { Theme } from '../../../theme/theme';

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
    style: styleProp,
    size,
    testID,
    onLayout,
  } = props;

  const {
    theme: {
      variants: { buttonSizes },
      colors,
      callControlsButton: { container },
    },
  } = useTheme();

  const pressableStyle: PressableProps['style'] = ({ pressed }) => [
    styles.container,
    {
      backgroundColor: disabled
        ? colors.disabled
        : colorProp || colors.static_white,
      opacity: pressed ? 0.2 : 1,
      height: size || buttonSizes.sm,
      width: size || buttonSizes.sm,
      borderRadius: (size || buttonSizes.sm) / 2,
      borderColor: colors.content_bg,
    },
    styleProp?.container ?? null,
    container,
  ];

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
          {
            height: (size || buttonSizes.sm) / 2 - 5,
            width: (size || buttonSizes.sm) / 2 - 5,
          },
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
    borderWidth: 1,
    alignItems: 'center',
    // For iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,

    // For android
    elevation: 6,
  },
});
