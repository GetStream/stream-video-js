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
import { defaultTheme, useTheme } from '@stream-io/video-react-native-sdk';

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

  return (
    <Pressable
      disabled={disabled}
      {...rest}
      style={StyleSheet.flatten([
        styles.button,
        disabled ? styles.disabledButtonStyle : null,
        buttonStyle,
      ])}
    >
      <Text style={[styles.buttonText, titleStyle]}>{title}</Text>
    </Pressable>
  );
};

const useStyles = () => {
  const appTheme = useTheme()?.theme || defaultTheme;

  return useMemo(
    () =>
      StyleSheet.create({
        button: {
          backgroundColor: appTheme.colors.buttonPrimary,
          justifyContent: 'center',
          borderRadius: 8,
          height: BUTTON_HEIGHT,
          paddingHorizontal: appTheme.variants.spacingSizes.md,
        },
        buttonText: {
          color: appTheme.colors.iconPrimary,
          fontWeight: appTheme.typefaces.heading6.fontWeight,
          textAlign: 'center',
          fontSize: 17,
        },
        disabledButtonStyle: {
          backgroundColor: appTheme.colors.disabled,
        },
      }),
    [appTheme],
  );
};
