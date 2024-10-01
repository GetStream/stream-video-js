import React, { useMemo } from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { BUTTON_HEIGHT } from '../constants';
import { useTheme } from '@stream-io/video-react-native-sdk';

type ButtonPropTypes = Omit<PressableProps, 'style'> & {
  title: string;
  buttonStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
};

export const Button = ({
  disabled,
  title,
  buttonStyle,
  titleStyle,
  ...rest
}: ButtonPropTypes) => {
  const styles = useStyles();
  const { theme } = useTheme();
  // theme.log();
  return (
    <Pressable
      disabled={disabled}
      {...rest}
      style={[
        styles.button,
        disabled ? styles.disabledButtonStyle : null,
        buttonStyle,
      ]}
    >
      <Text style={[styles.buttonText, titleStyle]}>{title}</Text>
    </Pressable>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        button: {
          backgroundColor: theme.colors.primary,
          // backgroundColor: theme.getValue('button', 'color'),
          justifyContent: 'center',
          borderRadius: 8,
          height: BUTTON_HEIGHT,
          paddingHorizontal: theme.variants.spacingSizes.md,
        },
        buttonText: {
          color: theme.colors.static_white,
          fontWeight: theme.typefaces.heading6.fontWeight,
          textAlign: 'center',
          fontSize: 17,
        },
        disabledButtonStyle: {
          backgroundColor: theme.colors.disabled,
        },
      }),
    [theme],
  );
};
