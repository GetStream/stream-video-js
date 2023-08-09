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
    style ? style : null,
  ];

  return (
    <Pressable
      style={pressableStyle}
      onPress={onPress}
      testID={testID}
      onLayout={onLayout}
    >
      <View
        style={[
          styles.svgContainerStyle,
          DEFAULT_ICON_SIZE,
          svgContainerStyle ?? null,
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
    borderColor: theme.light.content_bg,
    alignItems: 'center',
  },
  svgContainerStyle: {},
});
