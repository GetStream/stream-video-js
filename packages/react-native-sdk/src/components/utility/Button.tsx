import React from 'react';
import {
  Pressable,
  type PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { BaseButtonSizes, BaseButtonVariants } from '../../theme/theme';

interface ButtonProps {
  /**
   * The children of the button.
   */
  text: string;
  /**
   * The left accessory of the button.
   */
  leftAccessory?: () => React.ReactNode;
  /**
   * The right accessory of the button.
   */
  rightAccessory?: () => React.ReactNode;
  /**
   * `onPress` handler called when a single tap gesture is detected.
   */
  onPress?: PressableProps['onPress'];
  type?: BaseButtonVariants;
  size?: BaseButtonSizes;
  /**
   * Boolean to enable/disable the button
   */
  disabled?: boolean;
  /**
   * Style to the button.
   */
  style?: StyleProp<ViewStyle>;
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

export const Button = (props: React.PropsWithChildren<ButtonProps>) => {
  const {
    text,
    disabled = false,
    type = 'primary',
    size = 'medium',
    onPress,
    onLayout,
    style: styleProp,
    testID,
    leftAccessory,
    rightAccessory,
  } = props;

  const {
    theme: { semantics, components, button },
  } = useTheme();

  const pressableStyle: PressableProps['style'] = [
    styles.content,
    button.container,
    button[size],
    button[type].container,
    disabled ? button.disabled.container : {},
    styleProp,
  ];

  const pressedOverlayStyle = (pressed: boolean): ViewStyle[] => [
    StyleSheet.absoluteFill,
    {
      backgroundColor: semantics.backgroundUtilityPressed,
      borderRadius: components.buttonRadiusFull,
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
        <View style={button.content}>
          <View style={pressedOverlayStyle(pressed)} />
          {leftAccessory && (
            <View style={button.accessory}>{leftAccessory()}</View>
          )}
          <Text
            style={[button[type].text, disabled ? button.disabled.text : null]}
          >
            {text}
          </Text>
          {rightAccessory && (
            <View style={button.accessory}>{rightAccessory()}</View>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
});
