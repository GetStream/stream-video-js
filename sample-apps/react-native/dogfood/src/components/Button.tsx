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
import { appTheme } from '../theme';
import { BUTTON_HEIGHT } from '../constants';

type ButtonPropTypes = PressableProps & {
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

const styles = StyleSheet.create({
  button: {
    backgroundColor: appTheme.colors.primary,
    justifyContent: 'center',
    borderRadius: 8,
    height: BUTTON_HEIGHT,
    paddingHorizontal: appTheme.spacing.lg,
  },
  longButton: {
    width: '100%',
  },
  buttonText: {
    color: appTheme.colors.static_white,
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 17,
  },
  disabledButtonStyle: {
    backgroundColor: appTheme.colors.disabled,
  },
});
