import React from 'react';
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
import { useTheme, Theme } from '@stream-io/video-react-native-sdk';

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
  const { theme } = useTheme();
  const styles = getStyles(theme);

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

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      //backgroundColor: theme.colors.primary,
      backgroundColor: theme.getValue('button', 'backgroundColor'),
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
  });
