import React from 'react';
import {
  ColorValue,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

const styles = StyleSheet.create({
  container: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0000000D',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  svgContainerStyle: {
    width: 25,
    height: 25,
  },
});

type ColorKey = 'callToAction' | 'activated' | 'deactivated' | 'cancel';

const colorKeyToBgColor = (colorKey: ColorKey): ColorValue => {
  switch (colorKey) {
    case 'callToAction':
      return '#20E070';
    case 'activated':
      return '#FFFFFF';
    case 'deactivated':
      return '#00000066';
    case 'cancel':
      return '#FF3742';
  }
};

type CallControlsButtonProps = {
  /**
   * onPress handler called when a single tap gesture is detected.
   */
  onPress: PressableProps['onPress'];
  /**
   * The background color of the button rendered when button is activated, call, cancel or deactivated.
   */
  colorKey: ColorKey;
  /**
   * Style to the Pressable button.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Style of the SVG rendered inside the button.
   */
  svgContainerStyle?: StyleProp<ViewStyle>;
};

export const CallControlsButton = (
  props: React.PropsWithChildren<CallControlsButtonProps>,
) => {
  const { onPress, children, colorKey, style, svgContainerStyle } = props;

  const pressableStyle: PressableProps['style'] = ({ pressed }) => [
    styles.container,
    {
      backgroundColor: colorKeyToBgColor(colorKey),
      opacity: pressed ? 0.2 : 1,
    },
    style ? style : null,
  ];

  return (
    <Pressable style={pressableStyle} onPress={onPress}>
      <View style={[styles.svgContainerStyle, svgContainerStyle ?? null]}>
        {children}
      </View>
    </Pressable>
  );
};
