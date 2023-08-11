import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { theme } from '../../../theme';

interface CallControlsButtonProps {
  /**
   * `onPress` handler called when a single tap gesture is detected.
   */
  onPress?: PressableProps['onPress'];
  /**
   * The background color of the button rendered.
   */
  color?: string;
  /**
   * Boolean to enable/disable the button
   */
  disabled?: boolean;
  /**
   * Style to the Pressable button.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Style of the SVG rendered inside the button.
   */
  svgContainerStyle?: StyleProp<ViewStyle>;
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

const DEFAULT_ICON_SIZE = theme.icon.md;
const DEFAULT_BUTTON_SIZE = theme.button.sm;

export const CallControlsButton = (
  props: React.PropsWithChildren<CallControlsButtonProps>,
) => {
  const {
    onPress,
    children,
    disabled,
    color,
    style,
    svgContainerStyle,
    testID,
    onLayout,
  } = props;

  const pressableStyle: PressableProps['style'] = ({ pressed }) => [
    DEFAULT_BUTTON_SIZE,
    styles.container,
    {
      backgroundColor: color,
      opacity: pressed ? 0.2 : 1,
    },
    style,
    disabled ? styles.disabledStyle : null,
  ];

  return (
    <Pressable
      disabled={disabled}
      style={pressableStyle}
      onPress={onPress}
      testID={testID}
      onLayout={onLayout}
    >
      <View style={[DEFAULT_ICON_SIZE, svgContainerStyle ?? null]}>
        {children}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.light.content_bg,
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
  disabledStyle: {
    backgroundColor: theme.light.disabled,
  },
});
